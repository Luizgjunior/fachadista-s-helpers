import { PromptParameters, GeneratedPrompt } from "@/types/fachadista";
import { supabase } from "@/integrations/supabase/client";

const formatParam = (label: string, value: string | number | boolean): string => {
  if (value === 'Nenhuma das opção') return '';
  return `- ${label}: ${value}\n`;
};

const buildPromptText = (params: PromptParameters): string => {
  return `Analyze the attached architectural snapshot(s) and generate the MASTER PROMPT.

PROJECT SPECS:
${formatParam('Type', params.projectType)}
${formatParam('Format/Ratio', params.socialFormat)}
${formatParam('Render Style', params.visualStyle)}
${formatParam('Camera Angle', params.cameraAngle)}
${params.blurReference ? '⚠ BLUR MODE: Use reference only for massing/composition. Ignore surface details.' : '✓ Use all visual information from reference.'}

ATMOSPHERE:
${formatParam('Time of Day', params.lighting)}
${formatParam('Weather', params.weather)}
${params.illuminatedSignage ? 'SIGNAGE: Warm LED backlit, halo glow, realistic falloff, neon flicker' : 'SIGNAGE: No artificial lighting'}

ENVIRONMENT:
${formatParam('Context', params.environmentType)}
SIDEWALK: ${params.sidewalkEnabled && params.sidewalkType !== 'Nenhuma das opção' ? `${params.sidewalkType} — show imperfections, gum stains, edge erosion, wet patches` : 'Integrate naturally with terrain'}
PEOPLE: ${params.peopleCount} figures — candid, diverse, motion-natural
VEHICLES: ${params.carCount} cars — luxury/modern, reflective metallic paint, realistic parking angles
EXTRA DETAILS: ${params.environmentDetails || 'None'}

OUTPUT FORMAT (strict JSON):
{
  "english": "[MASTER PROMPT — minimum 300 words, maximum technical density, camera specs first, then architecture, then environment, then post-processing params]",
  "portuguese": "[Technical analysis in Portuguese: 150 words minimum, explain WHY this prompt will produce photorealistic results — mention specific techniques used]",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

CRITICAL: The english prompt must be so technically precise that a professional ArchViz artist would recognize it as expert work. Include specific f-stop, focal length, ISO, color temperature, and render engine references.`;
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

const buildImagePrompt = (prompt: string, params: PromptParameters): string => {
  const lightingMap: Record<string, string> = {
    'Manhã': 'morning golden hour, sun at 15° elevation from east, warm 3200K raking light, long soft shadows, morning mist possibility',
    'Tarde': 'high noon sun, 70° elevation, cool 5500K direct light, short hard shadows directly below elements, maximum material exposure',
    'Fim de Tarde': 'late afternoon magic hour, sun at 20° elevation from west, ultra-warm 2700K golden cast, long dramatic shadows, atmospheric aerosol glow',
    'Noturno': 'architectural night photography, multi-source artificial lighting, warm 3000K facade wash, cool 4000K street lighting, dark deep-blue sky, light spill pools on pavement',
    'Nenhuma das opção': 'natural optimal daylight',
  };

  const weatherMap: Record<string, string> = {
    'Dia de Sol': 'clear sky, solar disc visible, hard shadow umbra, maximum material saturation, specular highlights on glass and metal',
    'Nublado': 'uniform overcast, featureless gray-white sky, zero shadow contrast, flat even illumination, muted color palette',
    'Chuvoso': 'active rainfall, wet reflective all surfaces, puddles with ripple rings, gray low-contrast sky, people with umbrellas',
    'Pós-Chuva': 'post-rain clarity, wet mirror reflections on pavement, dramatic cumulonimbus breaking, shafts of sunlight, rainbow possibility, maximum material color saturation',
    'Nenhuma das opção': 'optimal weather conditions',
  };

  const environmentMap: Record<string, string> = {
    'Urbano / Metrópole': 'dense metropolitan context, high-rise neighbors, glass tower reflections, urban street furniture, traffic infrastructure, mixed-use ground floor, city ambient light',
    'Residencial / Subúrbio': 'low-density residential street, mature neighborhood trees, domestic human activity, garden planting overflow to sidewalk, parked family vehicles',
    'Vegetação / Floresta': 'forest edge location, mature tree canopy framing, dappled light through leaves, organic ground cover, biophilic integration, wildlife ambient presence',
    'Litoral / Marítimo': 'coastal waterfront setting, sea horizon visible, salt air atmospheric haze, marine-grade materials, boat infrastructure background, bleached nautical color palette',
    'Montanhoso / Alpino': 'mountain terrain setting, altitude atmospheric clarity, rock formations integration, conifer forest framing, snow-cap peaks in background, alpine material vernacular',
    'Industrial / Galpão': 'industrial precinct context, warehouse neighbors, heavy vehicle infrastructure, utilitarian urban furniture, rail or port elements',
    'Centro Histórico': 'historic city center, heritage facade neighbors, cobblestone street surface, period street furniture, cultural tourism activity',
    'Desértico / Árido': 'arid desert landscape, bleached white sky horizon, heat shimmer at ground level, sand drift at building base, sparse succulent vegetation, terracotta color palette',
    'Nenhuma das opção': 'contextually appropriate environment',
  };

  const sidewalkDesc = params.sidewalkEnabled && params.sidewalkType !== 'Nenhuma das opção'
    ? `${params.sidewalkType} sidewalk pavement with realistic wear: joint line staining, edge chipping, surface micro-texture, utility cover integration`
    : 'natural ground plane integration';

  const lighting = lightingMap[params.lighting] || lightingMap['Tarde'];
  const weather = weatherMap[params.weather] || weatherMap['Dia de Sol'];
  const environment = environmentMap[params.environmentType] || environmentMap['Urbano / Metrópole'];

  return `ULTRA-REALISTIC ARCHITECTURAL PHOTOGRAPHY, 8K, 300DPI.

MASTER PROMPT:
${prompt}

════════ PHOTOGRAPHY SYSTEM ════════
Phase One IQ4 150MP medium format camera body.
Rodenstock HR Digaron-S 32mm f/4 lens (architecture standard).
Settings: f/11, ISO 50, 1/125s. Tripod-mounted carbon fiber.
Perspective correction: zero keystoning, parallel verticals enforced.
Post-processing: Phase One Capture One Pro, zero noise at ISO 50, maximum dynamic range retention.

════════ LIGHTING ════════
${lighting}

════════ WEATHER & SKY ════════
${weather}

════════ ENVIRONMENT CONTEXT ════════
${environment}

SIDEWALK/GROUND: ${sidewalkDesc}

HUMAN FIGURES: ${params.peopleCount} people — candid street photography style, natural poses, motion blur on walking figures, real clothing fabric microdetail, diverse age and ethnicity, correct 1.75m scale reference

VEHICLES: ${params.carCount} contemporary vehicles — clear-coat metallic paint, tire sidewall deformation, windshield building reflections, realistic parking angles

════════ MATERIAL QUALITY ════════
Every material rendered with:
- Surface micro-texture at 8K resolution
- Correct reflectance response to specified lighting
- Aging and weathering appropriate to building age
- Material joint and transition details
- Subsurface scattering on translucent materials

════════ TECHNICAL RENDER PARAMS ════════
8K ultra-high resolution: 7680×4320 pixels
Path-tracing global illumination, ray-traced reflections
Temporal anti-aliasing, zero edge aliasing
16-bit HDR color space, sRGB output
Atmospheric perspective: detail falloff at 200m depth

QUALITY REFERENCE: Dezeen magazine photography, Archdaily editorial, Wallpaper* architectural images, Architectural Digest professional photography.

ABSOLUTE NEGATIVE PROMPT:
no CGI look, no 3D render artifacts, no plastic surfaces, no artificial HDR processing, no oversaturated colors, no lens flare abuse, no watermarks, no text overlays, no uncanny valley humans, no floating objects, no incorrect shadows, no perspective distortion.

FINAL REQUIREMENT: The output must be completely indistinguishable from a photograph taken on location by a world-class architectural photographer.`.trim();
};

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
  params: PromptParameters
): Promise<string> => {
  console.log('Chamando edge function generate-render via Google Gemini API');

  const enrichedPrompt = buildImagePrompt(prompt, params);
  const aspectRatio = ASPECT_RATIO_MAP[socialFormat] || '16:9';

  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { data, error } = await supabase.functions.invoke('generate-render', {
      body: { prompt: enrichedPrompt, aspectRatio },
    });

    if (error) {
      // Check if it's a 429 rate limit error
      const is429 = error.message?.includes('non-2xx') || error.message?.includes('429');
      if (is429 && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt + 1) * 1000;
        console.log(`Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      console.error('Erro na edge function:', error);
      if (error.message?.includes('Nenhuma imagem')) {
        throw new Error('O modelo de IA não retornou uma imagem. Tente novamente ou use um prompt diferente.');
      }
      if (error.message?.includes('429') || error.message?.includes('Limite')) {
        throw new Error('Muitas requisições simultâneas. Aguarde 10 segundos e tente novamente.');
      }
      throw new Error(error.message || 'Erro ao gerar render.');
    }

    if (data?.error) {
      if (data.error.includes('Limite de requisições') && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt + 1) * 1000;
        console.log(`Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
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

  throw new Error('Limite de requisições excedido após múltiplas tentativas. Aguarde alguns segundos e tente novamente.');
};
