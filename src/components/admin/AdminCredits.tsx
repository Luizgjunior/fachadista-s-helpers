import { useState, useEffect } from "react";
import { TrendingDown, Gift, BarChart3, RefreshCw, Loader2, X, ShoppingBag } from "lucide-react";
import type { CreditTransaction, CaktoOrder } from "@/hooks/useAdmin";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-2xl ${className}`} />;
}

interface AdminCreditsProps {
  admin: {
    getCreditSummary: () => Promise<{ totalConsumed: number; totalDistributed: number; avgBalance: number }>;
    getTransactions: (limit?: number) => Promise<CreditTransaction[]>;
    rechargeProUsers: () => Promise<number>;
    getCaktoOrders: (limit?: number) => Promise<CaktoOrder[]>;
  };
}

const TYPE_STYLES: Record<string, { label: string; className: string }> = {
  consume: { label: "Consumo", className: "bg-destructive/10 text-destructive" },
  bonus: { label: "Bônus", className: "bg-green-100 text-green-700" },
  recharge: { label: "Recarga", className: "bg-blue-100 text-blue-700" },
  purchase: { label: "Compra", className: "bg-purple-100 text-purple-700" },
};

export default function AdminCredits({ admin }: AdminCreditsProps) {
  const [summary, setSummary] = useState({ totalConsumed: 0, totalDistributed: 0, avgBalance: 0 });
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [caktoOrders, setCaktoOrders] = useState<CaktoOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRechargeConfirm, setShowRechargeConfirm] = useState(false);
  const [recharging, setRecharging] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [s, t, o] = await Promise.all([
        admin.getCreditSummary(),
        admin.getTransactions(50),
        admin.getCaktoOrders(50),
      ]);
      setSummary(s);
      setTransactions(t);
      setCaktoOrders(o);
      setLoading(false);
    };
    load();
  }, [admin]);

  const handleRecharge = async () => {
    setRecharging(true);
    await admin.rechargeProUsers();
    // Reload data
    const [s, t] = await Promise.all([admin.getCreditSummary(), admin.getTransactions(50)]);
    setSummary(s);
    setTransactions(t);
    setRecharging(false);
    setShowRechargeConfirm(false);
  };

  const formatDateTime = (d: string | null) => {
    if (!d) return "—";
    const dt = new Date(d);
    return `${dt.toLocaleDateString("pt-BR")} ${dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const summaryCards = [
    {
      label: "Total Consumido",
      value: summary.totalConsumed,
      icon: TrendingDown,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: "Total Distribuído",
      value: summary.totalDistributed,
      icon: Gift,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Saldo Médio",
      value: summary.avgBalance,
      icon: BarChart3,
      color: "text-primary",
      bg: "bg-brand-light",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
        {summaryCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-surface rounded-2xl md:rounded-3xl border border-border p-4 md:p-6 shadow-sm"
          >
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="text-2xl font-black text-foreground tracking-tight">
              {value.toLocaleString("pt-BR")}
            </div>
            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Recharge button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowRechargeConfirm(true)}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Recarregar Plano Pro
        </button>
      </div>

      {/* Transactions table */}
      <div className="bg-surface rounded-2xl md:rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            Transações Recentes
          </h3>
        </div>

        {transactions.length === 0 ? (
          <div className="p-12 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            Nenhuma transação encontrada
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Usuário", "Tipo", "Quantidade", "Descrição", "Data"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 md:px-6 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const style = TYPE_STYLES[tx.type] ?? { label: tx.type, className: "bg-muted text-muted-foreground" };
                  return (
                    <tr key={tx.id} className="border-b border-border/50 hover:bg-field-bg/50 transition-colors">
                      <td className="px-4 md:px-6 py-3">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-foreground truncate">{tx.full_name ?? "—"}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{tx.email}</div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${style.className}`}>
                          {style.label}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3">
                        <span
                          className={`text-sm font-black ${
                            tx.amount < 0 ? "text-destructive" : "text-green-600"
                          }`}
                        >
                          {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 text-[10px] text-muted-foreground max-w-[200px] truncate">
                        {tx.description ?? "—"}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                        {formatDateTime(tx.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cakto Orders */}
      <div className="bg-surface rounded-2xl md:rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <ShoppingBag className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            Pedidos via Cakto
          </h3>
          {caktoOrders.length > 0 && (
            <span className="bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded-full">
              {caktoOrders.length}
            </span>
          )}
        </div>

        {caktoOrders.length === 0 ? (
          <div className="p-12 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            Nenhum pedido Cakto registrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Data", "E-mail", "Pacote", "Créditos", "Valor", "Status"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 md:px-6 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {caktoOrders.map((order) => {
                  const isApproved = order.status === "approved";
                  return (
                    <tr key={order.id} className="border-b border-border/50 hover:bg-field-bg/50 transition-colors">
                      <td className="px-4 md:px-6 py-3 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                        {formatDateTime(order.processed_at)}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-xs font-bold text-foreground truncate max-w-[180px]">
                        {order.customer_email ?? "—"}
                      </td>
                      <td className="px-4 md:px-6 py-3">
                        <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-muted text-muted-foreground">
                          {order.package_id ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3">
                        <span className="text-sm font-black text-green-600">+{order.credits_added}</span>
                      </td>
                      <td className="px-4 md:px-6 py-3 text-xs font-bold text-foreground whitespace-nowrap">
                        {order.amount_paid != null ? `R$ ${Number(order.amount_paid).toFixed(2).replace(".", ",")}` : "—"}
                      </td>
                      <td className="px-4 md:px-6 py-3">
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                            isApproved
                              ? "bg-green-100 text-green-700"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {isApproved ? "Aprovado" : order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showRechargeConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setShowRechargeConfirm(false)} />
          <div className="relative w-full max-w-sm bg-surface rounded-3xl border border-border shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowRechargeConfirm(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Recarga em Massa</h3>
            <p className="text-xs text-muted-foreground">
              Adicionar <span className="font-black text-primary">200 créditos</span> para todos os usuários do plano Pro?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRechargeConfirm(false)}
                className="flex-1 py-3 bg-field-bg border border-border rounded-xl text-[11px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleRecharge}
                disabled={recharging}
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl text-[11px] font-black uppercase tracking-wider shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {recharging && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
