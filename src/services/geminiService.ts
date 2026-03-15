import { PromptParameters, GeneratedPrompt } from "@/types/fachadista";

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const getApiKey = (): string => {
  const key = import.meta.env.VITE_GEMINI_API_KEY || "";
  if (!key) {
    console.warn("VITE_GEMINI_API_KEY não configurada. O serviço Gemini não funcionará.");
  }
  return key;
};

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
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key do Gemini não configurada. Adicione VITE_GEMINI_API_KEY nas variáveis de ambiente.");
  }

  console.log('API Key presente:', !!apiKey, 'Primeiros chars:', apiKey.slice(0, 8));
  console.log('Imagens recebidas:', imagesData.length);

  const imageParts = imagesData.map(img => ({
    inline_data: {
      mime_type: "image/jpeg",
      data: img.split(',')[1],
    },
  }));

  const response = await fetch(
    `${API_URL}/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            ...imageParts,
            { text: buildPromptText(params) },
          ],
        }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              english: { type: "STRING" },
              portuguese: { type: "STRING" },
              tags: { type: "ARRAY", items: { type: "STRING" } }
            },
            required: ["english", "portuguese", "tags"]
          }
        }
      }),
    }
  );

  console.log('Status da resposta:', response.status);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.error('Erro da API Gemini:', JSON.stringify(errorBody));
    throw new Error(errorBody?.error?.message || `Erro ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const data = JSON.parse(text);

  return {
    ...data,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now()
  };
};

export const generateSamplePreview = async (
  prompt: string,
  aspectRatio: string
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key do Gemini não configurada.");
  }

  const ratioMap: Record<string, string> = {
    'Instagram / TikTok (9:16)': '9:16',
    'Instagram Portrait (4:5)': '3:4',
    'Post / Feed (1:1)': '1:1',
    'YouTube / TV (16:9)': '16:9',
    'Fotografia (3:2)': '4:3',
    'Cinematográfico (2.35:1)': '16:9',
    'Vertical Clássico (2:3)': '3:4',
    'Nenhuma das opção': '1:1',
  };

  const selectedRatio = ratioMap[aspectRatio] || '1:1';

  const enhancedPrompt = `${prompt}, architectural photography, photorealistic, ultra detailed, professional visualization, 8K resolution, shot on RED camera`;

  const response = await fetch(
    `${API_URL}/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: enhancedPrompt }]
        }],
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT'],
          imageGenerationConfig: {
            numberOfImages: 1,
            aspectRatio: selectedRatio,
          }
        }
      })
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Erro na API Gemini: ${response.status}`);
  }

  const result = await response.json();
  for (const part of result?.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Nenhuma imagem foi gerada. Tente novamente.");
};
