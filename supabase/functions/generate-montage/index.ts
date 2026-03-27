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

    const prompt = `YOU ARE AN ARCHITECTURAL PHOTOMONTAGE ENGINE. YOUR ONLY JOB: PASTE IMAGE 2 INTO THE RED-MARKED AREA OF IMAGE 1.

INPUT:
- IMAGE 1: Original clean photo of a real location (building, terrain, street).
- IMAGE 2: A facade/storefront design. THIS IS THE EXACT VISUAL that must appear in the final image.
- IMAGE 3: Same photo as Image 1, but the user drew RED MARKS on it. The red area = EXACT placement zone.

CRITICAL INSTRUCTIONS — FOLLOW WITH ZERO DEVIATION:

1. USE IMAGE 1 AS THE BASE. The final output must be visually IDENTICAL to Image 1 in every area OUTSIDE the red zone.

2. TAKE THE FACADE FROM IMAGE 2 AND PLACE IT EXACTLY WHERE THE RED MARKS ARE IN IMAGE 3.
   - The facade design (Image 2) must be reproduced FAITHFULLY — same colors, same text, same logo, same proportions, same materials.
   - Do NOT redesign, reinterpret, or reimagine the facade. Copy it as-is.
   - Do NOT change the facade's colors, fonts, brand name, layout, or any detail.

3. PERSPECTIVE: Warp/transform Image 2 so it matches the building's perspective and geometry visible in Image 1. The facade must look like it was physically built there.

4. LIGHTING: Match the lighting direction, shadows, and color temperature from Image 1 so the facade blends naturally.

5. EDGES: Seamlessly blend where the facade meets the existing structure. No harsh cuts.

6. PRESERVE EVERYTHING ELSE: Sky, street, sidewalk, cars, trees, neighboring buildings, signs, poles, people — ALL must remain EXACTLY as in Image 1. ZERO modifications outside the marked area.

7. DO NOT crop, zoom, resize, or change the aspect ratio of the image.

8. THE FACADE IN IMAGE 2 IS SACRED. Reproduce it with maximum fidelity. If it has text, reproduce the text. If it has a logo, reproduce the logo. If it has specific colors, use those exact colors.

OUTPUT: A single photorealistic image showing Image 1 with Image 2's facade inserted in the red-marked zone.`;


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
