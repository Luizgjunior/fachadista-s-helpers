import { PromptParameters, GeneratedPrompt } from "@/types/fachadista";
import { supabase } from "@/integrations/supabase/client";

/* ═══════════════════════════════════════════════
   PROMPT TEXT BUILDER — sent to LLM for analysis
   ═══════════════════════════════════════════════ */

const buildPromptText = (params: PromptParameters): string => {
  const sections: string[] = [];

  // ── Project Type ──
  const projectDescriptions: Record<string, string> = {
    'Fachada Comercial': 'Commercial storefront/office building facade — emphasize brand visibility, signage placement, entrance hierarchy, and street-level engagement',
    'Residencial': 'Residential building facade — emphasize warmth, livability, private/public boundary, balcony details, and domestic scale',
    'Industrial': 'Industrial/warehouse facility — emphasize structural honesty, large-span elements, loading areas, and utilitarian aesthetics',
    'Planta Arquitetônica': 'Architectural floor plan visualization — emphasize spatial flow, room proportions, and functional zoning',
    'Detalhamento Técnico': 'Technical architectural detail — emphasize construction joints, material transitions, fastening systems, and dimensional accuracy',
    'Projeto de Interiores': 'Interior design project — emphasize furniture layout, material palette, lighting design, and spatial atmosphere',
  };
  if (params.projectType !== 'Nenhuma das opção') {
    sections.push(`PROJECT TYPE: ${params.projectType}\n${projectDescriptions[params.projectType] || params.projectType}`);
  }

  // ── Render Style ──
  const styleDescriptions: Record<string, string> = {
    'Hiper-realista': 'HYPER-REALISTIC PHOTOGRAPHY — The output must be 100% indistinguishable from a real photograph. Use Phase One IQ4 150MP medium-format camera simulation. Include lens aberrations, micro-dust on glass, sensor noise at ISO 50, and chromatic fringing at frame edges. Materials must show real-world aging: concrete efflorescence, glass fingerprints, metal oxidation patina, paint UV fading.',
    'V-Ray Render': 'V-RAY PROFESSIONAL RENDER — Clean architectural visualization style. Physically-based materials with calibrated IOR values. V-Ray Sun+Sky system. Subtle GI with brute force + light cache. Render elements: reflection, refraction, GI, specular, shadow. Post-processing: slight lens bloom, chromatic aberration, vignette.',
    'Unreal Engine 5': 'UNREAL ENGINE 5 REAL-TIME RENDER — Nanite micro-polygon geometry. Lumen global illumination with infinite light bounces. Virtual Shadow Maps for pixel-perfect shadows. Mega Lights for thousands of dynamic light sources. Path-traced reflections on glossy surfaces. Temporal Super Resolution upscaling.',
    'Sketch / Croqui': 'ARCHITECTURAL SKETCH STYLE — Hand-drawn pencil/ink linework with selective watercolor washes. Loose confident strokes. Perspective construction lines visible. Entourage rendered as gestural figures. Paper texture background. Warm sepia/graphite tones with one accent color.',
    'Maquete Eletrônica': 'DIGITAL ARCHITECTURAL MODEL — Clean white/neutral maquette style. Simplified materials with matte finishes. Miniature-scale photography feel with shallow depth of field. Scale figures and trees. Neutral studio lighting with soft shadows. Slight tilt-shift effect.',
  };
  if (params.visualStyle !== 'Nenhuma das opção') {
    sections.push(`RENDER STYLE: ${params.visualStyle}\n${styleDescriptions[params.visualStyle] || params.visualStyle}`);
  }

  // ── Camera ──
  const cameraDescriptions: Record<string, string> = {
    'Nível do Olhar': 'EYE-LEVEL SHOT — Camera at 1.60m height. Rodenstock HR Digaron-S 35mm f/4 lens. Zero keystoning with full perspective correction. Parallel verticals enforced. f/11, ISO 50, tripod-mounted. This creates the most natural and relatable architectural view.',
    'Grande Angular': 'WIDE-ANGLE SHOT — Camera at 1.60m. 16-35mm f/2.8 ultra-wide lens at 18mm. Controlled barrel distortion. Captures full facade width plus environmental context. f/8 for corner-to-corner sharpness. Slight perspective convergence allowed for dramatic effect.',
    'Close-up': 'CLOSE-UP DETAIL SHOT — 85mm f/1.4 lens for material and detail isolation. Shallow depth of field (f/2.8) with creamy bokeh on background. Focus on architectural details: joints, textures, material transitions, signage, ornamental elements. Macro-level surface texture visible.',
    'Drone / Aéreo': 'AERIAL/DRONE SHOT — DJI Mavic 3 Pro Hasselblad camera simulation. 24mm equivalent. 45-60° downward angle. Altitude 15-30m. Captures roof geometry, site context, landscaping patterns, and urban fabric. f/5.6, ISO 100. Slight atmospheric haze at edges.',
    'Manter ângulo da referência': 'MATCH REFERENCE ANGLE — Maintain the exact camera position, height, focal length, and perspective of the uploaded reference image. Reproduce the same field of view and vanishing points.',
  };
  if (params.cameraAngle !== 'Nenhuma das opção') {
    sections.push(`CAMERA ANGLE: ${params.cameraAngle}\n${cameraDescriptions[params.cameraAngle] || params.cameraAngle}`);
  }

  // ── Format ──
  const formatDescriptions: Record<string, string> = {
    'Instagram / TikTok (9:16)': 'Vertical 9:16 — Optimize composition for tall vertical framing. Building height emphasized. Sky and ground compressed.',
    'Instagram Portrait (4:5)': 'Portrait 4:5 — Slightly taller than square. Balanced facade view with moderate sky.',
    'Post / Feed (1:1)': 'Square 1:1 — Centered symmetric composition. Equal weight to building and environment.',
    'YouTube / TV (16:9)': 'Landscape 16:9 — Wide cinematic framing. Facade in context with surroundings. Strong horizontal composition.',
    'Fotografia (3:2)': 'Photography 3:2 — Classic SLR aspect ratio. Natural framing for architectural photography.',
    'Cinematográfico (2.35:1)': 'Cinemascope 2.35:1 — Ultra-wide cinematic letterbox. Dramatic horizontal sweep. Building as part of urban panorama.',
    'Vertical Clássico (2:3)': 'Classic Vertical 2:3 — Traditional portrait orientation. Elegant for tall structures.',
  };
  if (params.socialFormat !== 'Nenhuma das opção') {
    sections.push(`OUTPUT FORMAT/ASPECT RATIO: ${params.socialFormat}\n${formatDescriptions[params.socialFormat] || params.socialFormat}`);
  }

  // ── Lighting ──
  const lightingDescriptions: Record<string, string> = {
    'Manhã': 'MORNING GOLDEN HOUR — Sun at 15-25° elevation from east. Color temperature 3200-3800K. Warm raking light creating long soft shadows that reveal surface texture. Morning mist possibility. Dew on surfaces. Cool shadow fill from blue sky at 8000K. Shadow-to-light ratio 1:4.',
    'Tarde': 'HIGH NOON / AFTERNOON — Sun at 60-75° elevation. Color temperature 5200-5600K neutral daylight. Short hard shadows directly below elements. Maximum material color accuracy. Even illumination. Specular highlights on glass and polished surfaces at maximum intensity.',
    'Fim de Tarde': 'LATE AFTERNOON MAGIC HOUR — Sun at 10-20° elevation from west. Color temperature 2400-2800K ultra-warm golden cast. Extremely long dramatic shadows. Atmospheric aerosol glow. Light raking across facade reveals every surface imperfection. Warmth on west-facing surfaces, cool blue on shadow sides. Most cinematic natural lighting.',
    'Noturno': 'ARCHITECTURAL NIGHT PHOTOGRAPHY — No sunlight. Multi-source artificial lighting: warm 3000K facade uplights washing walls, cool 4000K LED street lamps, interior warm glow visible through windows, accent spotlights on signage. Deep navy-blue sky (not black). Light pools on pavement. Reflections on wet/glossy surfaces amplified.',
  };
  if (params.lighting !== 'Nenhuma das opção') {
    sections.push(`LIGHTING / TIME OF DAY: ${params.lighting}\n${lightingDescriptions[params.lighting] || params.lighting}`);
  }

  // ── Weather ──
  const weatherDescriptions: Record<string, string> = {
    'Dia de Sol': 'CLEAR SUNNY DAY — Cloudless or minimal cirrus. Solar disc position consistent with time-of-day. Hard shadow umbra with soft penumbra. Maximum material saturation. Intense specular reflections on glass, metal, and wet surfaces. High-contrast scene.',
    'Nublado': 'OVERCAST SKY — Uniform cloud layer (stratus/altostratus). Featureless gray-white sky dome. Zero direct shadows. Flat, even illumination from all directions. Muted, desaturated color palette. Diffuse lighting reveals material color without shadow interference.',
    'Chuvoso': 'ACTIVE RAINFALL — Visible rain streaks. All horizontal surfaces wet and reflective (mirror-like). Puddles with concentric ripple rings. Desaturated gray atmosphere. People with umbrellas. Headlight streaks on wet pavement. Low contrast. Mist/fog effect at distance.',
    'Pós-Chuva': 'POST-RAIN — Wet reflective surfaces (pavement mirrors the building). Dramatic cumulonimbus clouds breaking apart to reveal blue sky patches. Possible rainbow. Shafts of sunlight (god rays) through cloud gaps. Maximum color saturation due to clean air. Residual puddles with still reflections.',
  };
  if (params.weather !== 'Nenhuma das opção') {
    sections.push(`WEATHER / SKY: ${params.weather}\n${weatherDescriptions[params.weather] || params.weather}`);
  }

  // ── Signage ──
  sections.push(`ILLUMINATED SIGNAGE: ${params.illuminatedSignage ? 'YES — Warm LED backlit channel letters with halo glow effect. Realistic light falloff on surrounding wall. Internal illumination visible through translucent face. Edge-lit with 3000K warm white. Include slight neon flicker variation. Light spill on sidewalk below signage.' : 'NO — Signage present but not illuminated. Painted, vinyl, or dimensional letters without active light sources.'}`);

  // ── Blur Reference ──
  if (params.blurReference) {
    sections.push('⚠ BLUR MODE ACTIVE: Use the reference image ONLY for overall massing, proportions, volume composition, and general layout. IGNORE all surface details, materials, colors, and textures from the reference. Reimagine all surface treatments based on the other parameters specified.');
  } else {
    sections.push('✓ FULL REFERENCE MODE: Use ALL visual information from the reference image — materials, colors, textures, proportions, details, signage, and architectural language. Enhance and perfect what is shown.');
  }

  // ── Environment ──
  const envDescriptions: Record<string, string> = {
    'Urbano / Metrópole': 'Dense metropolitan context — neighboring high-rises with glass curtain walls reflecting the subject. Urban street furniture (bollards, benches, trash receptacles, bike racks). Traffic infrastructure (signals, lane markings, crosswalks). Mixed-use ground floor with retail activity. Ambient urban light.',
    'Residencial / Subúrbio': 'Low-density residential street — mature deciduous and ornamental trees lining the sidewalk. Domestic-scale neighbors (2-3 stories). Garden planting overflowing to sidewalk. Parked family vehicles in driveways. Children\'s toys, mailboxes, porch furniture.',
    'Vegetação / Floresta': 'Forest/park edge — mature tree canopy (oak, maple, pine) framing the building. Dappled light through leaves. Organic ground cover (ferns, moss, fallen leaves). Biophilic integration. Bird and insect presence implied. Natural stone elements.',
    'Litoral / Marítimo': 'Coastal waterfront — sea/ocean horizon visible. Salt air atmospheric haze softening distant objects. Marine-grade materials (stainless steel, treated wood). Nautical infrastructure (docks, rope cleats, buoys). Bleached color palette. Seagulls.',
    'Montanhoso / Alpino': 'Mountain terrain — altitude atmospheric clarity with ultra-sharp distant details. Rock formations. Conifer forest (pine, spruce) framing. Snow-capped peaks in background. Alpine material vernacular (stone, wood). Dramatic elevation changes.',
    'Industrial / Galpão': 'Industrial precinct — warehouse/factory neighbors with corrugated metal cladding. Heavy vehicle infrastructure (loading docks, truck bays). Utilitarian urban furniture. Exposed infrastructure (pipes, ducts, power lines). Rail tracks or port elements.',
    'Centro Histórico': 'Historic city center — heritage facade neighbors (neo-classical, art deco, colonial). Cobblestone or paralelepípedo street surface. Period street furniture (cast iron lamps, wrought iron bollards). Cultural tourism activity. Protected architectural context.',
    'Desértico / Árido': 'Arid desert landscape — bleached white-blue sky at horizon. Heat shimmer distortion at ground level. Sand drift at building base. Sparse succulent/xerophilic vegetation (agave, cactus, joshua tree). Terracotta/ochre color palette. Zero humidity atmosphere.',
  };
  if (params.environmentType !== 'Nenhuma das opção') {
    sections.push(`ENVIRONMENT CONTEXT: ${params.environmentType}\n${envDescriptions[params.environmentType] || params.environmentType}`);
  }

  // ── Sidewalk ──
  const sidewalkDescriptions: Record<string, string> = {
    'Concreto Clássico': 'Standard concrete sidewalk — expansion joints every 1.5m with dark staining in cracks. Surface micro-texture from broom finish. Edge chipping and corner spalling. Utility access covers (water, telecom). Tree root heaving. Oil stains near parking. Gum spots.',
    'Pedra Portuguesa': 'Portuguese mosaic pavement (calçada portuguesa) — black and white limestone cubes 5cm. Traditional wave or geometric patterns. Uneven surface with settled areas. Moss in shaded joints. Weathered contrast between black basalt and white limestone.',
    'Bloco Intertravado': 'Interlocking concrete pavers — herringbone or basket-weave pattern. Color variation between units (natural manufacturing variance). Sand-filled joints with weed growth. Edge restraints visible. Slight settlement patterns from foot traffic.',
    'Pedra São Tomé': 'São Tomé quartzite stone — irregular polygonal flagstone pattern. Warm gold/beige/gray color variation. Natural cleft surface texture. Grouted joints with slight recessing. Wet-look variation. Premium residential finish.',
    'Gramado com Pisantes': 'Grass with stepping stones — lush green grass (Bermuda or Zoysia) between irregular or geometric stone pavers. Organic edge where grass meets stone. Slight wear paths. Morning dew on grass blades.',
    'Cimento Queimado': 'Burnished/polished concrete — smooth monolithic surface with subtle trowel marks. Hairline shrinkage cracks (natural patina). Steel-troweled finish with slight sheen. Expansion joints with sealant. Industrial-chic aesthetic.',
  };
  if (params.sidewalkEnabled && params.sidewalkType !== 'Nenhuma das opção') {
    sections.push(`SIDEWALK/GROUND PLANE: ${params.sidewalkType}\n${sidewalkDescriptions[params.sidewalkType] || params.sidewalkType}`);
  } else {
    sections.push('SIDEWALK/GROUND: Integrate naturally with terrain — no specific pavement type required.');
  }

  // ── People & Vehicles ──
  sections.push(`HUMAN FIGURES: ${params.peopleCount} people — Candid street photography style. Natural mid-stride poses with motion blur on limbs. Real clothing fabric with micro-wrinkles and drape. Diverse age, ethnicity, gender, and body type. Correct 1.70-1.80m height for scale reference. Accessories: bags, phones, coffee cups, umbrellas if raining. ${params.peopleCount === 0 ? 'IMPORTANT: Scene should feel deliberately empty — early morning or controlled photography session atmosphere.' : ''}`);

  sections.push(`VEHICLES: ${params.carCount} cars — Contemporary luxury/modern vehicles (Tesla, BMW, Mercedes, Audi). Clear-coat metallic paint with environment reflections on body panels. Tire sidewall deformation under weight. Windshield showing building reflections. Realistic parking angles (not perfectly parallel). License plates visible but generic. ${params.carCount === 0 ? 'IMPORTANT: No vehicles in scene — pedestrian zone or controlled shoot atmosphere.' : ''}`);

  // ── Extra details ──
  if (params.environmentDetails?.trim()) {
    sections.push(`ADDITIONAL MATERIALS & ENVIRONMENT DETAILS (USER-SPECIFIED — prioritize these):\n${params.environmentDetails}`);
  }

  return `You are analyzing architectural reference image(s). Generate the MASTER PROMPT for photorealistic rendering.

IMPORTANT INSTRUCTIONS:
- Every parameter below was carefully chosen by the user. The generated prompt MUST faithfully reflect ALL of them.
- The english prompt must be extremely detailed (400+ words minimum) with specific technical parameters.
- Include exact camera specs, lens data, lighting color temperatures, material properties, and post-processing parameters.
- The prompt should be so technically precise that any AI image generator produces results matching these exact specifications.

═══════════════════════════════════════
${sections.join('\n\n═══════════════════════════════════════\n')}
═══════════════════════════════════════

OUTPUT FORMAT (strict JSON):
{
  "english": "[MASTER PROMPT — 400+ words minimum. Start with camera system, then lighting, then architecture/materials from reference, then environment/entourage, then post-processing. Every user parameter above must be explicitly addressed.]",
  "portuguese": "[Technical analysis in Portuguese — 200+ words. Explain the creative decisions: WHY this combination of parameters produces compelling results. Mention specific techniques.]",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;
};

/* ═══════════════════════════════════════════════
   IMAGE PROMPT BUILDER — sent to fal.ai for rendering
   ═══════════════════════════════════════════════ */

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

const buildImagePrompt = (prompt: string, params: PromptParameters): string => {
  const lightingMap: Record<string, string> = {
    'Manhã': 'early morning golden hour sunlight from east at 15-25° elevation, 3200K warm raking light, long soft shadows revealing surface texture, possible morning mist, cool 8000K fill from blue sky in shadows',
    'Tarde': 'high noon direct sunlight at 60-75° elevation, 5500K neutral white daylight, short hard shadows, maximum material color accuracy, strong specular highlights on glass and metal surfaces',
    'Fim de Tarde': 'late afternoon magic hour from west at 10-20° elevation, 2400-2800K ultra-warm golden light, extremely long dramatic shadows, atmospheric golden glow, warm orange on sun-facing surfaces with cool blue shadows',
    'Noturno': 'nighttime architectural photography with no sunlight, warm 3000K LED facade wash uplights, cool 4000K street lamps, interior warm glow through windows, deep navy blue sky, reflective light pools on pavement',
    'Nenhuma das opção': 'natural optimal daylight conditions',
  };

  const weatherMap: Record<string, string> = {
    'Dia de Sol': 'clear blue sky, sharp hard shadows with defined umbra and penumbra, maximum color saturation, intense specular reflections on glass and metal',
    'Nublado': 'uniform overcast gray-white sky, no direct shadows, flat even diffuse lighting, muted desaturated color palette',
    'Chuvoso': 'active rain with visible streaks, all surfaces wet and mirror-reflective, puddles with ripple rings, gray low-contrast atmosphere, people with umbrellas',
    'Pós-Chuva': 'post-rain wet reflective pavement mirroring the building, dramatic cumulonimbus clouds breaking apart, shafts of sunlight through cloud gaps, maximum color saturation from clean air, residual puddles',
    'Nenhuma das opção': 'pleasant weather conditions',
  };

  const environmentMap: Record<string, string> = {
    'Urbano / Metrópole': 'dense metropolitan urban context with neighboring glass high-rises, urban street furniture, traffic signals, crosswalks, mixed-use ground floor retail',
    'Residencial / Subúrbio': 'low-density residential street with mature trees, domestic-scale neighbors, garden planting, parked family vehicles',
    'Vegetação / Floresta': 'forest edge with mature tree canopy framing, dappled light through leaves, organic ground cover, biophilic integration',
    'Litoral / Marítimo': 'coastal waterfront with sea horizon, salt air atmospheric haze, marine-grade materials, nautical elements',
    'Montanhoso / Alpino': 'mountain terrain with altitude atmospheric clarity, rock formations, conifer forest, snow-capped peaks in background',
    'Industrial / Galpão': 'industrial precinct with warehouse neighbors, loading docks, utilitarian infrastructure, exposed pipes and ducts',
    'Centro Histórico': 'historic city center with heritage facades, cobblestone streets, period cast-iron street furniture, cultural activity',
    'Desértico / Árido': 'arid desert landscape with bleached sky, heat shimmer, sand drift at building base, sparse succulent vegetation, terracotta palette',
    'Nenhuma das opção': 'contextually appropriate environment',
  };

  const sidewalkMap: Record<string, string> = {
    'Concreto Clássico': 'concrete sidewalk with broom-finish texture, expansion joints, edge chipping, gum stains, utility covers',
    'Pedra Portuguesa': 'Portuguese mosaic pavement (calçada portuguesa) with black and white limestone wave pattern, uneven settling, moss in joints',
    'Bloco Intertravado': 'interlocking concrete pavers in herringbone pattern, color variation between units, sand joints with sparse weed growth',
    'Pedra São Tomé': 'São Tomé quartzite flagstone in warm gold-beige tones, natural cleft texture, grouted joints',
    'Gramado com Pisantes': 'lush green grass between stepping stones, organic edges, morning dew on grass blades',
    'Cimento Queimado': 'polished burnished concrete with trowel marks, hairline cracks, steel-troweled sheen, expansion joints',
  };

  const styleMap: Record<string, string> = {
    'Hiper-realista': 'ultra-photorealistic architectural photography, 8K, indistinguishable from real photograph, Phase One IQ4 150MP medium format',
    'V-Ray Render': 'professional V-Ray architectural render, physically-based materials, V-Ray Sun+Sky, GI with light cache, subtle lens bloom',
    'Unreal Engine 5': 'Unreal Engine 5 real-time render, Nanite geometry, Lumen global illumination, path-traced reflections, cinematic quality',
    'Sketch / Croqui': 'architectural hand-drawn sketch, pencil and ink linework, selective watercolor washes, paper texture, warm sepia tones',
    'Maquete Eletrônica': 'digital architectural model, white maquette style, matte materials, shallow depth of field, scale figures, tilt-shift effect',
    'Nenhuma das opção': 'ultra-photorealistic architectural photography',
  };

  const lighting = lightingMap[params.lighting] || lightingMap['Tarde'];
  const weather = weatherMap[params.weather] || weatherMap['Dia de Sol'];
  const environment = environmentMap[params.environmentType] || environmentMap['Urbano / Metrópole'];
  const style = styleMap[params.visualStyle] || styleMap['Hiper-realista'];

  const sidewalkDesc = params.sidewalkEnabled && params.sidewalkType !== 'Nenhuma das opção'
    ? sidewalkMap[params.sidewalkType] || 'realistic sidewalk pavement'
    : 'natural ground integration';

  const parts: string[] = [
    style,
    prompt,
    `Lighting: ${lighting}`,
    `Weather and sky: ${weather}`,
    `Environment: ${environment}`,
    `Ground/sidewalk: ${sidewalkDesc}`,
    `${params.peopleCount} people in candid natural poses with realistic clothing and accessories`,
    `${params.carCount} contemporary vehicles with metallic paint and environment reflections`,
    params.illuminatedSignage ? 'Illuminated LED backlit signage with warm halo glow and realistic light falloff' : '',
    params.environmentDetails ? `Additional details: ${params.environmentDetails}` : '',
    'Every material with surface micro-texture, correct reflectance, aging appropriate to context',
    'NEGATIVE: no CGI artifacts, no plastic surfaces, no incorrect shadows, no floating objects, no text watermarks',
  ];

  return parts.filter(Boolean).join('. ').trim();
};

/* ═══════════════════════════════════════════════
   API CALLS
   ═══════════════════════════════════════════════ */

export const generateArchitecturalPrompt = async (
  imagesData: string[],
  params: PromptParameters
): Promise<GeneratedPrompt> => {
  console.log('Chamando edge function generate-prompt com', imagesData.length, 'imagens');

  const { data, error } = await supabase.functions.invoke('generate-prompt', {
    body: {
      images: imagesData,
      promptText: buildPromptText(params),
    },
  });

  if (error) {
    console.error('Erro na edge function:', error);
    throw new Error(error.message || 'Erro ao gerar prompt.');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return {
    english: data.english || '',
    portuguese: data.portuguese || '',
    tags: data.tags || [],
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
  };
};

export const generateSamplePreview = async (
  prompt: string,
  socialFormat: string,
  params: PromptParameters,
  referenceImage?: string
): Promise<string> => {
  console.log('Chamando edge function generate-render via fal.ai');

  const enrichedPrompt = buildImagePrompt(prompt, params);
  const aspectRatio = ASPECT_RATIO_MAP[socialFormat] || '16:9';

  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { data, error } = await supabase.functions.invoke('generate-render', {
      body: { prompt: enrichedPrompt, aspectRatio },
    });

    if (error) {
      const is429 = error.message?.includes('non-2xx') || error.message?.includes('429');
      if (is429 && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt + 1) * 1000;
        console.log(`Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      console.error('Erro na edge function:', error);
      if (error.message?.includes('429') || error.message?.includes('Limite')) {
        throw new Error('Muitas requisições simultâneas. Aguarde 10 segundos e tente novamente.');
      }
      throw new Error(error.message || 'Erro ao gerar render.');
    }

    if (data?.error) {
      if (data.error.includes('Limite de requisições') && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt + 1) * 1000;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw new Error(data.error);
    }

    if (!data?.imageUrl) {
      throw new Error('Nenhuma imagem foi gerada. Tente novamente.');
    }

    return data.imageUrl;
  }

  throw new Error('Limite de requisições excedido após múltiplas tentativas.');
};
