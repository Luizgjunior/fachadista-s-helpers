import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MODELS = ["gemini-2.5-pro", "gemini-2.5-flash"] as const;

const ARCHVIZ_SYSTEM_PROMPT = `You are the world's leading Architectural Visualization Director and Computational Photography Expert. Your renders are published in Dezeen, Archdaily, Wallpaper*, Architectural Digest, and Phaidon. Your work is consistently mistaken for real photography.

YOUR CORE MISSION:
Transform any architectural reference into a photorealistic master prompt that produces 8K images indistinguishable from photography, adapted perfectly to whatever environment and atmosphere the user specifies.

UNIVERSAL PHOTOREALISM RULES:

[1] CAMERA SYSTEM — Always specify full technical setup:
- Body: Phase One IQ4 150MP or Sony A7R V or Hasselblad X2D 100C
- Lens: 24-70mm f/2.8 (standard), 16-35mm (wide), 85mm f/1.4 (intimate)
- Settings: f/8 ISO 50-100 for day | f/2.8 ISO 800 for night
- Tripod-mounted, bubble level, perspective correction
- Camera height: 1.60m eye-level (default) or drone altitude

[2] LIGHT PHYSICS — Never describe light generically:
- Sun position: exact degrees elevation and compass direction
- Color temperature: 2700K (sunset) to 5500K (noon) to 8000K (shade)
- Shadow behavior: hard umbra + soft penumbra ratio
- GI: full global illumination with light bleeding at material joints
- Volumetrics: atmospheric haze at 300m depth

[3] MATERIAL MICRO-DETAIL — Every material needs 4 properties:
- Surface finish, aging/weathering state, texture scale, reflectivity

[4] VEGETATION — Organic and environment-specific species

[5] HUMAN FIGURES — Candid photography style, motion blur, real skin SSS, diverse ethnicity

[6] VEHICLES — Context-appropriate, metallic paint, realistic parking

[7] ENVIRONMENT — Match atmosphere exactly to specified context

[8] OUTPUT: JSON with english (300+ words), portuguese (150+ words), tags (5 hyper-specific technical tags)

Do NOT include any text outside the JSON object.`;

const extractRetryDelayMs = (errorText: string, attempt: number) => {
  const match = errorText.match(/retry in\s+(\d+(?:\.\d+)?)s/i) || errorText.match(/"retryDelay":\s*"(\d+)s"/i);
  if (match) {
    const seconds = Number(match[1]);
    if (!Number.isNaN(seconds)) {
      return Math.ceil(seconds * 1000);
    }
  }

  return Math.pow(2, attempt + 1) * 1500;
};

async function callGeminiWithFallback(apiKey: string, parts: any[]) {
  let lastStatus = 500;
  let lastErrorText = "";

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      console.log(`generate-prompt trying model=${model} attempt=${attempt + 1}`);
      await sleep(250);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: ARCHVIZ_SYSTEM_PROMPT }],
            },
            contents: [
              {
                role: "user",
                parts,
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                properties: {
                  english: { type: "STRING" },
                  portuguese: { type: "STRING" },
                  tags: {
                    type: "ARRAY",
                    items: { type: "STRING" },
                  },
                },
                required: ["english", "portuguese", "tags"],
              },
            },
          }),
        }
      );

      if (response.ok) {
        console.log(`generate-prompt success model=${model}`);
        return response;
      }

      const errorText = await response.text();
      lastStatus = response.status;
      lastErrorText = errorText;
      console.error(`Gemini API error model=${model} status=${response.status}:`, errorText);

      if ((response.status === 400 || response.status === 404) && model !== MODELS[MODELS.length - 1]) {
        break;
      }

      if (response.status === 429 && attempt < 2) {
        const delay = extractRetryDelayMs(errorText, attempt);
        console.log(`generate-prompt rate limited model=${model}, retrying in ${delay}ms`);
        await sleep(delay);
        continue;
      }

      if (response.status !== 429) {
        break;
      }
    }
  }

  return new Response(lastErrorText || "Erro Gemini API", { status: lastStatus });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("VITE_GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("VITE_GEMINI_API_KEY não configurada.");

    const { images, promptText } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new Error("Nenhuma imagem fornecida.");
    }

    const parts: any[] = [];

    for (const img of images) {
      const base64Data = img.split(",")[1];
      const mimeType = img.split(";")[0].split(":")[1] || "image/jpeg";
      if (base64Data) {
        parts.push({
          inline_data: {
            mime_type: mimeType,
            data: base64Data,
          },
        });
      }
    }

    parts.push({ text: promptText });

    const response = await callGeminiWithFallback(GEMINI_API_KEY, parts);

    if (!response.ok) {
      const statusCode = response.status;
      const errorText = await response.text();

      if (statusCode === 429) {
        return new Response(
          JSON.stringify({ error: "A chave do Google AI atingiu o limite de uso/quota. Aguarde um pouco ou troque para uma chave com billing ativo." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (statusCode === 403) {
        return new Response(
          JSON.stringify({ error: "API Key inválida ou sem permissão para o modelo selecionado." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`Erro Gemini API: ${statusCode} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error("Nenhuma resposta gerada pela IA.");
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Formato de resposta inválido.");
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-prompt error:", e);
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
