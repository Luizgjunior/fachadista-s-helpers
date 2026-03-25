import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DYNAMIC_ELEMENTS = "cars driving smoothly on the road with realistic motion, people walking naturally on sidewalks with natural body movement, lights flickering and glowing realistically turning on and off, neon signs illuminating, street lamps casting warm light, headlights and taillights visible on moving vehicles, window lights toggling softly";

const MOVEMENT_PRESETS: Record<string, string> = {
  orbital: `Slow smooth orbital camera movement around the building, cinematic dolly, maintaining framing, professional architectural videography, ${DYNAMIC_ELEMENTS}`,
  zoom_dramatic: `Slow dramatic zoom-in toward the building entrance, cinematic depth of field, smooth steady camera, professional quality, ${DYNAMIC_ELEMENTS}`,
  ambiente_vivo: `Static camera, clouds moving slowly across sky, subtle wind rustling vegetation and trees, reflections shimmering on glass facades, ${DYNAMIC_ELEMENTS}, realistic ambient motion`,
  flyover: `Aerial flyover camera slowly moving forward over the building, revealing full architecture and surroundings, smooth cinematic drone shot, ${DYNAMIC_ELEMENTS}`,
};

const FAL_MODEL = "fal-ai/kling-video/v2.1/standard/image-to-video";

/**
 * Upload base64 image to Fal storage to avoid sending large payloads
 */
async function uploadToFalStorage(base64DataUri: string, falKey: string): Promise<string> {
  // If it's already a URL, return as-is
  if (base64DataUri.startsWith("http")) return base64DataUri;

  // Extract base64 data and mime type
  const match = base64DataUri.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) throw new Error("Formato de imagem inválido.");

  const mimeType = match[1];
  const base64Data = match[2];
  const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

  // Upload to Fal storage
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
    // Fallback: just use the base64 directly (Fal supports it)
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

    // Check if user is admin
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

      // Upload base64 to Fal storage for better performance
      let processedImageUrl = imageUrl;
      if (imageUrl.startsWith("data:")) {
        try {
          processedImageUrl = await uploadToFalStorage(imageUrl, FAL_KEY);
        } catch (e) {
          console.log("Storage upload fallback to base64:", e);
          processedImageUrl = imageUrl; // Fallback to base64
        }
      }

      const movementPrompt = customPrompt || MOVEMENT_PRESETS[preset] || MOVEMENT_PRESETS.ambiente_vivo;

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
          negative_prompt: "blur, distort, low quality, watermark, text overlay, jitter, flickering, morphing architecture, deformed buildings, melting structures",
          cfg_scale: 0.5,
        }),
      });

      if (!submitRes.ok) {
        const errText = await submitRes.text();
        console.error("Fal submit error:", submitRes.status, errText);
        throw new Error(`Fal AI submit error: ${submitRes.status} - ${errText}`);
      }

      const submitData = await submitRes.json();
      console.log("Fal job submitted:", submitData.request_id, "status_url:", submitData.status_url);

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

      // Use status_url from submit response
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
        // Fetch result
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

      // IN_QUEUE or IN_PROGRESS
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
