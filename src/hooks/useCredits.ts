import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Profile } from "./useAuth";

interface UseCreditsOptions {
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
}

export const CREDIT_COSTS = {
  PROMPT: 3,
  IMAGE: 5,
  VIDEO: 30,
} as const;

export function useCredits({ profile, refreshProfile }: UseCreditsOptions) {
  const isAdmin = profile?.is_admin === true;
  const credits = profile?.credits ?? 0;
  const hasCredits = isAdmin || credits > 0;
  const hasCreditsForPrompt = isAdmin || credits >= CREDIT_COSTS.PROMPT;
  const hasCreditsForImage = isAdmin || credits >= CREDIT_COSTS.IMAGE;
  const hasCreditsForVideo = isAdmin || credits >= CREDIT_COSTS.VIDEO;

  const consumeCredits = useCallback(
    async (amount: number, description?: string) => {
      if (!profile) {
        toast.error("Faça login para continuar.");
        return false;
      }

      if (isAdmin) return true;

      if (credits < amount) {
        toast.error(`Créditos insuficientes. Necessário: ${amount}`);
        return false;
      }

      const { data, error } = await supabase.rpc("consume_credits_bulk" as any, {
        p_user_id: profile.id,
        p_amount: amount,
        p_description: description ?? `Consumo de ${amount} créditos`,
      });

      if (error) {
        console.error("Error consuming credits:", error);
        toast.error("Erro ao consumir créditos.");
        return false;
      }

      if (data === false) {
        toast.error("Créditos insuficientes.");
        return false;
      }

      await refreshProfile();
      return true;
    },
    [profile, isAdmin, credits, refreshProfile]
  );

  const consumePromptCredits = useCallback(
    () => consumeCredits(CREDIT_COSTS.PROMPT, "Geração de prompt"),
    [consumeCredits]
  );

  const consumeImageCredits = useCallback(
    () => consumeCredits(CREDIT_COSTS.IMAGE, "Geração de render IA"),
    [consumeCredits]
  );

  const consumeVideoCredits = useCallback(
    () => consumeCredits(CREDIT_COSTS.VIDEO, "Geração de vídeo IA"),
    [consumeCredits]
  );

  return {
    credits,
    hasCredits,
    hasCreditsForPrompt,
    hasCreditsForImage,
    hasCreditsForVideo,
    consumeCredits,
    consumePromptCredits,
    consumeImageCredits,
    consumeVideoCredits,
  };
}
