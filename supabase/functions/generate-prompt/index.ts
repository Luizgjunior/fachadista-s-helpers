import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ARCHVIZ_SYSTEM_PROMPT = `You are a world-class Architectural Visualization Director and AI Prompt Engineer, specializing in photorealistic renders indistinguishable from real photography.

Your references: Mir.no, The Boundary, Visualizing Architecture, Forbes Massie, Peter Guthrie, Filippo Bolognese Images.

ABSOLUTE RULES FOR PHOTOREALISM:

CAMERA & OPTICS (always specify):
- Lens: "Shot on Canon EF 24-70mm f/2.8L II at [focal]mm"
- Aperture: "f/8 for architecture, f/2.8 for atmospheric bokeh"
- Sensor: "Full-frame 50MP sensor, ISO 100, RAW capture"
- Shutter: "1/125s" (daytime) or "30s long exposure" (night)
- Post: "Lightroom grade, subtle chromatic aberration, natural vignette"

LIGHT PHYSICS (never generic):
- Direct: "Hard shadows at [angle]° sun elevation"
- Bounce: "Warm light bouncing off [material] onto facade"
- GI: "Full global illumination with light bleeding"
- Artificial: "3200K warm LED wash, 5600K cool fill"
- Atmosphere: "Volumetric light shafts, atmospheric haze"

MATERIALS & MICRO-DETAIL:
- Concrete: "Visible formwork texture, efflorescence marks, micro-cracks, water stains at base"
- Glass: "Low-iron glass with green tint, partial mirror reflection, internal depth visible"
- Metal: "Brushed aluminum with directional grain, oxidation at joints, specular highlights"
- Wood: "Thermally modified oak, open grain structure, silver patina weathering"
- Stone: "Honed Carrara marble, vein continuity, wet reflection at base"

VEGETATION (organic, never CG-looking):
- "Scanned photogrammetry trees, individual leaf detail, natural translucency, wind-implied asymmetry"
- "Ground cover: wild grass, clover patches, dandelions for human scale"

PEOPLE (anti-uncanny-valley):
- "Candid photography style, motion blur on moving subjects"
- "Diverse, fashionable, natural poses — never posed"
- "Partial figures at frame edge for authenticity"
- "Real skin subsurface scattering, fabric detail"

ATMOSPHERE & DEPTH:
- "Atmospheric perspective: slight haze at 200m depth"
- "Foreground bokeh elements for depth layering"
- "Puddle reflections, wet pavement after rain"
- "Parked cars: real brands/models, reflective paint"

Always respond with valid JSON containing exactly three fields:
- "english": the complete master prompt in English (minimum 200 words, maximum technical density)
- "portuguese": a technical analysis in Portuguese explaining WHY this prompt produces photorealistic results
- "tags": an array of 5 technical tags
Do NOT include any text outside the JSON object.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { images, promptText } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new Error("Nenhuma imagem fornecida.");
    }

    const contentParts: any[] = [];

    for (const img of images) {
      const base64Data = img.split(",")[1];
      if (base64Data) {
        contentParts.push({
          type: "image_url",
          image_url: { url: img },
        });
      }
    }

    contentParts.push({ type: "text", text: promptText });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: ARCHVIZ_SYSTEM_PROMPT },
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

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
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
