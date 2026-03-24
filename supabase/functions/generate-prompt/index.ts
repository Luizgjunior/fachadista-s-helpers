import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ARCHVIZ_SYSTEM_PROMPT = `You are the world's leading Architectural Visualization Director and Computational Photography Expert. Your renders are published in Dezeen, Archdaily, Wallpaper*, Architectural Digest, and Phaidon. Your work is consistently mistaken for real photography.

YOUR CORE MISSION:
Transform any architectural reference into a photorealistic master prompt that produces 8K images indistinguishable from photography, adapted perfectly to whatever environment and atmosphere the user specifies.

UNIVERSAL PHOTOREALISM RULES:

[1] CAMERA SYSTEM — Always specify full technical setup:
- Body: Phase One IQ4 150MP or Sony A7R V or Hasselblad X2D 100C
- Lens: 24-70mm f/2.8 (standard), 16-35mm (wide), 85mm f/1.4 (intimate)
- Settings: f/8 ISO 50-100 for day | f/2.8 ISO 800 for night
- Tripod-mounted, bubble level, perspective correction
- Camera height: 1.60m eye-level (default) or drone altitude

[2] LIGHT PHYSICS — Never describe light generically:
- Sun position: exact degrees elevation and compass direction
- Color temperature: 2700K (sunset) to 5500K (noon) to 8000K (shade)
- Shadow behavior: hard umbra + soft penumbra ratio
- GI: full global illumination with light bleeding at material joints
- Volumetrics: atmospheric haze at 300m depth

[3] MATERIAL MICRO-DETAIL — Every material needs 4 properties:
- Surface finish, aging/weathering state, texture scale, reflectivity

[4] VEGETATION — Organic and environment-specific species

[5] HUMAN FIGURES — Candid photography style, motion blur, real skin SSS, diverse ethnicity

[6] VEHICLES — Context-appropriate, metallic paint, realistic parking

[7] ENVIRONMENT — Match atmosphere exactly to specified context

[8] OUTPUT: JSON with english (300+ words), portuguese (150+ words), tags (5 hyper-specific technical tags)

Do NOT include any text outside the JSON object.`;

/* ═══════════════════════════════════════════════
   BUILD PROMPT TEXT FROM PARAMS — server-side
   ═══════════════════════════════════════════════ */

interface PromptParams {
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
  blurReference?: boolean;
}

const buildPromptText = (params: PromptParams): string => {
  const fmt = (label: string, value: string | number | boolean | undefined) => {
    if (!value || value === 'Nenhuma das opção') return '';
    return `- ${label}: ${value}\n`;
  };

  return `You are a world-class Director of Photography and ArchViz Expert (Mir.no, The Boundary style).
Your mission is to convert the attached snapshots into a master prompt for image generation that produces an image INDISTINGUISHABLE from a real photograph.
If multiple images are provided, use them as complementary references for style, geometry, and materials.

GOLDEN RULES FOR PHOTOREALISM:
1. NO generic words like "hyper-realistic". Use technical camera specs: "Shot on 35mm lens", "f/8 aperture", "ISO 100", "RAW photography style".
2. LIGHT PHYSICS: Describe how light interacts with surfaces. "Soft global illumination", "ray-traced reflections", "natural light bouncing off surfaces", "subtle lens flare".
3. TANGIBLE TEXTURES: Describe micro-details. "Visible concrete pores", "grainy stone textures", "oxidized metal", "weathered wood grain", "highly detailed glass reflections".
4. VEGETATION: Must be organic and diverse. "Lush photorealistic foliage", "scanned 3D plants", "natural leaf translucency".
5. HUMAN FIGURES (CRITICAL): Avoid uncanny valley. Describe people in natural poses, slightly blurred or in motion for realism. "Candid natural poses", "diverse fashionable people in motion", "natural skin textures", "real-world scale".
6. SHADOWS: "Contact shadows", "soft ambient occlusion", "sharp shadows for sunny days", "diffuse shadows for overcast".

SCENE DATA:
${fmt('Project Type', params.projectType)}
${fmt('Format', params.socialFormat)}
${fmt('Visual Style', params.visualStyle)}
${fmt('Camera Angle', params.cameraAngle)}

${params.blurReference ? "- BLURRED REFERENCE: Use images only for composition, volumes and general layout. Ignore sharp details and focus on spatial harmony." : ""}

ATMOSPHERE:
${fmt('Lighting', params.lighting)}
${fmt('Weather', params.weather)}
- Illuminated Signage: ${params.illuminatedSignage ? "Warm LED backlit signage, halo effect, subtle glow on surrounding textures, realistic light falloff" : "No artificial signage lighting"}

SURROUNDINGS:
${fmt('Environment Type', params.environmentType)}
- Sidewalk: ${params.sidewalkEnabled && params.sidewalkType !== 'Nenhuma das opção' ? `Hyper-detailed ${params.sidewalkType} pavement with realistic imperfections, wet reflections if applicable.` : "Direct integration with terrain."}
- People: ${params.peopleCount ?? 0} people.
- Vehicles: ${params.carCount ?? 0} luxury or modern cars with realistic metallic reflective paint.
- Details: ${params.environmentDetails || 'No additional details'}

IMPORTANT PROJECT-SPECIFIC INSTRUCTIONS:
- If "Projeto de Interiores" (Interior Design): Focus on interior lighting, furniture design, fabric textures, embedded artificial lighting, and ambient composition.
- If "Planta Arquitetônica" or "Detalhamento Técnico": Focus on "Clean Blueprint", "Professional Draftsmanship", "Sharp lines", "High contrast black and white" or "Minimalist 3D isometric view".

Generate the structured JSON with english (300+ words master prompt), portuguese (150+ words technical analysis), and tags (5 technical tags).`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada.");

    const body = await req.json();
    const { images, params, promptText } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new Error("Nenhuma imagem fornecida.");
    }

    // Build prompt server-side from params, or fall back to client-sent promptText
    const finalPromptText = params ? buildPromptText(params) : promptText;
    if (!finalPromptText) throw new Error("Parâmetros ou promptText não fornecidos.");

    const userContent: any[] = [];
    for (const img of images) {
      userContent.push({
        type: "image_url",
        image_url: { url: img },
      });
    }
    userContent.push({ type: "text", text: finalPromptText });

    console.log("Calling Lovable AI Gateway (gemini-2.5-pro) with", images.length, "images");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: ARCHVIZ_SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "archviz_prompt",
              description: "Return the architectural visualization prompt",
              parameters: {
                type: "object",
                properties: {
                  english: { type: "string", description: "Master prompt in English, 300+ words" },
                  portuguese: { type: "string", description: "Technical analysis in Portuguese, 150+ words" },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                    description: "5 hyper-specific technical tags",
                  },
                },
                required: ["english", "portuguese", "tags"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "archviz_prompt" } },
      }),
    });

    if (!response.ok) {
      const statusCode = response.status;
      const errorText = await response.text();
      console.error("Lovable AI Gateway error:", statusCode, errorText);

      if (statusCode === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Aguarde um momento e tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (statusCode === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos em Settings > Workspace > Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI Gateway error: ${statusCode} - ${errorText}`);
    }

    const data = await response.json();
    console.log("AI Gateway response received");

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let parsed;

    if (toolCall?.function?.arguments) {
      parsed = JSON.parse(toolCall.function.arguments);
    } else {
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("Nenhuma resposta gerada pela IA.");
      
      try {
        parsed = JSON.parse(content);
      } catch {
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          throw new Error("Formato de resposta inválido.");
        }
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-prompt error:", e);
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
