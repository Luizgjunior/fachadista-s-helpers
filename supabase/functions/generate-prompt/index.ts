import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada.");

    const { images, promptText } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new Error("Nenhuma imagem fornecida.");
    }

    // Build multimodal content for OpenAI-compatible API
    const userContent: any[] = [];

    for (const img of images) {
      userContent.push({
        type: "image_url",
        image_url: { url: img }, // data:image/...;base64,... format
      });
    }

    userContent.push({ type: "text", text: promptText });

    console.log("Calling Lovable AI Gateway with", images.length, "images");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: ARCHVIZ_SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "archviz_prompt",
              description: "Return the architectural visualization prompt",
              parameters: {
                type: "object",
                properties: {
                  english: { type: "string", description: "Master prompt in English, 300+ words" },
                  portuguese: { type: "string", description: "Technical analysis in Portuguese, 150+ words" },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                    description: "5 hyper-specific technical tags",
                  },
                },
                required: ["english", "portuguese", "tags"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "archviz_prompt" } },
      }),
    });

    if (!response.ok) {
      const statusCode = response.status;
      const errorText = await response.text();
      console.error("Lovable AI Gateway error:", statusCode, errorText);

      if (statusCode === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Aguarde um momento e tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (statusCode === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos em Settings > Workspace > Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI Gateway error: ${statusCode} - ${errorText}`);
    }

    const data = await response.json();
    console.log("AI Gateway response received");

    // Extract from tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let parsed;

    if (toolCall?.function?.arguments) {
      parsed = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try to parse from content
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("Nenhuma resposta gerada pela IA.");
      
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
