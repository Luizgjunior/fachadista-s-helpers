import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const SYSTEM_PROMPT = `You are a world-class architectural photographer and photorealistic renderer with 30 years of experience shooting buildings for Architectural Digest, Dezeen, and ArchDaily.

CORE IDENTITY:
- You produce images INDISTINGUISHABLE from photographs taken with a Phase One IQ4 150MP or Hasselblad X2D 100C.
- Every image must pass as a real photograph — no CGI artifacts, no AI tells.

TECHNICAL STANDARDS:
- Lens physics: accurate depth of field, chromatic aberration at edges, natural vignetting
- Light transport: physically correct global illumination, caustics on glass, subsurface scattering on translucent materials
- Material fidelity: micro-texture on concrete (pores, aggregate), wood grain variation, metal reflections with environment mapping, glass with correct refraction index
- Atmospheric effects: volumetric light through dust/moisture, accurate sky gradient, cloud shadow mapping on surfaces
- Urban context: realistic sidewalk wear patterns, natural vegetation with leaf variation, appropriate street furniture aging

ABSOLUTE PROHIBITIONS:
- NO plastic-looking surfaces or uniform textures
- NO floating objects or physically impossible shadows
- NO symmetrical or repeated vegetation patterns
- NO oversaturated or HDR-tonemapped look
- NO text, watermarks, logos, or signatures on the image
- NO invented architectural elements not in the prompt
- NO anime, cartoon, illustration, or painterly styles`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada.");

    const { prompt, referenceImage } = await req.json();
    if (!prompt) throw new Error("Prompt não fornecido.");

    const userContent: any[] = [];

    if (referenceImage) {
      userContent.push({
        type: "image_url",
        image_url: { url: referenceImage },
      });
      userContent.push({
        type: "text",
        text: `REFERENCE IMAGE ATTACHED — use it as the BASE STRUCTURE.

GEOMETRY PRESERVATION RULES:
- Keep the EXACT building footprint, floor count, window positions, roof line, and facade proportions from the reference photo.
- Maintain the precise camera angle, perspective lines, and vanishing points.
- Do NOT add, remove, or relocate windows, doors, balconies, or structural elements unless the prompt explicitly says so.

RENDERING DIRECTIVES:
- Apply every material, lighting, weather, and environmental specification from the master prompt below with surgical precision.
- Render micro-details: mortar lines between bricks, rain streaks on glass, dust on ledges, rust on metal fixtures.
- Vegetation must have botanical accuracy — correct leaf shapes, natural growth patterns, seasonal consistency.
- People and vehicles (if specified) must have correct scale relative to the building and cast proper shadows.

MASTER PROMPT TO RENDER:
${prompt}`,
      });
    } else {
      userContent.push({
        type: "text",
        text: `Generate an ultra-photorealistic architectural photograph following every specification below. The result must be indistinguishable from a real photo shot on a medium-format camera.

Render micro-details: material textures at close inspection, accurate light bounce between surfaces, atmospheric depth with subtle haze. Vegetation must be botanically accurate. People/vehicles must be correctly scaled with proper shadows.

MASTER PROMPT TO RENDER:
${prompt}`,
      });
    }

    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      console.log(`Gerando imagem via Nano Banana Pro, tentativa ${attempt + 1}/${maxRetries}`);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image-preview",
          modalities: ["image", "text"],
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userContent },
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

      const images = message?.images;
      if (images && images.length > 0) {
        const imageUrl = images[0]?.image_url?.url;
        if (imageUrl) {
          console.log("Imagem gerada com sucesso via Nano Banana Pro");
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
