import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const IMAGE_SYSTEM_PROMPT = `You are an ultra-realistic architectural photography AI. Generate images that are completely indistinguishable from professional architectural photography.
Requirements:
- Photorealistic quality, NOT a 3D render look
- Magazine-quality architectural photography (Dezeen, Archdaily)
- Correct perspective, natural lighting physics
- Real material textures at maximum detail
- Natural human figures in candid poses
- Environment-appropriate vegetation and vehicles
- 8K resolution quality, sharp focus throughout`;

async function callWithRetry(apiKey: string, prompt: string, maxRetries = 3): Promise<Response> {
  const models = [
    "google/gemini-3.1-flash-image-preview",
    "google/gemini-3-flash-image-preview",
    "google/gemini-2.5-flash-image",
  ];

  for (const model of models) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      console.log(`Trying model: ${model}, attempt ${attempt + 1}`);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: IMAGE_SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (response.status === 429 && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt + 1) * 1500;
        console.log(`Rate limited. Retrying in ${delay}ms`);
        await sleep(delay);
        continue;
      }

      if (response.status === 404 || response.status === 400) {
        console.log(`Model ${model} not available, trying next`);
        break;
      }

      return response;
    }
  }

  throw new Error("Todos os modelos falharam após múltiplas tentativas.");
}

function extractImageUrl(data: any): string | null {
  const img1 = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (img1) return img1;

  const content = data?.choices?.[0]?.message?.content;
  if (Array.isArray(content)) {
    for (const part of content) {
      if ((part.type === "image_url" || part.type === "image") && part.image_url?.url) {
        return part.image_url.url;
      }
    }
  }

  if (typeof content === "string" && content.startsWith("data:image")) {
    return content;
  }

  const img4 = data?.choices?.[0]?.message?.image_url?.url;
  if (img4) return img4;

  console.log("Full response structure:", JSON.stringify(data, null, 2));
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { prompt } = await req.json();
    if (!prompt) throw new Error("Prompt não fornecido.");

    const response = await callWithRetry(LOVABLE_API_KEY, prompt);

    if (!response.ok) {
      const statusCode = response.status;
      const errorText = await response.text();
      console.error("AI Gateway error:", statusCode, errorText);

      if (statusCode === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (statusCode === 402) {
        return new Response(JSON.stringify({ error: "Créditos da plataforma esgotados. Contate o suporte." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Erro no gateway IA: ${statusCode} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Model used:", data?.model || "unknown");

    const imageUrl = extractImageUrl(data);
    console.log("Image URL length:", imageUrl?.length || 0);
    console.log("Image URL prefix:", imageUrl?.substring(0, 50));

    if (!imageUrl) {
      throw new Error("Nenhuma imagem retornada. Tente novamente.");
    }

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-render error:", e);
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
