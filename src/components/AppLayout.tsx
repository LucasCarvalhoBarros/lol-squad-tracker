import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, Users, LineChart, TrendingUp, Swords, Settings, Gamepad2, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { to: "/players", label: "Jogadores", icon: Users, adminOnly: false },
  { to: "/history", label: "Histórico", icon: LineChart, adminOnly: false },
  { to: "/progress", label: "Progresso", icon: TrendingUp, adminOnly: false },
  { to: "/team-builder", label: "Times 5x5", icon: Swords, adminOnly: false },
  { to: "/settings", label: "Configurações", icon: Settings, adminOnly: true },
] as const;

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();

  const isLoginRoute = location.pathname === "/login";

  useEffect(() => {
    if (!auth.isAuthed && !isLoginRoute) {
      navigate({ to: "/login" });
    } else if (auth.isAuthed && isLoginRoute) {
      navigate({ to: "/dashboard" });
    }
  }, [auth.isAuthed, isLoginRoute, navigate]);

  if (isLoginRoute) return <Outlet />;
  if (!auth.isAuthed) return null;

  const visibleNav = nav.filter((n) => !n.adminOnly || auth.isAdmin);

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card/40 backdrop-blur p-4 gap-2 sticky top-0 h-screen">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-3 mb-2">
          <div className="w-9 h-9 rounded-lg gamer-glow flex items-center justify-center bg-gradient-to-br from-primary to-accent">
            <Gamepad2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display font-bold text-lg leading-none">LoL Friends</div>
            <div className="text-xs text-muted-foreground">Tracker</div>
          </div>
        </Link>

        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs mb-1 ${auth.isAdmin ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
          {auth.isAdmin ? <ShieldCheck className="w-4 h-4" /> : <UserRound className="w-4 h-4" />}
          <span className="font-medium">{auth.isAdmin ? "Admin" : "Visitante"}</span>
        </div>

        {visibleNav.map(({ to, label, icon: Icon }) => {
          const active = location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}

        <div className="mt-auto pt-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={() => { auth.logout(); navigate({ to: "/login" }); }}
          >
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur flex justify-around p-2">
        {visibleNav.map(({ to, icon: Icon, label }) => {
          const active = location.pathname.startsWith(to);
          return (
            <Link key={to} to={to} className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
        <button
          onClick={() => { auth.logout(); navigate({ to: "/login" }); }}
          className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px] text-muted-foreground"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>

      <main className="flex-1 min-w-0 p-4 md:p-8 pb-24 md:pb-8">
        <div className="md:hidden mb-4 flex items-center justify-between">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${auth.isAdmin ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
            {auth.isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserRound className="w-3.5 h-3.5" />}
            <span className="font-medium">{auth.isAdmin ? "Admin" : "Visitante"}</span>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
