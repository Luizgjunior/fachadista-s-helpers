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

    // Extract base64 data from data URLs
    const extractBase64 = (dataUrl: string) => {
      const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!match) return null;
      return { mimeType: `image/${match[1]}`, data: match[2] };
    };

    const locationData = extractBase64(locationImage);
    const facadeData = extractBase64(facadeImage);
    const maskData = maskImage ? extractBase64(maskImage) : null;

    if (!locationData || !facadeData) {
      return new Response(
        JSON.stringify({ error: "Invalid image format. Must be base64 data URLs." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an expert architectural photomontage artist. Your task is to seamlessly composite a facade design onto a location photograph.

INSTRUCTIONS:
1. The first image is the LOCATION PHOTO - the real-world site where the facade should be placed.
2. The second image is the FACADE DESIGN - the architectural render/design to be inserted.
3. The third image (if provided) is a MASK showing the exact area (white regions on black background) where the facade should be placed on the location photo.

REQUIREMENTS:
- Insert the facade design into the marked area of the location photo with photorealistic quality.
- Match the perspective, lighting, shadows, and scale of the location photo.
- Blend edges naturally so the composition looks like a real photograph.
- Preserve the surrounding environment (sky, vegetation, neighboring buildings, sidewalk).
- Adjust the facade's color temperature and brightness to match the ambient lighting.
- Add appropriate shadows and reflections.
- The result should look like a professional architectural photomontage.

Generate ONLY the final composited image. No text, no explanations.`;

    // Build messages with images
    const userContent: any[] = [
      {
        type: "text",
        text: "Please composite the facade design onto the location photo in the area indicated by the mask. Create a photorealistic result.",
      },
      {
        type: "image_url",
        image_url: { url: `data:${locationData.mimeType};base64,${locationData.data}` },
      },
      {
        type: "image_url",
        image_url: { url: `data:${facadeData.mimeType};base64,${facadeData.data}` },
      },
    ];

    if (maskData) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:${maskData.mimeType};base64,${maskData.data}` },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
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
    const choice = data.choices?.[0]?.message;

    // Extract image from response
    let imageUrl: string | null = null;

    if (choice?.content) {
      // Check if content is an array (multimodal response)
      if (Array.isArray(choice.content)) {
        for (const part of choice.content) {
          if (part.type === "image_url" && part.image_url?.url) {
            imageUrl = part.image_url.url;
            break;
          }
        }
      } else if (typeof choice.content === "string") {
        // Check if it's a base64 image embedded in text
        const b64Match = choice.content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
        if (b64Match) {
          imageUrl = b64Match[0];
        }
      }
    }

    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data).slice(0, 500));
      return new Response(
        JSON.stringify({ error: "O modelo não retornou uma imagem. Tente novamente com uma marcação mais clara." }),
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
