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
  "english": "[MASTER PROMPT — minimum 200 words, maximum technical density, camera specs first, then architecture, then environment, then post-processing params]",
  "portuguese": "[Technical analysis: explain WHY this prompt will produce photorealistic results — mention specific techniques used]",
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
  socialFormat: string
): Promise<string> => {
  console.log('Chamando edge function generate-render');

  const aspectRatio = ASPECT_RATIO_MAP[socialFormat] || '16:9';

  const { data, error } = await supabase.functions.invoke('generate-render', {
    body: { prompt, aspectRatio },
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
