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

    const prompt = `You are a precision architectural photomontage tool. Your ONLY job is to place a facade design onto a location photo.

CRITICAL RULES — FOLLOW EXACTLY:
1. The LOCATION PHOTO (image 1) is the BASE. You must preserve it PIXEL-PERFECTLY. Do NOT alter, modify, recolor, reshape, or reimagine ANY part of the location photo except the exact area marked in red.
2. The FACADE DESIGN (image 2) is what must be placed INTO the red-marked area ONLY.
3. The MASK (image 3) shows the red-marked zone — this is the ONLY area you may change.

STRICT PRESERVATION REQUIREMENTS:
- The sky, clouds, trees, cars, people, sidewalk, road, neighboring buildings, poles, wires, signs — ALL must remain 100% identical to the original location photo.
- Do NOT change lighting, color grading, saturation, contrast, or any visual property of the original photo.
- Do NOT add, remove, or modify any object outside the marked area.
- Do NOT crop, resize, or change the aspect ratio of the original photo.
- The output image must have the EXACT same composition, framing, and dimensions as the location photo.

FACADE INSERTION RULES:
- Place the facade design ONLY within the red-marked boundaries.
- Adjust the facade's perspective to match the building's perspective in the location photo.
- Match the facade's lighting direction and intensity to the existing photo lighting.
- Blend the facade edges naturally at the boundary so it looks physically attached to the building.
- The facade should look like it was physically built there and photographed — not digitally composited.

OUTPUT: Generate the final image — identical to the location photo but with the facade inserted in the marked area. Nothing else changes.`;

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
