import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Zap, Shield, ChevronLeft, ChevronRight, X, Loader2, Pencil, Trash2, UserPlus } from "lucide-react";
import type { Profile } from "@/hooks/useAuth";
import { toast } from "sonner";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-2xl ${className}`} />;
}

interface AdminUsersProps {
  admin: {
    getUsers: (page: number, limit: number, search: string, planFilter: string) => Promise<{ users: Profile[]; count: number }>;
    updateUserCredits: (userId: string, currentCredits: number, delta: number, reason: string) => Promise<boolean>;
    updateUserPlan: (userId: string, planId: string) => Promise<boolean>;
    toggleAdmin: (userId: string, makeAdmin: boolean) => Promise<boolean>;
    updateUserProfile: (userId: string, data: { full_name?: string; email?: string }) => Promise<boolean>;
    deleteUser: (userId: string) => Promise<boolean>;
    createUser: (data: { email: string; password: string; full_name?: string; plan_id?: string; credits?: number }) => Promise<any>;
  };
  currentProfile: Profile | null;
}

// Credit modal
function CreditModal({
  user,
  onClose,
  onConfirm,
}: {
  user: Profile;
  onClose: () => void;
  onConfirm: (delta: number, reason: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("Bônus manual");
  const [submitting, setSubmitting] = useState(false);

  const reasons = ["Bônus manual", "Correção", "Recompensa", "Penalidade"];

  const handleSubmit = async () => {
    if (amount === 0) return;
    setSubmitting(true);
    await onConfirm(amount, reason);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface rounded-3xl border border-border shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Ajustar Créditos</h3>
          <p className="text-[10px] font-bold text-muted-foreground mt-1 truncate">{user.full_name ?? user.email}</p>
        </div>

        <div className="text-center py-3 bg-field-bg rounded-2xl border border-field-border">
          <div className="text-3xl font-black text-foreground">{user.credits}</div>
          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Créditos atuais</div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Quantidade</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
            className="w-full bg-field-bg border border-field-border rounded-xl px-4 py-3 text-sm font-bold text-center focus:border-field-focus focus:ring-4 focus:ring-primary/10 outline-none"
            placeholder="Ex: 50 ou -10"
          />
          <p className="text-[9px] text-muted-foreground text-center">Positivo = adicionar, Negativo = remover</p>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Motivo</label>
          <div className="grid grid-cols-2 gap-2">
            {reasons.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                  reason === r
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-field-bg text-muted-foreground border-field-border hover:border-muted-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={amount === 0 || submitting}
          className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Confirmar
        </button>
      </div>
    </div>
  );
}

// Edit modal
function EditModal({
  user,
  onClose,
  onConfirm,
}: {
  user: Profile;
  onClose: () => void;
  onConfirm: (data: { full_name?: string; email?: string }) => Promise<void>;
}) {
  const [fullName, setFullName] = useState(user.full_name ?? "");
  const [email, setEmail] = useState(user.email);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    await onConfirm({ full_name: fullName, email });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface rounded-3xl border border-border shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Editar Usuário</h3>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nome Completo</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-field-bg border border-field-border rounded-xl px-4 py-3 text-sm focus:border-field-focus focus:ring-4 focus:ring-primary/10 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-field-bg border border-field-border rounded-xl px-4 py-3 text-sm focus:border-field-focus focus:ring-4 focus:ring-primary/10 outline-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Salvar
        </button>
      </div>
    </div>
  );
}

// Create user modal
function CreateUserModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (data: { email: string; password: string; full_name?: string; plan_id?: string; credits?: number }) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [planId, setPlanId] = useState("free");
  const [credits, setCredits] = useState(10);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      toast.error("Email e senha são obrigatórios.");
      return;
    }
    if (password.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres.");
      return;
    }
    setSubmitting(true);
    await onConfirm({ email, password, full_name: fullName || undefined, plan_id: planId, credits });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface rounded-3xl border border-border shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Criar Novo Usuário</h3>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nome Completo</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Opcional"
            className="w-full bg-field-bg border border-field-border rounded-xl px-4 py-3 text-sm focus:border-field-focus focus:ring-4 focus:ring-primary/10 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">E-mail *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-field-bg border border-field-border rounded-xl px-4 py-3 text-sm focus:border-field-focus focus:ring-4 focus:ring-primary/10 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Senha *</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mín. 6 caracteres"
            className="w-full bg-field-bg border border-field-border rounded-xl px-4 py-3 text-sm focus:border-field-focus focus:ring-4 focus:ring-primary/10 outline-none"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Plano</label>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="w-full bg-field-bg border border-field-border rounded-xl px-4 py-3 text-sm focus:border-field-focus focus:ring-4 focus:ring-primary/10 outline-none"
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
            </select>
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Créditos</label>
            <input
              type="number"
              value={credits}
              onChange={(e) => setCredits(parseInt(e.target.value) || 0)}
              className="w-full bg-field-bg border border-field-border rounded-xl px-4 py-3 text-sm focus:border-field-focus focus:ring-4 focus:ring-primary/10 outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!email || !password || submitting}
          className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Criar Usuário
        </button>
      </div>
    </div>
  );
}

// Confirm dialog
function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-surface rounded-3xl border border-border shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
        <h3 className="text-sm font-black uppercase tracking-wider text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-field-bg border border-border rounded-xl text-[11px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl text-[11px] font-black uppercase tracking-wider shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers({ admin, currentProfile }: AdminUsersProps) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [creditModal, setCreditModal] = useState<Profile | null>(null);
  const [editModal, setEditModal] = useState<Profile | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    action: () => Promise<void>;
  } | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const LIMIT = 10;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const result = await admin.getUsers(page, LIMIT, search, planFilter);
    setUsers(result.users);
    setCount(result.count);
    setLoading(false);
  }, [admin, page, search, planFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPage(1), 300);
  };

  const handleCreditConfirm = async (delta: number, reason: string) => {
    if (!creditModal) return;
    await admin.updateUserCredits(creditModal.id, creditModal.credits, delta, reason);
    await loadUsers();
  };

  const handlePlanChange = (user: Profile, newPlan: string) => {
    setConfirmAction({
      title: "Alterar Plano",
      message: `Mudar ${user.full_name ?? user.email} para plano ${newPlan.toUpperCase()}?`,
      action: async () => {
        await admin.updateUserPlan(user.id, newPlan);
        await loadUsers();
        setConfirmAction(null);
      },
    });
  };

  const handleToggleAdmin = (user: Profile) => {
    if (user.id === currentProfile?.id) {
      toast.error("Você não pode remover seu próprio admin.");
      return;
    }
    const making = !user.is_admin;
    setConfirmAction({
      title: making ? "Promover Admin" : "Rebaixar Admin",
      message: making
        ? `Promover ${user.full_name ?? user.email} a administrador?`
        : `Remover permissão de admin de ${user.full_name ?? user.email}?`,
      action: async () => {
        await admin.toggleAdmin(user.id, making);
        await loadUsers();
        setConfirmAction(null);
      },
    });
  };

  const handleEditConfirm = async (data: { full_name?: string; email?: string }) => {
    if (!editModal) return;
    await admin.updateUserProfile(editModal.id, data);
    await loadUsers();
  };

  const handleCreateUser = async (data: { email: string; password: string; full_name?: string; plan_id?: string; credits?: number }) => {
    await admin.createUser(data);
    await loadUsers();
  };

  const handleDeleteUser = (user: Profile) => {
    if (user.id === currentProfile?.id) {
      toast.error("Você não pode excluir sua própria conta.");
      return;
    }
    setConfirmAction({
      title: "Excluir Usuário",
      message: `Tem certeza que deseja excluir ${user.full_name ?? user.email}? Esta ação é irreversível.`,
      action: async () => {
        await admin.deleteUser(user.id);
        await loadUsers();
        setConfirmAction(null);
      },
    });
  };

  const totalPages = Math.ceil(count / LIMIT);
  const formatDate = (d: string | null) => {
    if (!d) return "—";
    const dt = new Date(d);
    return dt.toLocaleDateString("pt-BR");
  };

  const planFilters = [
    { id: "", label: "Todos" },
    { id: "free", label: "Free" },
    { id: "pro", label: "Pro" },
  ];

  return (
    <div className="space-y-6">
      {/* Search & filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full bg-field-bg border border-field-border rounded-2xl pl-11 pr-4 py-3 text-sm focus:border-field-focus focus:ring-4 focus:ring-primary/10 outline-none"
          />
        </div>
        <div className="flex bg-secondary p-1 rounded-xl border border-border">
          {planFilters.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => {
                setPlanFilter(id);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                planFilter === id
                  ? "bg-surface text-foreground shadow-sm border border-border"
                  : "text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-primary/20 hover:opacity-90 transition-all whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          Criar Usuário
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-2xl md:rounded-3xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            Nenhum usuário encontrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Usuário", "Plano", "Créditos", "Prompts", "Cadastro", "Ações"].map((h) => (
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
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-field-bg/50 transition-colors">
                    <td className="px-4 md:px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-brand-glow flex items-center justify-center text-[10px] font-black text-primary-foreground shrink-0">
                          {(u.full_name?.[0] ?? u.email[0]).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-foreground truncate">
                            {u.full_name ?? "—"}
                            {u.is_admin && (
                              <span className="ml-1.5 text-[8px] font-black text-primary bg-brand-light px-1.5 py-0.5 rounded-md uppercase">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3">
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                          u.plan_id === "pro"
                            ? "bg-brand-light text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {u.plan_id ?? "free"}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3">
                      <span
                        className={`text-sm font-black ${
                          u.credits < 3 ? "text-destructive" : "text-foreground"
                        }`}
                      >
                        {u.credits}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3 text-xs font-bold text-foreground">
                      {u.total_prompts_generated}
                    </td>
                    <td className="px-4 md:px-6 py-3 text-[10px] font-medium text-muted-foreground">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="px-4 md:px-6 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCreditModal(u)}
                          className="text-[9px] font-black uppercase tracking-wider bg-field-bg border border-field-border px-2.5 py-1.5 rounded-lg text-foreground hover:border-primary hover:text-primary transition-all"
                        >
                          ⚡ Créditos
                        </button>
                        <button
                          onClick={() => handlePlanChange(u, u.plan_id === "pro" ? "free" : "pro")}
                          className="text-[9px] font-black uppercase tracking-wider bg-field-bg border border-field-border px-2.5 py-1.5 rounded-lg text-foreground hover:border-primary hover:text-primary transition-all"
                        >
                          {u.plan_id === "pro" ? "→ Free" : "→ Pro"}
                        </button>
                        <button
                          onClick={() => handleToggleAdmin(u)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            u.is_admin
                              ? "bg-primary/10 border-primary/30 text-primary"
                              : "bg-field-bg border-field-border text-muted-foreground hover:text-primary hover:border-primary"
                          }`}
                        >
                          <Shield className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditModal(u)}
                          className="p-1.5 rounded-lg border bg-field-bg border-field-border text-muted-foreground hover:text-blue-600 hover:border-blue-400 transition-all"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-1.5 rounded-lg border bg-field-bg border-field-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-all"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <span className="text-[10px] font-bold text-muted-foreground">
              {count} usuário{count !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-field-bg border border-border disabled:opacity-30 hover:bg-surface-hover transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-black text-foreground px-3">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg bg-field-bg border border-border disabled:opacity-30 hover:bg-surface-hover transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Credit Modal */}
      {creditModal && (
        <CreditModal
          user={creditModal}
          onClose={() => setCreditModal(null)}
          onConfirm={handleCreditConfirm}
        />
      )}

      {/* Edit Modal */}
      {editModal && (
        <EditModal
          user={editModal}
          onClose={() => setEditModal(null)}
          onConfirm={handleEditConfirm}
        />
      )}

      {/* Confirm Dialog */}
      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.title}
          message={confirmAction.message}
          onConfirm={confirmAction.action}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Create User Modal */}
      {createModal && (
        <CreateUserModal
          onClose={() => setCreateModal(false)}
          onConfirm={handleCreateUser}
        />
      )}
    </div>
  );
}
