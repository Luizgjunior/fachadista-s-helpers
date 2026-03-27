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

    const { locationImage, facadeImage, markedLocationImage } = await req.json();

    if (!locationImage || !facadeImage) {
      return new Response(
        JSON.stringify({ error: "locationImage and facadeImage are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `TASK: Architectural facade photomontage.

You receive exactly 3 images:

IMAGE 1 — ORIGINAL LOCATION PHOTO (clean, unmodified). This is the base photo. The final result MUST be identical to this photo in every pixel EXCEPT the area where the facade is inserted.

IMAGE 2 — FACADE DESIGN to insert. This is the new facade/storefront design.

IMAGE 3 — MARKED LOCATION PHOTO. This is the same location photo but with RED MARKINGS drawn by the user. The red-highlighted area shows EXACTLY where the facade design (image 2) should be placed.

ABSOLUTE RULES:
- Start from IMAGE 1 (the clean original). Keep EVERYTHING unchanged: sky, road, sidewalk, trees, cars, people, poles, signs, neighboring buildings, colors, lighting, shadows — ALL preserved exactly.
- ONLY replace the area that corresponds to the RED MARKINGS in image 3 with the facade from image 2.
- Match the facade's perspective to the building geometry in the photo.
- Match lighting direction and color temperature so the facade looks physically real.
- Blend edges where the facade meets the existing building seamlessly.
- Do NOT change the image dimensions, crop, zoom, or aspect ratio.
- Do NOT alter anything outside the red-marked zone. Zero changes.

Generate the final composited photograph.`;

    const userContent: any[] = [
      { type: "text", text: prompt },
      { type: "image_url", image_url: { url: locationImage } },
      { type: "image_url", image_url: { url: facadeImage } },
    ];

    // Send the marked location (photo + red drawings) so the AI sees exactly where to place
    if (markedLocationImage) {
      userContent.push({ type: "image_url", image_url: { url: markedLocationImage } });
    }

    console.log("Calling AI gateway for montage...");

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
    const choice = data.choices?.[0]?.message;
    let imageUrl: string | null = null;

    // Image generation models return images in message.images array
    if (choice?.images && Array.isArray(choice.images) && choice.images.length > 0) {
      imageUrl = choice.images[0]?.image_url?.url || null;
    }

    // Fallback: check content array
    if (!imageUrl && Array.isArray(choice?.content)) {
      for (const part of choice.content) {
        if (part.type === "image_url" && part.image_url?.url) {
          imageUrl = part.image_url.url;
          break;
        }
      }
    }

    // Fallback: check string content for base64
    if (!imageUrl && typeof choice?.content === "string") {
      const b64Match = choice.content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
      if (b64Match) imageUrl = b64Match[0];
    }

    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data).slice(0, 1000));
      return new Response(
        JSON.stringify({ error: "O modelo não retornou uma imagem. Tente marcar a área com mais clareza e tente novamente." }),
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
