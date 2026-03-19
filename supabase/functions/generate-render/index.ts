import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada.");

    const { prompt, referenceImage } = await req.json();
    if (!prompt) throw new Error("Prompt não fornecido.");

    // Build user content with optional reference image
    const userContent: any[] = [];

    if (referenceImage) {
      userContent.push({
        type: "image_url",
        image_url: { url: referenceImage },
      });
      userContent.push({
        type: "text",
        text: `Using the attached reference image as the architectural base, generate an enhanced photorealistic render. Maintain the structure, proportions, and layout from the reference while applying the following specifications:\n\n${prompt}`,
      });
    } else {
      userContent.push({
        type: "text",
        text: `Generate an ultra-photorealistic architectural image:\n\n${prompt}`,
      });
    }

    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      console.log(`Gerando imagem via Nano Banana 2, tentativa ${attempt + 1}/${maxRetries}`);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          modalities: ["image", "text"],
          messages: [
            {
              role: "user",
              content: userContent,
            },
          ],
        }),
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
        console.error("AI Gateway error:", statusCode, errorText);

        if (statusCode === 429) {
          return new Response(
            JSON.stringify({ error: "Limite de requisições. Tente em alguns segundos." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (statusCode === 402) {
          return new Response(
            JSON.stringify({ error: "Créditos esgotados. Adicione créditos em Settings > Workspace > Usage." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error(`AI Gateway error: ${statusCode} - ${errorText}`);
      }

      const data = await response.json();
      const message = data.choices?.[0]?.message;

      // Extract image from message.images array (Nano Banana format)
      const images = message?.images;
      if (images && images.length > 0) {
        const imageUrl = images[0]?.image_url?.url;
        if (imageUrl) {
          console.log("Imagem gerada com sucesso via Nano Banana 2");
          return new Response(
            JSON.stringify({ imageUrl }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      console.log("Nenhuma imagem na resposta, tentando novamente...");
      if (attempt < maxRetries - 1) {
        await sleep(1500);
        continue;
      }

      throw new Error("O modelo não retornou uma imagem. Tente novamente.");
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
