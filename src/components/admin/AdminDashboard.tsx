import { useState, useEffect, useCallback } from "react";
import {
  Users, Zap, Sparkles, Battery, ImageIcon, TrendingUp,
  DollarSign, RefreshCw, UserMinus, ShoppingCart, Receipt, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import type { AdminMetrics, FinancialMetrics, DailyRevenue, RevenueByPlan, MonthlyMRR } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-2xl ${className}`} />;
}

interface AdminDashboardProps {
  admin: {
    getMetrics: () => Promise<AdminMetrics | null>;
    getDailyPrompts: () => Promise<{ day: string; prompts_count: number }[]>;
    getFinancialMetrics: () => Promise<FinancialMetrics | null>;
    getDailyRevenue: () => Promise<DailyRevenue[]>;
    getRevenueByPlan: () => Promise<RevenueByPlan[]>;
    getMonthlyMRR: () => Promise<MonthlyMRR[]>;
  };
}

const formatBRL = (value: number) =>
  `R$ ${Number(value).toFixed(2).replace(".", ",")}`;

export default function AdminDashboard({ admin }: AdminDashboardProps) {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [financial, setFinancial] = useState<FinancialMetrics | null>(null);
  const [dailyData, setDailyData] = useState<{ day: string; prompts_count: number }[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [revenueByPlan, setRevenueByPlan] = useState<RevenueByPlan[]>([]);
  const [monthlyMRR, setMonthlyMRR] = useState<MonthlyMRR[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [m, d, f, dr, rp, mm] = await Promise.all([
      admin.getMetrics(),
      admin.getDailyPrompts(),
      admin.getFinancialMetrics(),
      admin.getDailyRevenue(),
      admin.getRevenueByPlan(),
      admin.getMonthlyMRR(),
    ]);
    setMetrics(m);
    setDailyData(d);
    setFinancial(f);
    setDailyRevenue(dr);
    setRevenueByPlan(rp);
    setMonthlyMRR(mm);
    setLastUpdated(new Date());
    setLoading(false);
  }, [admin]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Realtime: listen to cakto_orders changes to auto-refresh
  useEffect(() => {
    const channel = supabase
      .channel("admin-dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "cakto_orders" }, () => {
        loadAll();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        loadAll();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadAll]);

  const maxPromptCount = Math.max(...dailyData.map((d) => d.prompts_count), 1);
  const maxRevenue = Math.max(...dailyRevenue.map((d) => d.revenue), 1);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const renderRate = metrics && metrics.total_prompts
    ? ((metrics.total_renders / metrics.total_prompts) * 100).toFixed(1)
    : "0.0";

  // Projected annual revenue
  const annualProjected = (financial?.mrr ?? 0) * 12;
  // Churn rate
  const totalEverSubscribed = (financial?.active_subscribers ?? 0) + (financial?.churned_users ?? 0);
  const churnRate = totalEverSubscribed > 0
    ? (((financial?.churned_users ?? 0) / totalEverSubscribed) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6 md:space-y-10 w-full max-w-full overflow-x-hidden">
      {/* Last updated + refresh */}
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
          Atualizado: {lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          <span className="ml-1 inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </p>
        <button
          onClick={loadAll}
          className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Atualizar
        </button>
      </div>

      {/* ═══ FINANCIAL KPIs ═══ */}
      <div>
        <h2 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" /> Financeiro
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* MRR */}
          <FinancialCard
            label="MRR"
            value={formatBRL(financial?.mrr ?? 0)}
            sub={`${financial?.active_subscribers ?? 0} assinantes ativos`}
            icon={TrendingUp}
            color="text-green-600"
            bg="bg-green-50"
            highlight
          />
          {/* Faturamento 30d */}
          <FinancialCard
            label="Faturamento 30d"
            value={formatBRL(financial?.revenue_30d ?? 0)}
            sub={`${financial?.orders_30d ?? 0} pedidos no período`}
            icon={Receipt}
            color="text-primary"
            bg="bg-brand-light"
          />
          {/* Faturamento Total */}
          <FinancialCard
            label="Faturamento Total"
            value={formatBRL(financial?.revenue_total ?? 0)}
            sub={`${financial?.total_orders ?? 0} pedidos totais`}
            icon={DollarSign}
            color="text-purple-600"
            bg="bg-purple-50"
          />
          {/* Ticket Médio */}
          <FinancialCard
            label="Ticket Médio"
            value={formatBRL(financial?.avg_ticket ?? 0)}
            sub="por pedido aprovado"
            icon={ShoppingCart}
            color="text-blue-600"
            bg="bg-blue-50"
          />
          {/* Receita Prevista Anual */}
          <FinancialCard
            label="Receita Prevista (Anual)"
            value={formatBRL(annualProjected)}
            sub="baseado no MRR atual"
            icon={ArrowUpRight}
            color="text-green-600"
            bg="bg-green-50"
          />
          {/* Churn */}
          <FinancialCard
            label="Churn"
            value={`${financial?.churned_users ?? 0}`}
            sub={`${churnRate}% taxa de cancelamento`}
            icon={UserMinus}
            color="text-destructive"
            bg="bg-destructive/10"
          />
          {/* Assinantes Ativos */}
          <FinancialCard
            label="Assinantes Ativos"
            value={`${financial?.active_subscribers ?? 0}`}
            sub="planos mensais ativos"
            icon={RefreshCw}
            color="text-primary"
            bg="bg-brand-light"
          />
          {/* Pedidos 30d */}
          <FinancialCard
            label="Pedidos (30d)"
            value={`${financial?.orders_30d ?? 0}`}
            sub={`de ${financial?.total_orders ?? 0} totais`}
            icon={ShoppingCart}
            color="text-blue-600"
            bg="bg-blue-50"
          />
        </div>
      </div>

      {/* ═══ REVENUE CHART ═══ */}
      <div className="bg-surface rounded-2xl md:rounded-3xl border border-border p-4 md:p-8 shadow-sm">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
          <DollarSign className="w-3.5 h-3.5 text-green-600" /> Faturamento — Últimos 30 dias
        </h3>

        {dailyRevenue.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest">
            Nenhuma venda registrada
          </div>
        ) : (
          <div className="flex items-end gap-[2px] md:gap-1.5 h-40 md:h-52 overflow-hidden">
            {dailyRevenue.map(({ day, revenue, orders }) => {
              const heightPct = (revenue / maxRevenue) * 100;
              const dayNum = day.slice(8, 10);
              return (
                <div
                  key={day}
                  className="flex-1 flex flex-col items-center gap-1 group relative"
                >
                  <div
                    className="w-full bg-green-500/80 hover:bg-green-500 rounded-t-lg transition-colors cursor-default min-h-[4px]"
                    style={{ height: `${Math.max(heightPct, 3)}%` }}
                  />
                   <span className="text-[7px] md:text-[9px] font-bold text-muted-foreground/60 truncate">
                    {dayNum}
                  </span>
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:block bg-foreground text-background text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap shadow-lg z-10">
                    {formatBRL(revenue)} • {orders} pedido{orders !== 1 ? "s" : ""}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ MRR EVOLUTION CHART ═══ */}
      <div className="bg-surface rounded-2xl md:rounded-3xl border border-border p-4 md:p-8 shadow-sm">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-green-600" /> Evolução do MRR — Mês a Mês
        </h3>

        {monthlyMRR.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest">
            Nenhum dado disponível
          </div>
        ) : (
          <>
            <div className="flex items-end gap-1 md:gap-3 h-44 md:h-60 overflow-hidden">
              {monthlyMRR.map(({ month, mrr, total_revenue, subscribers }, idx) => {
                const maxMRR = Math.max(...monthlyMRR.map((m) => Math.max(m.mrr, m.total_revenue)), 1);
                const mrrPct = (mrr / maxMRR) * 100;
                const revPct = (total_revenue / maxMRR) * 100;
                const monthLabel = new Date(month + "T00:00:00").toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
                const yearLabel = new Date(month + "T00:00:00").getFullYear().toString().slice(2);
                const prevMRR = idx > 0 ? monthlyMRR[idx - 1].mrr : 0;
                const growth = prevMRR > 0 ? (((mrr - prevMRR) / prevMRR) * 100).toFixed(0) : null;
                return (
                  <div
                    key={month}
                    className="flex-1 min-w-0 flex flex-col items-center gap-1 group relative">
                  >
                    <div className="flex items-end gap-0.5 w-full h-full">
                      {/* MRR bar */}
                      <div
                        className="flex-1 bg-green-500/80 hover:bg-green-500 rounded-t-md transition-colors cursor-default min-h-[4px]"
                        style={{ height: `${Math.max(mrrPct, 3)}%` }}
                      />
                      {/* Total revenue bar */}
                      <div
                        className="flex-1 bg-primary/40 hover:bg-primary/60 rounded-t-md transition-colors cursor-default min-h-[4px]"
                        style={{ height: `${Math.max(revPct, 3)}%` }}
                      />
                    </div>
                    <span className="text-[8px] md:text-[9px] font-bold text-muted-foreground/60">
                      {monthLabel}/{yearLabel}
                    </span>
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 hidden group-hover:block bg-foreground text-background text-[10px] font-bold px-3 py-2 rounded-lg whitespace-nowrap shadow-lg z-10">
                      <div>MRR: {formatBRL(mrr)}</div>
                      <div>Receita: {formatBRL(total_revenue)}</div>
                      <div>{subscribers} assinante{subscribers !== 1 ? "s" : ""}</div>
                      {growth !== null && (
                        <div className={Number(growth) >= 0 ? "text-green-400" : "text-red-400"}>
                          {Number(growth) >= 0 ? "+" : ""}{growth}% vs mês anterior
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 bg-green-500 rounded-sm inline-block" /> MRR (Assinaturas)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 bg-primary/40 rounded-sm inline-block" /> Receita Total
              </span>
            </div>
          </>
        )}
      </div>

      {revenueByPlan.length > 0 && (
        <div className="bg-surface rounded-2xl md:rounded-3xl border border-border p-4 md:p-8 shadow-sm">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
            <Receipt className="w-3.5 h-3.5 text-purple-600" /> Faturamento por Plano/Pacote
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {revenueByPlan.map((plan) => {
              const totalRevenue = revenueByPlan.reduce((s, p) => s + Number(p.revenue), 0);
              const pct = totalRevenue > 0 ? ((Number(plan.revenue) / totalRevenue) * 100).toFixed(0) : "0";
              return (
                <div key={plan.package_id} className="bg-field-bg border border-border rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-foreground">
                      {plan.package_name}
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2 mb-3">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-foreground">{formatBRL(Number(plan.revenue))}</span>
                    <span className="text-muted-foreground">{plan.orders} pedidos</span>
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-1">
                    {Number(plan.credits_sold).toLocaleString("pt-BR")} créditos vendidos
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ OPERATIONAL KPIs ═══ */}
      <div>
        <h2 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Operacional
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          <MetricCard
            label="Total de Usuários"
            value={metrics?.total_users ?? 0}
            sub={`${metrics?.new_users_30d ?? 0} novos nos últimos 30 dias`}
            icon={Users}
            color="text-primary"
            bg="bg-brand-light"
          />
          <MetricCard
            label="Plano Pro"
            value={metrics?.pro_users ?? 0}
            sub={`${metrics?.free_users ?? 0} no plano Free`}
            icon={Zap}
            color="text-purple-600"
            bg="bg-purple-50"
          />
          <MetricCard
            label="Prompts Gerados"
            value={metrics?.total_prompts ?? 0}
            sub={`${metrics?.prompts_30d ?? 0} nos últimos 30 dias`}
            icon={Sparkles}
            color="text-primary"
            bg="bg-brand-light"
          />
          <MetricCard
            label="Créditos Consumidos"
            value={metrics?.total_credits_consumed ?? 0}
            sub={`${metrics?.credits_consumed_30d ?? 0} nos últimos 30 dias`}
            icon={Battery}
            color="text-muted-foreground"
            bg="bg-muted"
          />
          <MetricCard
            label="Total de Renders"
            value={metrics?.total_renders ?? 0}
            sub={`${metrics?.renders_30d ?? 0} nos últimos 30 dias`}
            icon={ImageIcon}
            color="text-primary"
            bg="bg-brand-light"
          />
          <MetricCard
            label="Taxa Prompt→Render"
            value={`${renderRate}%`}
            sub="de prompts viram renders"
            icon={TrendingUp}
            color="text-green-600"
            bg="bg-green-50"
            isString
          />
        </div>
      </div>

      {/* ═══ ACTIVITY CHART ═══ */}
      <div className="bg-surface rounded-2xl md:rounded-3xl border border-border p-4 md:p-8 shadow-sm">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> Atividade — Últimos 30 dias
        </h3>

        {dailyData.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest">
            Nenhum dado disponível
          </div>
        ) : (
          <div className="flex items-end gap-1 md:gap-1.5 h-40 md:h-52">
            {dailyData.map(({ day, prompts_count }) => {
              const heightPct = (prompts_count / maxPromptCount) * 100;
              const dayNum = day.slice(8, 10);
              return (
                <div
                  key={day}
                  className="flex-1 flex flex-col items-center gap-1 group relative"
                >
                  <div
                    className="w-full bg-primary/80 hover:bg-primary rounded-t-lg transition-colors cursor-default min-h-[4px]"
                    style={{ height: `${Math.max(heightPct, 3)}%` }}
                  />
                  <span className="text-[8px] md:text-[9px] font-bold text-muted-foreground/60">
                    {dayNum}
                  </span>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-foreground text-background text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap shadow-lg z-10">
                    {prompts_count} prompts
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Reusable Card Components ─── */

function FinancialCard({
  label, value, sub, icon: Icon, color, bg, highlight,
}: {
  label: string; value: string; sub: string;
  icon: any; color: string; bg: string; highlight?: boolean;
}) {
  return (
    <div className={`bg-surface rounded-2xl md:rounded-3xl border p-4 md:p-5 shadow-sm ${
      highlight ? "border-green-500/30 ring-1 ring-green-500/10" : "border-border"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        {highlight && (
          <span className="text-[8px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            principal
          </span>
        )}
      </div>
      <div className={`text-xl md:text-2xl font-black tracking-tight ${
        highlight ? "text-green-600" : "text-foreground"
      }`}>
        {value}
      </div>
      <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
        {label}
      </div>
      <div className="text-[9px] font-medium text-muted-foreground/70 mt-0.5">{sub}</div>
    </div>
  );
}

function MetricCard({
  label, value, sub, icon: Icon, color, bg, isString,
}: {
  label: string; value: number | string; sub: string;
  icon: any; color: string; bg: string; isString?: boolean;
}) {
  return (
    <div className="bg-surface rounded-2xl md:rounded-3xl border border-border p-4 md:p-6 shadow-sm">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
        {isString ? value : (typeof value === "number" ? value.toLocaleString("pt-BR") : value)}
      </div>
      <div className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
        {label}
      </div>
      <div className="text-[9px] font-medium text-muted-foreground/70 mt-1">{sub}</div>
    </div>
  );
}
