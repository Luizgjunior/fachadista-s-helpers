import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Profile } from "./useAuth";

interface UseCreditsOptions {
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
}

export function useCredits({ profile, refreshProfile }: UseCreditsOptions) {
  const isAdmin = profile?.is_admin === true;
  const credits = profile?.credits ?? 0;
  const hasCredits = isAdmin || credits > 0;

  const consumeCredit = useCallback(
    async (description?: string) => {
      if (!profile) {
        toast.error("Faça login para gerar prompts.");
        return false;
      }

      // Admins have unlimited credits
      if (profile.is_admin) {
        return true;
      }

      if (!hasCredits) {
        toast.error("Seus créditos acabaram. Faça upgrade do plano.");
        return false;
      }

      const { data, error } = await supabase.rpc("consume_credit", {
        p_user_id: profile.id,
        p_description: description ?? "Geração de prompt",
      });

      if (error) {
        console.error("Error consuming credit:", error);
        toast.error("Erro ao consumir crédito.");
        return false;
      }

      if (data === false) {
        toast.error("Seus créditos acabaram.");
        return false;
      }

      await refreshProfile();
      return true;
    },
    [profile, hasCredits, refreshProfile]
  );

  const consumeCredits = useCallback(
    async (amount: number, description?: string) => {
      if (!profile) {
        toast.error("Faça login para continuar.");
        return false;
      }
      if (profile.is_admin) return true;

      if ((profile.credits ?? 0) < amount) {
        toast.error(`Créditos insuficientes. Necessário: ${amount}`);
        return false;
      }

      const { data, error } = await supabase.rpc("consume_credits_bulk" as any, {
        p_user_id: profile.id,
        p_amount: amount,
        p_description: description ?? `Consumo de ${amount} créditos`,
      });

      if (error || data === false) {
        toast.error("Erro ao consumir créditos.");
        return false;
      }

      await refreshProfile();
      return true;
    },
    [profile, refreshProfile]
  );

  return { credits, hasCredits, consumeCredit, consumeCredits };
}
