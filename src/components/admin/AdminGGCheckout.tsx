import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Clock,
  ShoppingCart,
  ShieldAlert,
  Plus,
} from "lucide-react";

interface LocalOrder {
  id: string;
  user_id: string | null;
  package_id: string | null;
  credits_added: number;
  amount_paid: number | null;
  customer_email: string | null;
  status: string;
  processed_at: string | null;
}

const AdminGGCheckout = () => {
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [apiStatus, setApiStatus] = useState<"unknown" | "ok" | "blocked">("unknown");
  const [apiPayments, setApiPayments] = useState<any[]>([]);

  // Load local orders
  const fetchLocalOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cakto_orders")
      .select("*")
      .order("processed_at", { ascending: false })
      .limit(200);
    if (error) {
      toast.error("Erro ao carregar pedidos locais");
    } else {
      setOrders(data ?? []);
    }
    setLoading(false);
  }, []);

  // Try API
  const tryFetchAPI = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("ggcheckout-api", {
        body: { action: "list_payments", params: { pageSize: 100 } },
      });
      if (error) {
        const errorBody = typeof error === "object" && "message" in error ? error.message : String(error);
        if (errorBody.includes("API_BLOCKED") || errorBody.includes("blocked")) {
          setApiStatus("blocked");
        } else {
          setApiStatus("blocked");
        }
        return;
      }
      if (data?.blocked) {
        setApiStatus("blocked");
        return;
      }
      setApiStatus("ok");
      const paymentsList = data?.payments || data?.data || data?.items || (Array.isArray(data) ? data : []);
      setApiPayments(paymentsList);
    } catch {
      setApiStatus("blocked");
    }
  }, []);

  useEffect(() => {
    fetchLocalOrders();
    tryFetchAPI();
  }, [fetchLocalOrders, tryFetchAPI]);

  const filteredOrders = search
    ? orders.filter((o) => o.customer_email?.toLowerCase().includes(search.toLowerCase()))
    : orders;

  // KPIs from local data
  const totalOrders = orders.length;
  const approvedOrders = orders.filter((o) => o.status === "approved");
  const failedOrders = orders.filter((o) => o.status !== "approved");
  const totalRevenue = approvedOrders.reduce((sum, o) => sum + (o.amount_paid ?? 0), 0);
  const totalCredits = approvedOrders.reduce((sum, o) => sum + o.credits_added, 0);

  // Reconciliation: check if any API payments are missing from local
  const reconcile = () => {
    if (apiStatus !== "ok" || apiPayments.length === 0) {
      toast.error("API do ggCheckout indisponível. Reconciliação não possível no momento.");
      return;
    }
    const localIds = new Set(orders.map((o) => o.id));
    const missing = apiPayments.filter((p: any) => {
      const ggId = `gg_${p.id}`;
      const status = String(p.status).toLowerCase();
      return (status === "paid" || status === "approved") && !localIds.has(ggId) && !localIds.has(p.id);
    });
    if (missing.length > 0) {
      toast.warning(`${missing.length} pagamento(s) pago(s) no ggCheckout sem registro local!`);
    } else {
      toast.success("Todos os pagamentos estão reconciliados!");
    }
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—";

  const formatCurrency = (v: number | null) =>
    v != null ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";

  return (
    <div className="space-y-6">
      {/* API Status Banner */}
      {apiStatus === "blocked" && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-foreground">API do ggCheckout protegida por Cloudflare</p>
              <p className="text-xs text-muted-foreground mt-1">
                A API do ggCheckout está protegida contra acessos automatizados (bot protection). 
                Os dados abaixo são do banco de dados local, registrados via webhook.
                A reconciliação automática estará disponível quando a API permitir acesso server-to-server.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pedidos</span>
            </div>
            <p className="text-2xl font-black text-foreground">{totalOrders}</p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Receita</span>
            </div>
            <p className="text-xl font-black text-foreground">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Aprovados</span>
            </div>
            <p className="text-2xl font-black text-foreground">{approvedOrders.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Falhas</span>
            </div>
            <p className="text-2xl font-black text-foreground">{failedOrders.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Plus className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Créditos</span>
            </div>
            <p className="text-2xl font-black text-foreground">{totalCredits}</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-field-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <Button onClick={fetchLocalOrders} disabled={loading} variant="outline" className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
        <Button onClick={reconcile} disabled={apiStatus !== "ok"} className="gap-2" variant="outline">
          <AlertTriangle className="w-4 h-4" />
          Reconciliar
        </Button>
      </div>

      {/* Orders Table */}
      <Card className="bg-surface border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-black uppercase tracking-widest">
            Pedidos Registrados ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] font-black uppercase">Status</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Email</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Pacote</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Créditos</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Valor</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {loading ? "Carregando..." : "Nenhum pedido encontrado"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            o.status === "approved"
                              ? "bg-green-500/10 text-green-500"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {o.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{o.customer_email ?? "—"}</TableCell>
                      <TableCell className="text-xs font-mono">{o.package_id ?? "—"}</TableCell>
                      <TableCell className="text-xs font-bold">+{o.credits_added}</TableCell>
                      <TableCell className="text-xs">{formatCurrency(o.amount_paid)}</TableCell>
                      <TableCell className="text-xs">{formatDate(o.processed_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminGGCheckout;
