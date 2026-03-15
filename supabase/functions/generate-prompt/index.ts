import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { images, promptText } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new Error("Nenhuma imagem fornecida.");
    }

    // Build multimodal content with images
    const contentParts: any[] = [];

    for (const img of images) {
      // img is a data URL like "data:image/jpeg;base64,..."
      const base64Data = img.split(",")[1];
      if (base64Data) {
        contentParts.push({
          type: "image_url",
          image_url: { url: img },
        });
      }
    }

    contentParts.push({ type: "text", text: promptText });

    const systemPrompt = `You are an expert architectural visualization prompt generator. 
Always respond with valid JSON containing exactly three fields:
- "english": the complete master prompt in English
- "portuguese": a brief technical analysis in Portuguese  
- "tags": an array of 5 technical tags
Do NOT include any text outside the JSON object.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contentParts },
        ],
      }),
    });

    if (!response.ok) {
      const statusCode = response.status;
      if (statusCode === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (statusCode === 402) {
        return new Response(JSON.stringify({ error: "Créditos da plataforma esgotados. Contate o suporte." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", statusCode, errorText);
      throw new Error(`Erro no gateway IA: ${statusCode}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Nenhuma resposta gerada pela IA.");
    }

    // Parse the JSON from the response
    let parsed;
    try {
      // Try direct parse first
      parsed = JSON.parse(content);
    } catch {
      // Try extracting JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try finding JSON object in the text
        const objMatch = content.match(/\{[\s\S]*\}/);
        if (objMatch) {
          parsed = JSON.parse(objMatch[0]);
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
