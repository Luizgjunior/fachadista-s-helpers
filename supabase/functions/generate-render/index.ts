import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const ASPECT_RATIO_MAP: Record<string, string> = {
  "9:16": "9:16",
  "3:4": "3:4",
  "1:1": "1:1",
  "16:9": "16:9",
  "4:3": "4:3",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("VITE_GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("VITE_GEMINI_API_KEY não configurada.");

    const { prompt, aspectRatio } = await req.json();
    if (!prompt) throw new Error("Prompt não fornecido.");

    const ratio = ASPECT_RATIO_MAP[aspectRatio] || "16:9";

    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      console.log(`Gerando imagem, tentativa ${attempt + 1}/${maxRetries}`);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              responseModalities: ["IMAGE", "TEXT"],
              imageGenerationConfig: {
                numberOfImages: 1,
                aspectRatio: ratio,
              },
            },
          }),
        }
      );

      if (response.status === 429 && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt + 1) * 2000;
        console.log(`Rate limit 429. Aguardando ${delay}ms`);
        await sleep(delay);
        continue;
      }

      if (!response.ok) {
        const statusCode = response.status;
        const errorText = await response.text();
        console.error("Gemini Image API error:", statusCode, errorText);

        if (statusCode === 429) {
          return new Response(
            JSON.stringify({ error: "Limite de requisições. Tente em alguns segundos." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (statusCode === 403) {
          return new Response(
            JSON.stringify({ error: "API Key sem permissão para geração de imagens." }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error(`Erro Gemini Image API: ${statusCode} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Response candidates:", data.candidates?.length);

      for (const candidate of data.candidates || []) {
        for (const part of candidate.content?.parts || []) {
          if (part.inlineData?.data) {
            const mimeType = part.inlineData.mimeType || "image/png";
            const imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
            console.log("Imagem gerada com sucesso, mime:", mimeType);
            return new Response(
              JSON.stringify({ imageUrl }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }

      throw new Error("Nenhuma imagem retornada na resposta.");
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
