import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ═══════════════════════════════════════════════
   ENRICHMENT MAPS — moved from client
   ═══════════════════════════════════════════════ */

const LIGHTING_MAP: Record<string, string> = {
  'Manhã': 'early morning golden hour sunlight from east at 15-25° elevation, 3200K warm raking light, long soft shadows revealing surface texture, possible morning mist, cool 8000K fill from blue sky in shadows',
  'Tarde': 'high noon direct sunlight at 60-75° elevation, 5500K neutral white daylight, short hard shadows, maximum material color accuracy, strong specular highlights on glass and metal surfaces',
  'Fim de Tarde': 'late afternoon magic hour from west at 10-20° elevation, 2400-2800K ultra-warm golden light, extremely long dramatic shadows, atmospheric golden glow, warm orange on sun-facing surfaces with cool blue shadows',
  'Noturno': 'nighttime architectural photography with no sunlight, warm 3000K LED facade wash uplights, cool 4000K street lamps, interior warm glow through windows, deep navy blue sky, reflective light pools on pavement',
};

const WEATHER_MAP: Record<string, string> = {
  'Dia de Sol': 'clear blue sky, sharp hard shadows with defined umbra and penumbra, maximum color saturation, intense specular reflections on glass and metal',
  'Nublado': 'uniform overcast gray-white sky, no direct shadows, flat even diffuse lighting, muted desaturated color palette',
  'Chuvoso': 'active rain with visible streaks, all surfaces wet and mirror-reflective, puddles with ripple rings, gray low-contrast atmosphere, people with umbrellas',
  'Pós-Chuva': 'post-rain wet reflective pavement mirroring the building, dramatic cumulonimbus clouds breaking apart, shafts of sunlight through cloud gaps, maximum color saturation from clean air, residual puddles',
};

const ENVIRONMENT_MAP: Record<string, string> = {
  'Urbano / Metrópole': 'dense metropolitan urban context with neighboring glass high-rises, urban street furniture, traffic signals, crosswalks, mixed-use ground floor retail',
  'Residencial / Subúrbio': 'low-density residential street with mature trees, domestic-scale neighbors, garden planting, parked family vehicles',
  'Vegetação / Floresta': 'forest edge with mature tree canopy framing, dappled light through leaves, organic ground cover, biophilic integration',
  'Litoral / Marítimo': 'coastal waterfront with sea horizon, salt air atmospheric haze, marine-grade materials, nautical elements',
  'Montanhoso / Alpino': 'mountain terrain with altitude atmospheric clarity, rock formations, conifer forest, snow-capped peaks in background',
  'Industrial / Galpão': 'industrial precinct with warehouse neighbors, loading docks, utilitarian infrastructure, exposed pipes and ducts',
  'Centro Histórico': 'historic city center with heritage facades, cobblestone streets, period cast-iron street furniture, cultural activity',
  'Desértico / Árido': 'arid desert landscape with bleached sky, heat shimmer, sand drift at building base, sparse succulent vegetation, terracotta palette',
};

const STYLE_MAP: Record<string, string> = {
  'Hiper-realista': 'ultra-photorealistic architectural photography, 8K ultra-high resolution, extreme detail at pixel level, indistinguishable from real photograph, Phase One IQ4 150MP medium format, micro-texture on every surface: visible concrete aggregate and pores, wood grain with knot detail, brushed metal directional scratches, glass with fingerprint smudges and dust particles, brick mortar depth variation',
  'V-Ray Render': 'professional V-Ray architectural render, physically-based materials with PBR roughness/metallic maps, V-Ray Sun+Sky, GI with light cache and irradiance map, subtle lens bloom, caustics on glass surfaces, subsurface scattering on marble and translucent panels, 8K resolution with extreme material detail',
  'Unreal Engine 5': 'Unreal Engine 5 real-time render, Nanite geometry with micro-polygon detail, Lumen global illumination with infinite bounces, path-traced reflections, virtual shadow maps, cinematic quality, ray-traced translucency on glass, 8K output resolution',
  'Sketch / Croqui': 'architectural hand-drawn sketch, pencil and ink linework with varying pressure, selective watercolor washes with bleeding edges, paper texture with tooth grain, warm sepia tones, construction lines faintly visible',
  'Maquete Eletrônica': 'digital architectural model, white maquette style, matte materials with subtle surface variation, shallow depth of field with bokeh, scale figures with natural poses, tilt-shift miniature effect',
};

