import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { locationImage, facadeImage, maskImage } = await req.json();

    if (!locationImage || !facadeImage) {
      return new Response(
        JSON.stringify({ error: "locationImage and facadeImage are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `You are an expert architectural photomontage artist. 

I'm giving you three images:
1. A LOCATION PHOTO - the real-world site
2. A FACADE DESIGN - the architectural render/design to insert
3. A MASK (red markings on the location photo showing exactly where the facade goes)

TASK: Insert the facade design into the marked red area of the location photo. Create a photorealistic composite that:
- Matches perspective, lighting, shadows and scale of the location
- Blends edges naturally
- Preserves surrounding environment (sky, vegetation, buildings, sidewalk)
- Adjusts color temperature to match ambient lighting
- Adds appropriate shadows and reflections

Generate ONLY the final composited image.`;

    const userContent: any[] = [
      { type: "text", text: prompt },
      { type: "image_url", image_url: { url: locationImage } },
      { type: "image_url", image_url: { url: facadeImage } },
    ];

    if (maskImage) {
      userContent.push({ type: "image_url", image_url: { url: maskImage } });
    }

    console.log("Calling AI gateway with gemini-3-pro-image-preview...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          { role: "user", content: userContent },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos AI esgotados. Contate o administrador." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Erro ao gerar montagem. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("Response keys:", JSON.stringify(Object.keys(data)));
    
    const choice = data.choices?.[0]?.message;
    let imageUrl: string | null = null;

    // Image generation models return images in message.images array
    if (choice?.images && Array.isArray(choice.images) && choice.images.length > 0) {
      imageUrl = choice.images[0]?.image_url?.url || null;
      console.log("Found image in images array");
    }

    // Fallback: check content array
    if (!imageUrl && Array.isArray(choice?.content)) {
      for (const part of choice.content) {
        if (part.type === "image_url" && part.image_url?.url) {
          imageUrl = part.image_url.url;
          console.log("Found image in content array");
          break;
        }
      }
    }

    // Fallback: check string content for base64
    if (!imageUrl && typeof choice?.content === "string") {
      const b64Match = choice.content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
      if (b64Match) {
        imageUrl = b64Match[0];
        console.log("Found image in string content");
      }
    }

    if (!imageUrl) {
      console.error("No image in response. Choice keys:", choice ? JSON.stringify(Object.keys(choice)) : "null");
      console.error("Response snippet:", JSON.stringify(data).slice(0, 1000));
      return new Response(
        JSON.stringify({ error: "O modelo não retornou uma imagem. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ imageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-montage error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
