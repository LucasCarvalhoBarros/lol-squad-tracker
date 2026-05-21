import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Users, LineChart, TrendingUp, Swords, Settings, Gamepad2 } from "lucide-react";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/players", label: "Jogadores", icon: Users },
  { to: "/history", label: "Histórico", icon: LineChart },
  { to: "/progress", label: "Progresso", icon: TrendingUp },
  { to: "/team-builder", label: "Times 5x5", icon: Swords },
  { to: "/settings", label: "Configurações", icon: Settings },
] as const;

export function AppLayout() {
  const location = useLocation();
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
        {nav.map(({ to, label, icon: Icon }) => {
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
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur flex justify-around p-2">
        {nav.map(({ to, icon: Icon, label }) => {
          const active = location.pathname.startsWith(to);
          return (
            <Link key={to} to={to} className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </div>

      <main className="flex-1 min-w-0 p-4 md:p-8 pb-24 md:pb-8">
        <Outlet />
      </main>
    </div>
  );
}
