import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Profile } from "./useAuth";

interface AdminMetrics {
  total_users: number;
  new_users_30d: number;
  pro_users: number;
  free_users: number;
  total_prompts: number;
  prompts_30d: number;
  total_credits_consumed: number;
  credits_consumed_30d: number;
}

export function useAdmin(profile: Profile | null) {
  const isAdmin = profile?.is_admin === true;

  const getMetrics = useCallback(async (): Promise<AdminMetrics | null> => {
    if (!isAdmin) return null;
    const { data, error } = await supabase
      .from("admin_metrics")
      .select("*")
      .single();
    if (error) {
      console.error("Error fetching metrics:", error);
      toast.error("Erro ao carregar métricas.");
      return null;
    }
    return data as unknown as AdminMetrics;
  }, [isAdmin]);

  const getUsers = useCallback(
    async (page = 1, limit = 20) => {
      if (!isAdmin) return { users: [], count: 0 };
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Error fetching users:", error);
        return { users: [], count: 0 };
      }
      return { users: data as Profile[], count: count ?? 0 };
    },
    [isAdmin]
  );

  const updateUserCredits = useCallback(
    async (userId: string, amount: number) => {
      if (!isAdmin) return false;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ credits: amount, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (updateError) {
        toast.error("Erro ao atualizar créditos.");
        return false;
      }

      toast.success("Créditos atualizados.");
      return true;
    },
    [isAdmin]
  );

  const updateUserPlan = useCallback(
    async (userId: string, planId: string) => {
      if (!isAdmin) return false;

      const { error } = await supabase
        .from("profiles")
        .update({ plan_id: planId, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (error) {
        toast.error("Erro ao atualizar plano.");
        return false;
      }
      toast.success("Plano atualizado.");
      return true;
    },
    [isAdmin]
  );

  return { isAdmin, getMetrics, getUsers, updateUserCredits, updateUserPlan };
}
