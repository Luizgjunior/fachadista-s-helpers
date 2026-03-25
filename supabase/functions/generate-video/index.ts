import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MOVEMENT_PRESETS: Record<string, string> = {
  orbital: "Slow smooth orbital camera movement around the building, cinematic dolly, maintaining framing",
  zoom_dramatic: "Slow dramatic zoom-in toward the building entrance, cinematic depth of field",
  ambiente_vivo: "Static camera, clouds moving slowly, subtle wind in vegetation, reflections shimmering on glass, people walking",
  flyover: "Aerial flyover camera slowly moving forward, revealing the full building and surroundings",
};

const FAL_MODEL = "fal-ai/kling-video/v2.1/standard/image-to-video";

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

    const body = await req.json();
    const { action } = body;

    // ── ACTION: SUBMIT ──
    if (!action || action === "submit") {
      const { imageUrl, preset, customPrompt } = body;
      if (!imageUrl) throw new Error("imageUrl não fornecida.");

      // Consume credits
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

      const movementPrompt = customPrompt || MOVEMENT_PRESETS[preset] || MOVEMENT_PRESETS.ambiente_vivo;

      const submitRes = await fetch(`https://queue.fal.run/${FAL_MODEL}`, {
        method: "POST",
        headers: {
          Authorization: `Key ${FAL_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: imageUrl,
          prompt: movementPrompt,
          duration: "5",
        }),
      });

      if (!submitRes.ok) {
        const errText = await submitRes.text();
        console.error("Fal submit error:", submitRes.status, errText);
        throw new Error(`Fal AI submit error: ${submitRes.status}`);
      }

      const submitData = await submitRes.json();
      console.log("Fal job submitted:", JSON.stringify(submitData));

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
      const { requestId } = body;
      if (!requestId) throw new Error("requestId não fornecido.");

      const statusRes = await fetch(
        `https://queue.fal.run/${FAL_MODEL}/requests/${requestId}/status`,
        {
          method: "GET",
          headers: { Authorization: `Key ${FAL_KEY}` },
        }
      );

      if (!statusRes.ok) {
        const errText = await statusRes.text();
        console.error("Poll status error:", statusRes.status, errText);
        return new Response(JSON.stringify({ status: "IN_PROGRESS" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const statusData = await statusRes.json();
      console.log("Poll status:", JSON.stringify(statusData));

      if (statusData.status === "COMPLETED") {
        // Fetch the result
        const resultRes = await fetch(
          `https://queue.fal.run/${FAL_MODEL}/requests/${requestId}`,
          {
            method: "GET",
            headers: { Authorization: `Key ${FAL_KEY}` },
          }
        );

        if (!resultRes.ok) {
          const errText = await resultRes.text();
          console.error("Result fetch error:", resultRes.status, errText);
          throw new Error("Erro ao buscar resultado do vídeo.");
        }

        const result = await resultRes.json();
        const videoUrl = result?.video?.url;

        if (!videoUrl) {
          console.error("No video URL in result:", JSON.stringify(result));
          throw new Error("URL do vídeo não encontrada.");
        }

        return new Response(JSON.stringify({ status: "COMPLETED", videoUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (statusData.status === "FAILED") {
        return new Response(JSON.stringify({ status: "FAILED", error: "Geração falhou." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // IN_QUEUE or IN_PROGRESS
      return new Response(JSON.stringify({ status: statusData.status || "IN_PROGRESS" }), {
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
