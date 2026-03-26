import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search, AlertTriangle, CheckCircle, DollarSign, Clock, ShoppingCart } from "lucide-react";

interface GGPayment {
  id: string;
  status: string;
  amount: number;
  customer_email?: string;
  customer?: { email?: string; name?: string };
  product?: { name?: string };
  productName?: string;
  created_at?: string;
  createdAt?: string;
  paidAt?: string;
}

interface ReconciliationItem {
  ggPayment: GGPayment;
  localOrder: any | null;
  status: "ok" | "missing" | "pending";
}

const AdminGGCheckout = () => {
  const [payments, setPayments] = useState<GGPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [reconciliation, setReconciliation] = useState<ReconciliationItem[]>([]);
  const [showReconciliation, setShowReconciliation] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ggcheckout-api", {
        body: { action: "list_payments", params: { pageSize: 100 } },
      });
      if (error) throw error;

      // Handle different response shapes
      const paymentsList = data?.payments || data?.data || data?.items || (Array.isArray(data) ? data : []);
      setPayments(paymentsList);
    } catch (err: any) {
      console.error("Error fetching ggCheckout payments:", err);
      toast.error("Erro ao buscar pagamentos do ggCheckout");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const getEmail = (p: GGPayment) => p.customer_email || p.customer?.email || "—";
  const getProduct = (p: GGPayment) => p.productName || p.product?.name || "—";
  const getDate = (p: GGPayment) => {
    const d = p.paidAt || p.createdAt || p.created_at;
    return d ? new Date(d).toLocaleDateString("pt-BR") : "—";
  };
  const getAmount = (p: GGPayment) => {
    const val = typeof p.amount === "number" ? p.amount : 0;
    return (val / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const runReconciliation = async () => {
    const paidPayments = payments.filter(
      (p) => p.status?.toLowerCase() === "paid" || p.status?.toLowerCase() === "approved"
    );

    const { data: localOrders } = await supabase.from("cakto_orders").select("*");

    const localIds = new Set((localOrders ?? []).map((o) => o.id));

    const items: ReconciliationItem[] = paidPayments.map((p) => {
      const ggId = `gg_${p.id}`;
      const found = localIds.has(ggId) || localIds.has(p.id);
      return {
        ggPayment: p,
        localOrder: found ? (localOrders ?? []).find((o) => o.id === ggId || o.id === p.id) : null,
        status: found ? "ok" : "missing",
      };
    });

    setReconciliation(items);
    setShowReconciliation(true);

    const missing = items.filter((i) => i.status === "missing").length;
    if (missing > 0) {
      toast.warning(`${missing} pagamento(s) pago(s) sem registro local!`);
    } else {
      toast.success("Todos os pagamentos estão reconciliados!");
    }
  };

  const filteredPayments = search
    ? payments.filter((p) => getEmail(p).toLowerCase().includes(search.toLowerCase()))
    : payments;

  // KPIs
  const totalPayments = payments.length;
  const paidPayments = payments.filter(
    (p) => p.status?.toLowerCase() === "paid" || p.status?.toLowerCase() === "approved"
  );
  const pendingPayments = payments.filter(
    (p) => p.status?.toLowerCase() === "pending" || p.status?.toLowerCase() === "waiting"
  );
  const totalRevenue = paidPayments.reduce((sum, p) => sum + (typeof p.amount === "number" ? p.amount : 0), 0);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-black text-foreground">{totalPayments}</p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Receita</span>
            </div>
            <p className="text-2xl font-black text-foreground">
              {(totalRevenue / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pagos</span>
            </div>
            <p className="text-2xl font-black text-foreground">{paidPayments.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pendentes</span>
            </div>
            <p className="text-2xl font-black text-foreground">{pendingPayments.length}</p>
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
        <Button onClick={fetchPayments} disabled={loading} variant="outline" className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
        <Button onClick={runReconciliation} disabled={loading || payments.length === 0} className="gap-2">
          <AlertTriangle className="w-4 h-4" />
          Reconciliar
        </Button>
      </div>

      {/* Reconciliation Results */}
      {showReconciliation && reconciliation.length > 0 && (
        <Card className="bg-surface border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-black uppercase tracking-widest">
              Reconciliação — {reconciliation.filter((r) => r.status === "missing").length} divergência(s)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] font-black uppercase">Status</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">ID ggCheckout</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Email</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Valor</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Local</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reconciliation
                    .filter((r) => r.status === "missing")
                    .map((r) => (
                      <TableRow key={r.ggPayment.id}>
                        <TableCell>
                          <span className="text-red-500 text-[10px] font-black uppercase">Sem registro</span>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{r.ggPayment.id}</TableCell>
                        <TableCell className="text-xs">{getEmail(r.ggPayment)}</TableCell>
                        <TableCell className="text-xs">{getAmount(r.ggPayment)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">—</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments Table */}
      <Card className="bg-surface border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-black uppercase tracking-widest">
            Pagamentos ggCheckout ({filteredPayments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] font-black uppercase">Status</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Email</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Produto</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Valor</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {loading ? "Carregando..." : "Nenhum pagamento encontrado"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            p.status?.toLowerCase() === "paid" || p.status?.toLowerCase() === "approved"
                              ? "bg-green-500/10 text-green-500"
                              : p.status?.toLowerCase() === "pending" || p.status?.toLowerCase() === "waiting"
                              ? "bg-yellow-500/10 text-yellow-500"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {p.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{getEmail(p)}</TableCell>
                      <TableCell className="text-xs">{getProduct(p)}</TableCell>
                      <TableCell className="text-xs font-mono">{getAmount(p)}</TableCell>
                      <TableCell className="text-xs">{getDate(p)}</TableCell>
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
