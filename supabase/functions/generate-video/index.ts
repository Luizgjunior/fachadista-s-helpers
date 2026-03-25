import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CAMERA_PRESETS: Record<string, string> = {
  orbital: "Slow smooth orbital camera movement around the building, cinematic dolly, maintaining framing",
  zoom_dramatic: "Slow dramatic zoom-in toward the building entrance, cinematic depth of field, smooth steady camera",
  ambiente_vivo: "Static camera, subtle ambient motion, clouds drifting slowly",
  flyover: "Aerial flyover camera slowly moving forward over the building, smooth cinematic drone shot",
};

const FAL_MODEL = "fal-ai/kling-video/v2.1/standard/image-to-video";

const IMAGE_ANALYSIS_SYSTEM_PROMPT = `You are an expert architectural animation director. Analyze the provided architectural render image and generate a highly detailed animation prompt for a 5-second video.

PRIORITY RULES (in order):
1. **CARS** - TOP PRIORITY. Identify every car visible. Describe EXACTLY:
   - Position (left side, right side, parked, on the road)
   - Direction they should drive (based on road orientation)
   - If parked: describe a car slowly pulling into the parking spot or idling with brake lights on
   - If on the road: describe smooth realistic driving motion with headlights/taillights glowing
   - Cars MUST move realistically - wheels turning, slight suspension bounce

2. **PEOPLE** - Identify any people or where people would naturally walk:
   - Describe natural walking motion on sidewalks
   - People entering/exiting the building
   - Natural body movement, arms swinging, casual pace

3. **LIGHTS** - Identify all light sources:
   - Building signage: describe neon/LED signs flickering on, glowing warmly
   - Street lamps: warm glow casting light pools on ground
   - Window lights: some turning on, some already lit, warm interior glow
   - Car headlights and taillights: bright, realistic beam spread
   - If nighttime: emphasize dramatic lighting effects

4. **ENVIRONMENT** - Secondary ambient motion:
   - Trees/vegetation swaying gently in wind
   - Clouds moving across sky
   - Reflections on glass facades shimmering
   - Shadows shifting subtly

OUTPUT: Return ONLY the animation prompt in English, no explanations. Be extremely specific about car movements and directions. The prompt should read like a professional cinematography direction sheet.`;

/**
 * Analyze the render image using Lovable AI to generate a scene-faithful prompt
 */
