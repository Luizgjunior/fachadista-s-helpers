import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw, Search, AlertTriangle, CheckCircle, Plus, Package,
  XCircle, Clock, ArrowUpRight,
} from "lucide-react";
import type { Order } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminOrdersProps {
  admin: {
    getOrders: (limit?: number) => Promise<Order[]>;
    updateUserCredits: (userId: string, currentCredits: number, delta: number, reason: string) => Promise<boolean>;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  approved: { label: "Aprovado", color: "text-green-400", icon: CheckCircle },
  renewed: { label: "Renovado", color: "text-blue-400", icon: RefreshCw },
  user_not_found: { label: "Usuário não encontrado", color: "text-red-400", icon: XCircle },
  pending: { label: "Pendente", color: "text-yellow-400", icon: Clock },
};

export default function AdminOrders({ admin }: AdminOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [reprocessing, setReprocessing] = useState<string | null>(null);

  // Manual credit form
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualEmail, setManualEmail] = useState("");
  const [manualAmount, setManualAmount] = useState("50");
  const [manualReason, setManualReason] = useState("");
  const [addingManual, setAddingManual] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const data = await admin.getCaktoOrders(200);
    setOrders(data);
    setLoading(false);
  }, [admin]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      !search ||
      o.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleReprocess = async (order: CaktoOrder) => {
    if (!order.customer_email || order.status === "approved" || order.status === "renewed") {
      toast.error("Pedido já processado ou sem email.");
      return;
    }

    setReprocessing(order.id);

    try {
      // Find user by email
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, credits")
        .eq("email", order.customer_email)
        .single();

      if (!profile) {
        toast.error(`Usuário ${order.customer_email} não encontrado.`);
        setReprocessing(null);
        return;
      }

      // Add credits
      const success = await admin.updateUserCredits(
        profile.id,
        profile.credits,
        order.credits_added,
        `Reprocessamento pedido ${order.id}`
      );

      if (success) {
        toast.success(`${order.credits_added} créditos adicionados para ${order.customer_email}`);
        await loadOrders();
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao reprocessar pedido.");
    }

    setReprocessing(null);
  };

  const handleManualAdd = async () => {
    if (!manualEmail || !manualAmount) {
      toast.error("Preencha email e quantidade.");
      return;
    }

    setAddingManual(true);

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, credits")
        .eq("email", manualEmail.toLowerCase().trim())
        .single();

      if (!profile) {
        toast.error(`Usuário ${manualEmail} não encontrado.`);
        setAddingManual(false);
        return;
      }

      const amount = parseInt(manualAmount, 10);
      const reason = manualReason || `Adição manual de ${amount} créditos pelo admin`;

      const success = await admin.updateUserCredits(
        profile.id,
        profile.credits,
        amount,
        reason
      );

      if (success) {
        toast.success(`${amount} créditos adicionados para ${manualEmail}`);
        setManualEmail("");
        setManualAmount("50");
        setManualReason("");
        setShowManualForm(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao adicionar créditos.");
    }

    setAddingManual(false);
  };

  const failedOrders = orders.filter(
    (o) => o.status === "user_not_found" || o.status === "pending"
  );

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Alert: Failed orders */}
      {failedOrders.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-red-400 uppercase tracking-wider">
              {failedOrders.length} pedido(s) com falha
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Esses pedidos não creditaram o usuário. Use o botão "Reprocessar" para corrigir.
            </p>
          </div>
        </div>
      )}

      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por email ou ID..."
            className="w-full pl-9 pr-4 py-2.5 bg-field-bg border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-field-bg border border-border rounded-xl text-xs text-foreground px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">Todos os status</option>
          <option value="approved">Aprovados</option>
          <option value="renewed">Renovados</option>
          <option value="user_not_found">Usuário não encontrado</option>
        </select>
        <button
          onClick={() => setShowManualForm(!showManualForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-wider hover:opacity-90 transition-all whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar créditos
        </button>
        <button
          onClick={loadOrders}
          className="flex items-center gap-2 px-4 py-2.5 bg-field-bg border border-border rounded-xl text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all whitespace-nowrap"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {/* Manual credit form */}
      {showManualForm && (
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            Adicionar créditos manualmente
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              placeholder="Email do usuário"
              className="bg-field-bg border border-border rounded-xl text-xs text-foreground px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
            />
            <input
              type="number"
              value={manualAmount}
              onChange={(e) => setManualAmount(e.target.value)}
              placeholder="Quantidade"
              min="1"
              className="bg-field-bg border border-border rounded-xl text-xs text-foreground px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
            />
            <input
              value={manualReason}
              onChange={(e) => setManualReason(e.target.value)}
              placeholder="Motivo (opcional)"
              className="bg-field-bg border border-border rounded-xl text-xs text-foreground px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleManualAdd}
              disabled={addingManual}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-50"
            >
              {addingManual ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5" />
              )}
              Confirmar
            </button>
            <button
              onClick={() => setShowManualForm(false)}
              className="px-4 py-2.5 bg-field-bg border border-border rounded-xl text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Orders list */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <RefreshCw className="w-5 h-5 text-primary animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-xs">
            Nenhum pedido encontrado.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const config = statusConfig[order.status] ?? statusConfig.pending;
            const StatusIcon = config.icon;
            const isFailed = order.status === "user_not_found";

            return (
              <div
                key={order.id}
                className={`bg-surface border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
                  isFailed ? "border-red-500/30" : "border-border"
                }`}
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusIcon className={`w-3.5 h-3.5 shrink-0 ${config.color}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-[9px] text-muted-foreground truncate">
                      ID: {order.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap text-[10px] text-muted-foreground">
                    <span className="truncate">{order.customer_email ?? "—"}</span>
                    <span>
                      {order.credits_added} créditos
                    </span>
                    {order.amount_paid && (
                      <span>
                        R$ {Number(order.amount_paid).toFixed(2).replace(".", ",")}
                      </span>
                    )}
                    {order.processed_at && (
                      <span>
                        {new Date(order.processed_at).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                </div>

                {isFailed && (
                  <button
                    onClick={() => handleReprocess(order)}
                    disabled={reprocessing === order.id}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-red-500/30 transition-all disabled:opacity-50 whitespace-nowrap shrink-0"
                  >
                    {reprocessing === order.id ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <ArrowUpRight className="w-3 h-3" />
                    )}
                    Reprocessar
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