const SIDEWALK_MAP: Record<string, string> = {
  'Concreto Clássico': 'concrete sidewalk with broom-finish texture, expansion joints, edge chipping, gum stains, utility covers',
  'Pedra Portuguesa': 'Portuguese mosaic pavement (calçada portuguesa) with black and white limestone wave pattern, uneven settling, moss in joints',
  'Bloco Intertravado': 'interlocking concrete pavers in herringbone pattern, color variation between units, sand joints with sparse weed growth',
  'Pedra São Tomé': 'São Tomé quartzite flagstone in warm gold-beige tones, natural cleft texture, grouted joints',
  'Gramado com Pisantes': 'lush green grass between stepping stones, organic edges, morning dew on grass blades',
  'Cimento Queimado': 'polished burnished concrete with trowel marks, hairline cracks, steel-troweled sheen, expansion joints',
};

const ASPECT_RATIO_MAP: Record<string, string> = {
  'Instagram / TikTok (9:16)': '9:16',
  'Instagram Portrait (4:5)': '3:4',
  'Post / Feed (1:1)': '1:1',
  'YouTube / TV (16:9)': '16:9',
  'Fotografia (3:2)': '4:3',
  'Cinematográfico (2.35:1)': '16:9',
  'Vertical Clássico (2:3)': '3:4',
  'Nenhuma das opção': '16:9',
};

const CAMERA_ANGLE_MAP: Record<string, string> = {
  'Nível do Olhar': 'Eye-level street photography perspective at approximately 1.6m height, horizontal camera with no tilt, natural human viewpoint',
  'Grande Angular': 'Wide-angle lens perspective (14-24mm equivalent), slight barrel distortion, dramatic spatial depth, capturing full building width',
  'Close-up': 'Close-up architectural detail shot with shallow depth of field, macro-level material texture visibility, tight framing on facade details',
  'Drone / Aéreo': 'Aerial drone perspective at 30-50m elevation, looking down at 30-45° angle, revealing roof geometry and site context, bird\'s-eye urban planning view',
  'Manter ângulo da referência': 'CRITICAL: Reproduce the EXACT camera position, height, tilt, rotation, and viewing direction from the reference image. The viewing angle must be identical — same side of the building visible, same perspective convergence, same horizon placement. Do NOT deviate from the reference camera setup in any way.',
};

interface RenderParams {
  projectType?: string;
  socialFormat?: string;
  visualStyle?: string;
  environmentType?: string;
  cameraAngle?: string;
  lighting?: string;
  weather?: string;
  peopleCount?: number;
  carCount?: number;
  environmentDetails?: string;
  illuminatedSignage?: boolean;
  sidewalkEnabled?: boolean;
  sidewalkType?: string;
}

const buildEnrichedPrompt = (prompt: string, params?: RenderParams): string => {
  if (!params) return prompt;

  const lighting = LIGHTING_MAP[params.lighting || ''] || 'natural optimal daylight conditions';
  const weather = WEATHER_MAP[params.weather || ''] || 'pleasant weather conditions';
  const environment = ENVIRONMENT_MAP[params.environmentType || ''] || 'contextually appropriate environment';
  const style = STYLE_MAP[params.visualStyle || ''] || 'ultra-photorealistic architectural photography';
  const sidewalkDesc = params.sidewalkEnabled && params.sidewalkType && params.sidewalkType !== 'Nenhuma das opção'
    ? SIDEWALK_MAP[params.sidewalkType] || 'realistic sidewalk pavement'
    : 'natural ground integration';

  const cameraAngle = params.cameraAngle && params.cameraAngle !== 'Nenhuma das opção'
    ? CAMERA_ANGLE_MAP[params.cameraAngle] || ''
    : '';

  const parts: string[] = [
    style,
    prompt,
    cameraAngle ? `Camera angle: ${cameraAngle}` : '',
    `Lighting: ${lighting}`,
    `Weather and sky: ${weather}`,
    `Environment: ${environment}`,
    `Ground/sidewalk: ${sidewalkDesc}`,
    `${params.peopleCount ?? 0} people in candid natural poses with realistic clothing and accessories`,
    `${params.carCount ?? 0} contemporary vehicles with metallic paint and environment reflections`,
    params.illuminatedSignage ? 'Illuminated LED backlit signage with warm halo glow and realistic light falloff' : '',
    params.environmentDetails ? `Additional details: ${params.environmentDetails}` : '',
    'Every material with surface micro-texture, correct reflectance, aging appropriate to context',
  ];

  return parts.filter(Boolean).join('. ').trim();
};

