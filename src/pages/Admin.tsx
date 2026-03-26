import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowLeft, LogOut, BarChart3, Users, CreditCard, ShoppingCart } from "lucide-react";
import { useAuth, type Profile } from "@/hooks/useAuth";
import { useAdmin, type AdminMetrics } from "@/hooks/useAdmin";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminCredits from "@/components/admin/AdminCredits";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminGGCheckout from "@/components/admin/AdminGGCheckout";

type AdminTab = "dashboard" | "users" | "credits" | "orders" | "ggcheckout";

const Admin = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const admin = useAdmin(profile);
  const [tab, setTab] = useState<AdminTab>("dashboard");

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const tabs = [
    { id: "dashboard" as const, label: "Dashboard", icon: BarChart3 },
    { id: "users" as const, label: "Usuários", icon: Users },
    { id: "credits" as const, label: "Créditos", icon: CreditCard },
    { id: "orders" as const, label: "Pedidos", icon: ShoppingCart },
    { id: "ggcheckout" as const, label: "ggCheckout", icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden w-full max-w-full">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-border px-4 py-3 md:px-10 md:py-5">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-5">
            <div className="bg-gradient-to-br from-primary to-brand-glow p-2 rounded-xl shadow-lg shadow-primary/20">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <h1 className="text-lg md:text-2xl font-black tracking-tighter text-foreground uppercase italic">
                NEW<span className="text-primary">R</span>
              </h1>
              <span className="text-[9px] md:text-[10px] font-black text-primary-foreground bg-primary px-2 py-0.5 rounded-lg uppercase tracking-widest">
                Admin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <span className="hidden md:block text-[10px] font-bold text-muted-foreground truncate max-w-[200px]">
              {profile?.email}
            </span>
            <button
              onClick={() => navigate("/app")}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground bg-field-bg border border-border px-3 py-2 rounded-xl transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden md:inline">App</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground bg-field-bg border border-border px-3 py-2 rounded-xl transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-border bg-surface/50">
        <div className="max-w-[1400px] mx-auto px-4 md:px-10">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                  tab === id
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-field-bg"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-[1400px] mx-auto px-4 md:px-10 py-6 md:py-10">
        {tab === "dashboard" && <AdminDashboard admin={admin} />}
        {tab === "users" && <AdminUsers admin={admin} currentProfile={profile} />}
        {tab === "credits" && <AdminCredits admin={admin} />}
        {tab === "orders" && <AdminOrders admin={admin} />}
        {tab === "ggcheckout" && <AdminGGCheckout />}
      </main>
    </div>
  );
};

export default Admin;
