import { PromptParameters, GeneratedPrompt } from "@/types/fachadista";
import { supabase } from "@/integrations/supabase/client";

/* ═══════════════════════════════════════════════
   PROMPT TEXT BUILDER — sent to LLM for analysis
   ═══════════════════════════════════════════════ */

const buildPromptText = (params: PromptParameters): string => {
  const formatParam = (label: string, value: string | number | boolean) => {
    if (value === 'Nenhuma das opção') return '';
    return `- ${label}: ${value}\n`;
  };

  return `Você é um Diretor de Fotografia e Especialista em ArchViz de nível mundial (estilo Mir.no, The Boundary).
Sua missão é converter os snapshots anexados em um prompt mestre para Midjourney v6.1 que produza uma imagem INDISTINGUÍVEL de uma fotografia real.
Se houver múltiplas imagens, use-as como referências complementares de estilo, geometria e materiais.

REGRAS DE OURO PARA O FOTORREALISMO:
1. NÃO use palavras genéricas como "hiper-realista". Use especificações técnicas de câmera: "Shot on 35mm lens", "f/8 aperture", "ISO 100", "RAW photography style".
2. FÍSICA DE LUZ: Descreva como a luz interage com as superfícies. "Soft global illumination", "ray-traced reflections", "natural light bouncing off surfaces", "subtle lens flare".
3. TEXTURAS TANGÍVEIS: Descreva micro-detalhes. "Visible concrete pores", "grainy stone textures", "oxidized metal", "weathered wood grain", "highly detailed glass reflections".
4. VEGETAÇÃO: Deve ser orgânica e diversa. "Lush photorealistic foliage", "scanned 3D plants", "natural leaf translucency".
5. SERES HUMANOS (CRÍTICO): Evite o "uncanny valley". Descreva pessoas em poses naturais, levemente desfocadas ou em movimento (motion blur) para realismo. "Candid natural poses", "diverse fashionable people in motion", "natural skin textures", "real-world scale".
6. SOMBRAS: "Contact shadows", "soft ambient occlusion", "sharp shadows for sunny days", "diffuse shadows for overcast".

DADOS DA CENA:
${formatParam('Tipo de Projeto', params.projectType)}
${formatParam('Formato', params.socialFormat)}
${formatParam('Estética Visual', params.visualStyle)}
${formatParam('Ângulo de Câmera', params.cameraAngle)}

${params.blurReference ? "- REFERÊNCIA DESFOCADA: Use as imagens apenas para composição, volumes e layout geral. Ignore detalhes nítidos das referências e foque na harmonia espacial." : ""}

ATMOSFERA:
${formatParam('Iluminação', params.lighting)}
${formatParam('Clima', params.weather)}
- Letreiro Iluminado: ${params.illuminatedSignage ? "Warm LED backlit signage, halo effect, subtle glow on surrounding textures, realistic light falloff" : "No artificial signage lighting"}

ENTORNO:
${formatParam('Tipo de Ambiente', params.environmentType)}
- Calçada: ${params.sidewalkEnabled && params.sidewalkType !== 'Nenhuma das opção' ? `Hyper-detailed ${params.sidewalkType} pavement with realistic imperfections, wet reflections if applicable.` : "Direct integration with terrain."}
- População: ${params.peopleCount} pessoas.
- Veículos: ${params.carCount} carros de luxo ou modernos, pintura reflexiva metálica realista.
- Detalhes: ${params.environmentDetails || 'Nenhum detalhe adicional'}

Gere um JSON estritamente com:
1. 'english': Prompt técnico mestre. Comece com o estilo da foto, descreva a arquitetura (materiais, geometria), a luz, as texturas e finalize com as configurações de câmera e render.
2. 'portuguese': Uma breve análise técnica de por que este prompt resultará em uma imagem real.
3. 'tags': 5 tags técnicas (ex: RayTracing, RAW, 8k, ArchDaily, Photorealistic).

IMPORTANTE:
- Se for "Projeto de Interiores", foque em iluminação interna, design de mobiliário, texturas de tecidos, iluminação artificial embutida e composição de ambiente.
- Se for "Planta Arquitetônica" ou "Detalhamento", foque em estética "Clean Blueprint", "Professional Draftsmanship", "Sharp lines", "High contrast black and white" ou "Minimalist 3D isometric view".`;
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
      body: { prompt: enrichedPrompt, aspectRatio, referenceImage },
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
