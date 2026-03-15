import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Profile } from "./useAuth";

export interface AdminMetrics {
  total_users: number;
  new_users_30d: number;
  pro_users: number;
  free_users: number;
  total_prompts: number;
  prompts_30d: number;
  total_credits_consumed: number;
  credits_consumed_30d: number;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string | null;
  full_name: string | null;
  email: string;
}

export interface DailyPromptCount {
  day: string;
  prompts_count: number;
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
    async (page = 1, limit = 10, search = "", planFilter = "") => {
      if (!isAdmin) return { users: [] as Profile[], count: 0 };
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (search) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
      }
      if (planFilter) {
        query = query.eq("plan_id", planFilter);
      }

      const { data, error, count } = await query.range(from, to);

      if (error) {
        console.error("Error fetching users:", error);
        return { users: [] as Profile[], count: 0 };
      }
      return { users: (data ?? []) as Profile[], count: count ?? 0 };
    },
    [isAdmin]
  );

  const updateUserCredits = useCallback(
    async (userId: string, currentCredits: number, delta: number, reason: string) => {
      if (!isAdmin) return false;

      const newCredits = currentCredits + delta;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ credits: newCredits, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (updateError) {
        toast.error("Erro ao atualizar créditos.");
        return false;
      }

      // Record transaction
      const txType = delta >= 0 ? "bonus" : "consume";
      await supabase.from("credit_transactions").insert({
        user_id: userId,
        amount: delta,
        type: txType,
        description: reason,
      });

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

  const toggleAdmin = useCallback(
    async (targetUserId: string, makeAdmin: boolean) => {
      if (!isAdmin) return false;

      const { error } = await supabase.rpc("toggle_admin", {
        target_user_id: targetUserId,
        make_admin: makeAdmin,
      });

      if (error) {
        toast.error("Erro ao alterar permissão de admin.");
        return false;
      }
      toast.success(makeAdmin ? "Usuário promovido a admin." : "Admin rebaixado.");
      return true;
    },
    [isAdmin]
  );

  const getTransactions = useCallback(
    async (limit = 50): Promise<CreditTransaction[]> => {
      if (!isAdmin) return [];

      // We need to join profiles data. Since supabase-js supports foreign key joins:
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*, profiles!credit_transactions_user_id_fkey(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching transactions:", error);
        toast.error("Erro ao carregar transações.");
        return [];
      }

      return (data ?? []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        amount: row.amount,
        type: row.type,
        description: row.description,
        created_at: row.created_at,
        full_name: row.profiles?.full_name ?? null,
        email: row.profiles?.email ?? "",
      }));
    },
    [isAdmin]
  );

  const getDailyPrompts = useCallback(async (): Promise<DailyPromptCount[]> => {
    if (!isAdmin) return [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from("prompts")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching daily prompts:", error);
      return [];
    }

    // Aggregate by day client-side
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      const day = row.created_at ? row.created_at.slice(0, 10) : "";
      if (day) counts[day] = (counts[day] || 0) + 1;
    }

    return Object.entries(counts).map(([day, prompts_count]) => ({
      day,
      prompts_count,
    }));
  }, [isAdmin]);

  const rechargeProUsers = useCallback(async (): Promise<number> => {
    if (!isAdmin) return 0;

    const { data, error } = await supabase.rpc("recharge_pro_users");

    if (error) {
      toast.error("Erro ao recarregar usuários Pro.");
      return 0;
    }

    toast.success(`${data} usuários Pro recarregados com 200 créditos.`);
    return data as number;
  }, [isAdmin]);

  const getCreditSummary = useCallback(async () => {
    if (!isAdmin) return { totalConsumed: 0, totalDistributed: 0, avgBalance: 0 };

    // Get totals from transactions
    const { data: txData } = await supabase
      .from("credit_transactions")
      .select("amount, type");

    let totalConsumed = 0;
    let totalDistributed = 0;
    for (const tx of txData ?? []) {
      if (tx.type === "consume") totalConsumed += Math.abs(tx.amount);
      else totalDistributed += Math.abs(tx.amount);
    }

    // Get average balance
    const { data: profiles } = await supabase
      .from("profiles")
      .select("credits");

    let avgBalance = 0;
    if (profiles && profiles.length > 0) {
      avgBalance = Math.round(
        profiles.reduce((sum, p) => sum + p.credits, 0) / profiles.length
      );
    }

    return { totalConsumed, totalDistributed, avgBalance };
  }, [isAdmin]);

  return {
    isAdmin,
    getMetrics,
    getUsers,
    updateUserCredits,
    updateUserPlan,
    toggleAdmin,
    getTransactions,
    getDailyPrompts,
    rechargeProUsers,
    getCreditSummary,
  };
}
