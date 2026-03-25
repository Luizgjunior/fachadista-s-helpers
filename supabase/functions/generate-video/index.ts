import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const MOVEMENT_PRESETS: Record<string, string> = {
  orbital:
    "Slow smooth orbital camera movement around the building, cinematic dolly, maintaining framing",
  zoom_dramatic:
    "Slow dramatic zoom-in toward the building entrance, cinematic depth of field",
  ambiente_vivo:
    "Static camera, clouds moving slowly, subtle wind in vegetation, reflections shimmering on glass, people walking",
  flyover:
    "Aerial flyover camera slowly moving forward, revealing the full building and surroundings",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FAL_KEY = Deno.env.get("FAL_KEY");
    if (!FAL_KEY) throw new Error("FAL_KEY não configurada.");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autenticado.");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!).auth.getUser(token);
    if (authError || !user) throw new Error("Token inválido.");

    // Check credits (30)
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

    const body = await req.json();
    const { imageUrl, preset, customPrompt } = body;

    if (!imageUrl) throw new Error("imageUrl não fornecida.");

    const movementPrompt =
      customPrompt || MOVEMENT_PRESETS[preset] || MOVEMENT_PRESETS.ambiente_vivo;

    // Submit to Fal AI Queue
    const submitRes = await fetch(
      "https://queue.fal.run/fal-ai/kling-video/v2.1/standard/image-to-video",
      {
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
      }
    );

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      console.error("Fal submit error:", errText);
      throw new Error(`Fal AI error: ${submitRes.status}`);
    }

    const { request_id } = await submitRes.json();
    console.log("Fal job submitted:", request_id);

    // Poll for completion (max 180s)
    const maxPollTime = 180_000;
    const startTime = Date.now();
    let pollInterval = 3000;

    while (Date.now() - startTime < maxPollTime) {
      await sleep(pollInterval);
      pollInterval = Math.min(pollInterval * 1.2, 8000);

      const statusRes = await fetch(
        `https://queue.fal.run/fal-ai/kling-video/v2.1/standard/image-to-video/requests/${request_id}/status`,
        {
          headers: { Authorization: `Key ${FAL_KEY}` },
        }
      );

      if (!statusRes.ok) {
        console.error("Poll error:", statusRes.status);
        continue;
      }

      const status = await statusRes.json();
      console.log("Poll status:", status.status);

      if (status.status === "COMPLETED") {
        // Fetch result
        const resultRes = await fetch(
          `https://queue.fal.run/fal-ai/kling-video/v2.1/standard/image-to-video/requests/${request_id}`,
          {
            headers: { Authorization: `Key ${FAL_KEY}` },
          }
        );

        if (!resultRes.ok) throw new Error("Erro ao buscar resultado do vídeo.");

        const result = await resultRes.json();
        const videoUrl = result?.video?.url;

        if (!videoUrl) throw new Error("URL do vídeo não encontrada na resposta.");

        return new Response(JSON.stringify({ videoUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (status.status === "FAILED") {
        throw new Error("Geração de vídeo falhou no Fal AI.");
      }
    }

    throw new Error("Timeout: vídeo não ficou pronto em 180s.");
  } catch (err: any) {
    console.error("generate-video error:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro interno" }), {
      status: err.message?.includes("Créditos") ? 402 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