const getAspectRatio = (params?: RenderParams): string => {
  if (!params?.socialFormat) return '16:9';
  return ASPECT_RATIO_MAP[params.socialFormat] || '16:9';
};

/* ═══════════════════════════════════════════════
   SYSTEM PROMPT — expanded with negative prompts
   ═══════════════════════════════════════════════ */

const buildSystemPrompt = (aspectRatio: string, projectType?: string, cameraAngle?: string): string => {
  const keepRefAngle = cameraAngle === 'Manter ângulo da referência';

  let cameraInstructions = '';
  if (keepRefAngle) {
    cameraInstructions = `\nCAMERA ANGLE PRESERVATION (HIGHEST PRIORITY — overrides all other camera directives):
- You MUST reproduce the EXACT camera position, height, tilt, pan, and rotation from the reference image.
- If the reference shows the building from the RIGHT side, render it from the RIGHT side. If from the LEFT, render from the LEFT. NEVER mirror or flip.
- Match the EXACT perspective convergence: same vanishing points, same lens focal length feel, same horizon line height.
- If a 3/4 view is shown (e.g., front + right facade), keep the EXACT same proportion of each facade visible.
- The building's position and orientation in the frame must be IDENTICAL to the reference.
- This rule supersedes any other framing or composition guideline.`;
  }
  let projectSpecific = '';
  if (projectType === 'Projeto de Interiores') {
    projectSpecific = `\nPROJECT TYPE: INTERIOR DESIGN
- Focus on interior lighting design, furniture composition, fabric/material textures
- Embedded artificial lighting with proper color temperature and falloff
- Window light interaction with interior surfaces
- Depth layering: foreground objects slightly out of focus`;
  } else if (projectType === 'Planta Arquitetônica' || projectType === 'Detalhamento Técnico') {
    projectSpecific = `\nPROJECT TYPE: ARCHITECTURAL PLAN / TECHNICAL DETAIL
- Clean, precise linework with professional draftsmanship
- High contrast, sharp edges, minimalist palette
- Technical annotation style if appropriate`;
  }

  return `You are a world-class architectural photographer and photorealistic renderer with 30 years of experience shooting buildings for Architectural Digest, Dezeen, and ArchDaily.

CORE IDENTITY:
- You produce images INDISTINGUISHABLE from photographs taken with a Phase One IQ4 150MP or Hasselblad X2D 100C.
- Every image must pass as a real photograph — no CGI artifacts, no AI tells.

OUTPUT FORMAT:
- The output image MUST be in ${aspectRatio} aspect ratio. This is critical — do not deviate.

TECHNICAL STANDARDS:
- Lens physics: accurate depth of field, chromatic aberration at edges, natural vignetting
- Light transport: physically correct global illumination, caustics on glass, subsurface scattering on translucent materials
- Material fidelity: micro-texture on concrete (pores, aggregate), wood grain variation, metal reflections with environment mapping, glass with correct refraction index
- Atmospheric effects: volumetric light through dust/moisture, accurate sky gradient, cloud shadow mapping on surfaces
- Urban context: realistic sidewalk wear patterns, natural vegetation with leaf variation, appropriate street furniture aging
${projectSpecific}
${cameraInstructions}

MATERIAL MICRO-DETAILS (apply to ALL renders):
- Concrete: visible aggregate particles, form-tie holes, hairline cracks, rain staining, efflorescence at base
- Glass: realistic reflections of sky and surroundings, slight green tint at edges, mullion shadows, interior visibility with curtains/furniture
- Metal: directional brushing marks, oxidation patterns, welded joints, fastener heads, anodized color variation
- Wood: grain direction following real lumber, knot detail, weathering silver-gray on exterior, end-grain checks
- Stone: natural veining, fossil inclusions, chisel marks on rough-cut, polished reflections on honed surfaces
- Brick: color variation between individual bricks, mortar recession depth, header/stretcher bond pattern accuracy

ABSOLUTE PROHIBITIONS:
- NO plastic-looking surfaces or uniform textures
- NO floating objects or physically impossible shadows
- NO symmetrical or repeated vegetation patterns
- NO oversaturated or HDR-tonemapped look
- NO text, watermarks, logos, or signatures on the image
- NO invented architectural elements not in the prompt
- NO anime, cartoon, illustration, or painterly styles
- NO blurry or illegible text on building signs
- NO distorted human hands or faces
- NO melted or warped architectural geometry
- NO perspective distortion or converging verticals (unless explicitly requested)
- NO uniform flat sky without cloud detail or atmospheric gradient
- NO identical cloned people or vehicles
- NO moiré patterns on facade grids or railings
- NO color banding in sky gradients or smooth surfaces
- NO aliasing on building edges or window frames
- NO excessive bloom or lens flare artifacts
- NO unnaturally smooth skin on people (maintain pore-level detail)
- NO repeated identical window reflections (each must reflect its actual surroundings)`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada.");

    const body = await req.json();
    const { prompt, referenceImage, params, aspectRatio: clientAspectRatio } = body;
    if (!prompt) throw new Error("Prompt não fornecido.");

    // Enrich prompt server-side if params provided
    const enrichedPrompt = params ? buildEnrichedPrompt(prompt, params) : prompt;
    const aspectRatio = params ? getAspectRatio(params) : (clientAspectRatio || '16:9');
    const systemPrompt = buildSystemPrompt(aspectRatio, params?.projectType, params?.cameraAngle);

    const userContent: any[] = [];

    if (referenceImage) {
      userContent.push({
        type: "image_url",
        image_url: { url: referenceImage },
      });
      userContent.push({
        type: "text",
        text: `REFERENCE IMAGE ATTACHED — use it as the ABSOLUTE BASE STRUCTURE. This is the most critical instruction.

CAMERA ANGLE & ORIENTATION PRESERVATION (HIGHEST PRIORITY):
- The output image MUST be rendered from the EXACT SAME camera position, angle, height, and direction as the reference image.
- If the building in the reference is viewed from the RIGHT side, the render MUST show the right side. If from the LEFT, show the left side. NEVER mirror or flip the viewing direction.
- Preserve the EXACT perspective: same vanishing points, same horizon line height, same lens focal length impression.
- If the reference shows a 3/4 view (e.g., front + right side visible), the render must show the SAME 3/4 view with the same proportions of each facade visible.
- If the camera is at street level looking slightly up, maintain that EXACT elevation angle.
- If the camera is elevated (drone/aerial), maintain that EXACT bird's-eye angle.
- The building's orientation in the frame (centered, left-aligned, right-aligned) must match the reference EXACTLY.

GEOMETRY PRESERVATION RULES:
- Keep the EXACT building footprint, floor count, window positions, roof line, and facade proportions from the reference photo.
- Preserve the EXACT number of floors, balconies, and structural bays visible.
- Do NOT add, remove, or relocate windows, doors, balconies, or structural elements unless the prompt explicitly says so.
- The building silhouette and massing must be pixel-level faithful to the reference.

ASPECT RATIO: Output MUST be ${aspectRatio}.

RENDERING DIRECTIVES:
- Apply every material, lighting, weather, and environmental specification from the master prompt below with surgical precision.
- Render micro-details: mortar lines between bricks, rain streaks on glass, dust on ledges, rust on metal fixtures.
- Vegetation must have botanical accuracy — correct leaf shapes, natural growth patterns, seasonal consistency.
- People and vehicles (if specified) must have correct scale relative to the building and cast proper shadows.

MASTER PROMPT TO RENDER:
${enrichedPrompt}`,
      });
    } else {
      userContent.push({
        type: "text",
        text: `Generate an ultra-photorealistic architectural photograph following every specification below. The result must be indistinguishable from a real photo shot on a medium-format camera.

ASPECT RATIO: Output MUST be ${aspectRatio}.

Render micro-details: material textures at close inspection, accurate light bounce between surfaces, atmospheric depth with subtle haze. Vegetation must be botanically accurate. People/vehicles must be correctly scaled with proper shadows.

MASTER PROMPT TO RENDER:
${enrichedPrompt}`,
      });
    }

    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      console.log(`Gerando imagem via Gemini Image, tentativa ${attempt + 1}/${maxRetries}, aspect ratio: ${aspectRatio}`);

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
            { role: "system", content: systemPrompt },
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
          console.log("Imagem gerada com sucesso");
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
