import { useState, useEffect } from "react";
import { Users, Zap, Sparkles, Battery, ImageIcon, TrendingUp } from "lucide-react";
import type { AdminMetrics } from "@/hooks/useAdmin";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-2xl ${className}`} />;
}

interface AdminDashboardProps {
  admin: {
    getMetrics: () => Promise<AdminMetrics | null>;
    getDailyPrompts: () => Promise<{ day: string; prompts_count: number }[]>;
  };
}

export default function AdminDashboard({ admin }: AdminDashboardProps) {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [dailyData, setDailyData] = useState<{ day: string; prompts_count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [m, d] = await Promise.all([admin.getMetrics(), admin.getDailyPrompts()]);
      setMetrics(m);
      setDailyData(d);
      setLoading(false);
    };
    load();
  }, [admin]);

  const maxCount = Math.max(...dailyData.map((d) => d.prompts_count), 1);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
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

  const cards = [
    {
      label: "Total de Usuários",
      value: metrics?.total_users ?? 0,
      sub: `${metrics?.new_users_30d ?? 0} novos nos últimos 30 dias`,
      icon: Users,
      color: "text-primary",
      bg: "bg-brand-light",
    },
    {
      label: "Plano Pro",
      value: metrics?.pro_users ?? 0,
      sub: `${metrics?.free_users ?? 0} no plano Free`,
      icon: Zap,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Prompts Gerados",
      value: metrics?.total_prompts ?? 0,
      sub: `${metrics?.prompts_30d ?? 0} nos últimos 30 dias`,
      icon: Sparkles,
      color: "text-primary",
      bg: "bg-brand-light",
    },
    {
      label: "Créditos Consumidos",
      value: metrics?.total_credits_consumed ?? 0,
      sub: `${metrics?.credits_consumed_30d ?? 0} nos últimos 30 dias`,
      icon: Battery,
      color: "text-muted-foreground",
      bg: "bg-muted",
    },
    {
      label: "Total de Renders",
      value: metrics?.total_renders ?? 0,
      sub: `${metrics?.renders_30d ?? 0} nos últimos 30 dias`,
      icon: ImageIcon,
      color: "text-primary",
      bg: "bg-brand-light",
    },
    {
      label: "Taxa Prompt→Render",
      value: `${renderRate}%`,
      sub: "de prompts viram renders",
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
      isString: true,
    },
  ];

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
        {cards.map(({ label, value, sub, icon: Icon, color, bg, isString }: any) => (
          <div
            key={label}
            className="bg-surface rounded-2xl md:rounded-3xl border border-border p-4 md:p-6 shadow-sm"
          >
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
              {isString ? value : (typeof value === 'number' ? value.toLocaleString("pt-BR") : value)}
            </div>
            <div className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
              {label}
            </div>
            <div className="text-[9px] font-medium text-muted-foreground/70 mt-1">{sub}</div>
          </div>
        ))}
      </div>

      {/* Activity chart */}
      <div className="bg-surface rounded-2xl md:rounded-3xl border border-border p-4 md:p-8 shadow-sm">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-6">
          Atividade — Últimos 30 dias
        </h3>

        {dailyData.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest">
            Nenhum dado disponível
          </div>
        ) : (
          <div className="flex items-end gap-1 md:gap-1.5 h-40 md:h-52">
            {dailyData.map(({ day, prompts_count }) => {
              const heightPct = (prompts_count / maxCount) * 100;
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
                  {/* Tooltip */}
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