async function analyzeImageForAnimation(
  imageUrl: string,
  cameraPreset: string,
  lovableApiKey: string
): Promise<string> {
  const cameraDirection = CAMERA_PRESETS[cameraPreset] || CAMERA_PRESETS.ambiente_vivo;

  const messages: any[] = [
    { role: "system", content: IMAGE_ANALYSIS_SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Analyze this architectural render and create an animation prompt. Camera style: "${cameraDirection}". Focus heavily on car movements (driving direction, parking, headlights) and people walking. Describe exactly what should move and how, based on what you see in the image.`,
        },
        {
          type: "image_url",
          image_url: { url: imageUrl },
        },
      ],
    },
  ];

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("AI analysis error:", response.status, errText);
    // Fallback to preset-based prompt
    return `${cameraDirection}, cars driving smoothly on the road with realistic motion and glowing headlights, people walking naturally on sidewalks, lights turning on and glowing warmly, neon signs illuminating, street lamps casting warm light, window lights toggling softly, professional architectural videography`;
  }

  const data = await response.json();
  const analysisPrompt = data.choices?.[0]?.message?.content?.trim();

  if (!analysisPrompt) {
    console.error("Empty AI analysis, using fallback");
    return `${cameraDirection}, cars driving smoothly on the road with realistic motion and glowing headlights, people walking naturally on sidewalks, lights turning on and glowing warmly, professional architectural videography`;
  }

  // Combine camera direction with AI-generated scene analysis
  const finalPrompt = `${cameraDirection}. ${analysisPrompt}`;
  console.log("AI-generated animation prompt:", finalPrompt.substring(0, 200) + "...");
  return finalPrompt;
}

/**
 * Upload base64 image to Fal storage to avoid sending large payloads
 */
async function uploadToFalStorage(base64DataUri: string, falKey: string): Promise<string> {
  if (base64DataUri.startsWith("http")) return base64DataUri;

  const match = base64DataUri.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) throw new Error("Formato de imagem inválido.");

  const mimeType = match[1];
  const base64Data = match[2];
  const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

  const ext = mimeType.split("/")[1] || "png";
  const fileName = `render-${Date.now()}.${ext}`;

  const formData = new FormData();
  formData.append("file", new Blob([binaryData], { type: mimeType }), fileName);

  const uploadRes = await fetch("https://fal.run/fal-ai/fal-id/storage/upload", {
    method: "POST",
    headers: { Authorization: `Key ${falKey}` },
    body: formData,
  });

  if (!uploadRes.ok) {
    console.log("Fal storage upload failed, using base64 directly");
    return base64DataUri;
  }

  const uploadData = await uploadRes.json();
  console.log("Image uploaded to Fal storage:", uploadData.url);
  return uploadData.url;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FAL_KEY = Deno.env.get("FAL_KEY");
    if (!FAL_KEY) throw new Error("FAL_KEY não configurada.");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autenticado.");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await createClient(
      SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!
    ).auth.getUser(token);
    if (authError || !user) throw new Error("Token inválido.");

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    const isAdmin = profile?.is_admin === true;

    const body = await req.json();
    const { action } = body;

    // ── ACTION: SUBMIT ──
    if (!action || action === "submit") {
      const { imageUrl, preset, customPrompt } = body;
      if (!imageUrl) throw new Error("imageUrl não fornecida.");

      // Consume credits (skip for admin)
      if (!isAdmin) {
        const COST = 30;
        const { data: hasCredits } = await supabase.rpc("consume_credits_bulk", {
          p_user_id: user.id,
          p_amount: COST,
          p_description: "Geração de vídeo IA",
        });

        if (hasCredits === false) {
          return new Response(JSON.stringify({ error: "Créditos insuficientes. Necessário: 30" }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Upload base64 to Fal storage
      let processedImageUrl = imageUrl;
      if (imageUrl.startsWith("data:")) {
        try {
          processedImageUrl = await uploadToFalStorage(imageUrl, FAL_KEY);
        } catch (e) {
          console.log("Storage upload fallback to base64:", e);
          processedImageUrl = imageUrl;
        }
      }

      // Generate animation prompt: use AI analysis or fallback to preset
      let movementPrompt: string;
      if (customPrompt) {
        movementPrompt = customPrompt;
      } else if (LOVABLE_API_KEY) {
        try {
          movementPrompt = await analyzeImageForAnimation(processedImageUrl, preset || "ambiente_vivo", LOVABLE_API_KEY);
        } catch (e) {
          console.error("AI analysis failed, using preset fallback:", e);
          movementPrompt = `${CAMERA_PRESETS[preset] || CAMERA_PRESETS.ambiente_vivo}, cars driving smoothly on the road with realistic motion, people walking naturally, lights glowing warmly, professional architectural videography`;
        }
      } else {
        movementPrompt = `${CAMERA_PRESETS[preset] || CAMERA_PRESETS.ambiente_vivo}, cars driving smoothly on the road with realistic motion, people walking naturally, lights glowing warmly, professional architectural videography`;
      }

      console.log("Final prompt length:", movementPrompt.length);

      const submitRes = await fetch(`https://queue.fal.run/${FAL_MODEL}`, {
        method: "POST",
        headers: {
          Authorization: `Key ${FAL_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: processedImageUrl,
          prompt: movementPrompt,
          duration: "5",
          negative_prompt: "blur, distort, low quality, watermark, text overlay, jitter, flickering, morphing architecture, deformed buildings, melting structures, static cars, frozen people, no motion",
          cfg_scale: 0.5,
        }),
      });

      if (!submitRes.ok) {
        const errText = await submitRes.text();
        console.error("Fal submit error:", submitRes.status, errText);
        throw new Error(`Fal AI submit error: ${submitRes.status} - ${errText}`);
      }

      const submitData = await submitRes.json();
      console.log("Fal job submitted:", submitData.request_id);

      return new Response(JSON.stringify({
        requestId: submitData.request_id,
        statusUrl: submitData.status_url,
        responseUrl: submitData.response_url,
        status: "IN_QUEUE",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: POLL ──
    if (action === "poll") {
      const { requestId, statusUrl, responseUrl } = body;
      if (!requestId) throw new Error("requestId não fornecido.");

      const pollUrl = statusUrl || `https://queue.fal.run/${FAL_MODEL}/requests/${requestId}/status`;

      const statusRes = await fetch(`${pollUrl}?logs=1`, {
        method: "GET",
        headers: { Authorization: `Key ${FAL_KEY}` },
      });

      if (!statusRes.ok) {
        const errText = await statusRes.text();
        console.error("Poll error:", statusRes.status, errText);
        return new Response(JSON.stringify({ status: "IN_PROGRESS" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const statusData = await statusRes.json();
      console.log("Poll:", statusData.status, statusData.queue_position !== undefined ? `pos:${statusData.queue_position}` : "");

      if (statusData.status === "COMPLETED") {
        const resultUrl = responseUrl || `https://queue.fal.run/${FAL_MODEL}/requests/${requestId}`;

        const resultRes = await fetch(resultUrl, {
          method: "GET",
          headers: { Authorization: `Key ${FAL_KEY}` },
        });

        if (!resultRes.ok) {
          const errText = await resultRes.text();
          console.error("Result error:", resultRes.status, errText);
          throw new Error("Erro ao buscar resultado do vídeo.");
        }

        const result = await resultRes.json();
        const videoUrl = result?.video?.url;

        if (!videoUrl) {
          console.error("No video URL:", JSON.stringify(result));
          throw new Error("URL do vídeo não encontrada.");
        }

        return new Response(JSON.stringify({ status: "COMPLETED", videoUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (statusData.status === "FAILED") {
        const errorMsg = statusData.error || "Geração de vídeo falhou.";
        console.error("Fal AI failed:", errorMsg);
        return new Response(JSON.stringify({ status: "FAILED", error: errorMsg }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        status: statusData.status || "IN_PROGRESS",
        queuePosition: statusData.queue_position,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Ação desconhecida: ${action}`);
  } catch (err: any) {
    console.error("generate-video error:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
