import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const ASPECT_RATIO_MAP: Record<string, { width: number; height: number }> = {
  "9:16": { width: 768, height: 1344 },
  "3:4": { width: 768, height: 1024 },
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1344, height: 768 },
  "4:3": { width: 1024, height: 768 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FAL_KEY = Deno.env.get("FAL_KEY");
    if (!FAL_KEY) throw new Error("FAL_KEY não configurada.");

    const { prompt, aspectRatio, referenceImage } = await req.json();
    if (!prompt) throw new Error("Prompt não fornecido.");

    const size = ASPECT_RATIO_MAP[aspectRatio] || ASPECT_RATIO_MAP["16:9"];

    // Decide: image-to-image (with reference) or text-to-image (without)
    const hasReference = !!referenceImage;
    const endpoint = hasReference
      ? "https://fal.run/fal-ai/flux/dev/image-to-image"
      : "https://fal.run/fal-ai/flux/schnell";

    const body: Record<string, any> = {
      prompt,
      num_images: 1,
      enable_safety_checker: false,
    };

    if (hasReference) {
      // image-to-image: send reference image + strength
      body.image_url = referenceImage; // base64 data URI or URL
      body.strength = 0.75; // balance between reference fidelity and prompt creativity
      body.num_inference_steps = 35;
      body.guidance_scale = 7.5;
      body.image_size = { width: size.width, height: size.height };
    } else {
      // text-to-image: use preset size names
      const sizePresetMap: Record<string, string> = {
        "9:16": "portrait_16_9",
        "3:4": "portrait_4_3",
        "1:1": "square_hd",
        "16:9": "landscape_16_9",
        "4:3": "landscape_4_3",
      };
      body.image_size = sizePresetMap[aspectRatio] || "landscape_16_9";
    }

    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      console.log(`Gerando imagem via fal.ai (${hasReference ? 'img2img' : 'txt2img'}), tentativa ${attempt + 1}/${maxRetries}`);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Key ${FAL_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.status === 429 && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt + 1) * 2000;
        console.log(`Rate limit 429. Aguardando ${delay}ms`);
        await sleep(delay);
        continue;
      }

      if (!response.ok) {
        const statusCode = response.status;
        const errorText = await response.text();
        console.error("fal.ai API error:", statusCode, errorText);

        if (statusCode === 429) {
          return new Response(
            JSON.stringify({ error: "Limite de requisições. Tente em alguns segundos." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (statusCode === 401 || statusCode === 403) {
          return new Response(
            JSON.stringify({ error: "FAL_KEY inválida ou sem permissão." }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error(`Erro fal.ai API: ${statusCode} - ${errorText}`);
      }

      const data = await response.json();
      console.log("fal.ai response images:", data.images?.length);

      const imageUrl = data.images?.[0]?.url;
      if (!imageUrl) {
        throw new Error("Nenhuma imagem retornada na resposta.");
      }

      console.log("Imagem gerada com sucesso via fal.ai");
      return new Response(
        JSON.stringify({ imageUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Limite de tentativas excedido. Tente novamente.");

  } catch (e) {
    console.error("generate-render error:", e);
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
