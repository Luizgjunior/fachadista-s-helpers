
import { GoogleGenAI, Type } from "@google/genai";
import { PromptParameters, GeneratedPrompt } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateArchitecturalPrompt = async (
  imagesData: string[],
  params: PromptParameters
): Promise<GeneratedPrompt> => {
  const imageParts = imagesData.map(img => ({
    inlineData: {
      mimeType: "image/jpeg",
      data: img.split(',')[1],
    },
  }));

  const formatParam = (label: string, value: string | number | boolean) => {
    if (value === 'Nenhuma das opção') return '';
    return `- ${label}: ${value}\n`;
  };

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        ...imageParts,
        {
          text: `Você é um Diretor de Fotografia e Especialista em ArchViz de nível mundial (estilo Mir.no, The Boundary). 
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
            - Detalhes: ${params.environmentDetails}

            Gere um JSON estritamente com:
            1. 'english': Prompt técnico mestre. Comece com o estilo da foto, descreva a arquitetura (materiais, geometria), a luz, as texturas e finalize com as configurações de câmera e render.
            2. 'portuguese': Uma breve análise técnica de por que este prompt resultará em uma imagem real.
            3. 'tags': 5 tags técnicas (ex: RayTracing, RAW, 8k, ArchDaily, Photorealistic).

            IMPORTANTE: 
            - Se for "Projeto de Interiores", foque em iluminação interna, design de mobiliário, texturas de tecidos, iluminação artificial embutida e composição de ambiente.
            - Se for "Planta Arquitetônica" ou "Detalhamento", foque em estética "Clean Blueprint", "Professional Draftsmanship", "Sharp lines", "High contrast black and white" ou "Minimalist 3D isometric view".`
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          english: { type: Type.STRING },
          portuguese: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["english", "portuguese", "tags"]
      }
    }
  });

  const data = JSON.parse(response.text || '{}');
  return {
    ...data,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now()
  };
};

export const generateSamplePreview = async (prompt: string, aspectRatio: string): Promise<string> => {
  const ratioMap: Record<string, "1:1" | "3:4" | "4:3" | "9:16" | "16:9"> = {
    'Instagram / TikTok (9:16)': "9:16",
    'Instagram Portrait (4:5)': "3:4",
    'Post / Feed (1:1)': "1:1",
    'YouTube / TV (16:9)': "16:9",
    'Fotografia (3:2)': "4:3",
    'Cinematográfico (2.35:1)': "16:9",
    'Vertical Clássico (2:3)': "3:4"
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `High-end architectural photography, shot on RED camera, 8k resolution, realistic materials, cinema lighting, ${prompt}` }],
    },
    config: {
      imageConfig: {
        aspectRatio: ratioMap[aspectRatio] || "1:1"
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Falha ao gerar preview");
};
