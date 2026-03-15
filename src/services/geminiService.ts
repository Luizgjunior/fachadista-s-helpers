import { PromptParameters, GeneratedPrompt } from "@/types/fachadista";
import { supabase } from "@/integrations/supabase/client";

const formatParam = (label: string, value: string | number | boolean): string => {
  if (value === 'Nenhuma das opção') return '';
  return `- ${label}: ${value}\n`;
};

const buildPromptText = (params: PromptParameters): string => {
  return `Você é um Diretor de Fotografia e Especialista em ArchViz de nível mundial (estilo Mir.no, The Boundary). 
Sua missão é converter os snapshots anexados em um prompt mestre para Midjourney v6.1 que produza uma imagem INDISTINGUÍVEL de uma fotografia real.
Se houver múltiplas imagens, use-as como referências complementares de estilo, geometria e materiais.

REGRAS DE OURO PARA O FOTORREALISMO:
1. NÃO use palavras genéricas como "hiper-realista". Use especificações técnicas de câmera: "Shot on 35mm lens", "f/8 aperture", "ISO 100", "RAW photography style".
2. FÍSICA DE LUZ: Descreva como a luz interage com as superfícies. "Soft global illumination", "ray-traced reflections", "natural light bouncing off surfaces", "subtle lens flare".
3. TEXTURAS TANGÍVEIS: Descreva micro-detalhes. "Visible concrete pores", "grainy stone textures", "oxidized metal", "weathered wood grain", "highly detailed glass reflections".
4. VEGETAÇÃO: Deve ser orgânica e diversa. "Lush photorealistic foliage", "scanned 3D plants", "natural leaf translucency".
5. SERES HUMANOS (CRÍTICO): Evite o "uncanny valley". Descreva pessoas em poses naturais, levemente desfocadas ou em movimento (motion blur) para realismo.
6. SOMBRAS: "Contact shadows", "soft ambient occlusion", "sharp shadows for sunny days", "diffuse shadows for overcast".

DADOS DA CENA:
${formatParam('Tipo de Projeto', params.projectType)}
${formatParam('Formato', params.socialFormat)}
${formatParam('Estética Visual', params.visualStyle)}
${formatParam('Ângulo de Câmera', params.cameraAngle)}

${params.blurReference ? "- REFERÊNCIA DESFOCADA: Use as imagens apenas para composição, volumes e layout geral." : ""}

ATMOSFERA:
${formatParam('Iluminação', params.lighting)}
${formatParam('Clima', params.weather)}
- Letreiro Iluminado: ${params.illuminatedSignage ? "Warm LED backlit signage, halo effect, subtle glow on surrounding textures" : "No artificial signage lighting"}

ENTORNO:
${formatParam('Tipo de Ambiente', params.environmentType)}
- Calçada: ${params.sidewalkEnabled && params.sidewalkType !== 'Nenhuma das opção' ? `Hyper-detailed ${params.sidewalkType} pavement with realistic imperfections.` : "Direct integration with terrain."}
- População: ${params.peopleCount} pessoas.
- Veículos: ${params.carCount} carros de luxo ou modernos, pintura reflexiva metálica realista.
- Detalhes: ${params.environmentDetails}

Gere um JSON estritamente com:
1. 'english': Prompt técnico mestre completo.
2. 'portuguese': Uma breve análise técnica.
3. 'tags': 5 tags técnicas (ex: RayTracing, RAW, 8k, ArchDaily, Photorealistic).

IMPORTANTE: 
- Se for "Projeto de Interiores", foque em iluminação interna, design de mobiliário, texturas de tecidos.
- Se for "Planta Arquitetônica" ou "Detalhamento", foque em estética "Clean Blueprint", "Professional Draftsmanship".`;
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
  _aspectRatio: string
): Promise<string> => {
  console.log('Chamando edge function generate-render');

  const { data, error } = await supabase.functions.invoke('generate-render', {
    body: { prompt },
  });

  if (error) {
    console.error('Erro na edge function:', error);
    throw new Error(error.message || 'Erro ao gerar render.');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.imageUrl) {
    throw new Error('Nenhuma imagem foi gerada. Tente novamente.');
  }

  return data.imageUrl;
};
