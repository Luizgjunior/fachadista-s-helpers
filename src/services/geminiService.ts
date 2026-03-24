import { PromptParameters, GeneratedPrompt } from "@/types/fachadista";
import { supabase } from "@/integrations/supabase/client";

/* ═══════════════════════════════════════════════
   GENERATE ARCHITECTURAL PROMPT
   All prompt construction now happens server-side.
   ═══════════════════════════════════════════════ */

export const generateArchitecturalPrompt = async (
  imagesData: string[],
  params: PromptParameters
): Promise<GeneratedPrompt> => {
  console.log('Chamando edge function generate-prompt com', imagesData.length, 'imagens');

  const { data, error } = await supabase.functions.invoke('generate-prompt', {
    body: { images: imagesData, params },
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

/* ═══════════════════════════════════════════════
   GENERATE RENDER / PREVIEW
   All prompt enrichment now happens server-side.
   ═══════════════════════════════════════════════ */

export const generateSamplePreview = async (
  prompt: string,
  _socialFormat: string,
  params: PromptParameters,
  referenceImage?: string
): Promise<string> => {
  console.log('Chamando edge function generate-render');

  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { data, error } = await supabase.functions.invoke('generate-render', {
      body: { prompt, params, referenceImage },
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
