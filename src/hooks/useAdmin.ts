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

export interface CaktoOrder {
  id: string;
  user_id: string | null;
  package_id: string | null;
  credits_added: number;
  amount_paid: number | null;
  customer_email: string | null;
  status: string;
  processed_at: string | null;
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
        .eq("is_admin", false)
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

      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*, profiles!credit_transactions_user_id_fkey(full_name, email, is_admin)")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching transactions:", error);
        toast.error("Erro ao carregar transações.");
        return [];
      }

      // Exclude admin transactions
      return (data ?? [])
        .filter((row: any) => !row.profiles?.is_admin)
        .map((row: any) => ({
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
      .select("created_at, profiles!prompts_user_id_fkey(is_admin)")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching daily prompts:", error);
      return [];
    }

    // Aggregate by day, excluding admin prompts
    const counts: Record<string, number> = {};
    for (const row of (data ?? []) as any[]) {
      if (row.profiles?.is_admin) continue;
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

    // Get transactions joined with profiles to exclude admins
    const { data: txData } = await supabase
      .from("credit_transactions")
      .select("amount, type, profiles!credit_transactions_user_id_fkey(is_admin)");

    let totalConsumed = 0;
    let totalDistributed = 0;
    for (const tx of (txData ?? []) as any[]) {
      if (tx.profiles?.is_admin) continue;
      if (tx.type === "consume") totalConsumed += Math.abs(tx.amount);
      else totalDistributed += Math.abs(tx.amount);
    }

    // Get average balance excluding admins
    const { data: profiles } = await supabase
      .from("profiles")
      .select("credits")
      .eq("is_admin", false);

    let avgBalance = 0;
    if (profiles && profiles.length > 0) {
      avgBalance = Math.round(
        profiles.reduce((sum, p) => sum + p.credits, 0) / profiles.length
      );
    }

    return { totalConsumed, totalDistributed, avgBalance };
  }, [isAdmin]);

  const updateUserProfile = useCallback(
    async (userId: string, data: { full_name?: string; email?: string }) => {
      if (!isAdmin) return false;
      const { error } = await supabase
        .from("profiles")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (error) {
        toast.error("Erro ao atualizar perfil.");
        return false;
      }
      toast.success("Perfil atualizado.");
      return true;
    },
    [isAdmin]
  );

  const deleteUser = useCallback(
    async (userId: string) => {
      if (!isAdmin) return false;
      // Delete profile (cascades to transactions and prompts via FK)
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);
      if (error) {
        toast.error("Erro ao excluir usuário.");
        return false;
      }
      toast.success("Usuário excluído.");
      return true;
    },
    [isAdmin]
  );

  const getCaktoOrders = useCallback(async (limit = 50): Promise<CaktoOrder[]> => {
    if (!isAdmin) return [];
    const { data, error } = await supabase
      .from("cakto_orders")
      .select("*")
      .order("processed_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("Error fetching cakto orders:", error);
      return [];
    }
    return (data ?? []) as CaktoOrder[];
  }, [isAdmin]);

  return {
    isAdmin,
    getMetrics,
    getUsers,
    updateUserCredits,
    updateUserPlan,
    toggleAdmin,
    updateUserProfile,
    deleteUser,
    getTransactions,
    getDailyPrompts,
    rechargeProUsers,
    getCreditSummary,
    getCaktoOrders,
  };
}
