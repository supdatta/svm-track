import { Link, useLocation } from "react-router-dom";
import { GitBranch, BarChart3, Settings, Plus, Layers } from "lucide-react";

const navItems = [
  { icon: Layers, label: "Projects", path: "/dashboard/projects" },
  { icon: GitBranch, label: "GitHub Scanner", path: "/dashboard/github" },
  { icon: BarChart3, label: "Project Metrics", path: "/dashboard/spm" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

const DashboardSidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 border-r border-border bg-sidebar flex flex-col">
      <Link to="/" className="flex items-center gap-3 px-6 h-16 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-lime-sm flex-shrink-0">
          <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5">
            <rect x="2" y="4" width="8" height="2.5" rx="1.25" fill="#0a0a0a"/>
            <rect x="2" y="8.75" width="12" height="2.5" rx="1.25" fill="#0a0a0a"/>
            <rect x="2" y="13.5" width="6" height="2.5" rx="1.25" fill="#0a0a0a"/>
            <circle cx="16" cy="5.25" r="1.5" fill="#0a0a0a" opacity="0.5"/>
            <circle cx="16" cy="10" r="1.5" fill="#0a0a0a" opacity="0.5"/>
            <circle cx="16" cy="14.75" r="1.5" fill="#0a0a0a" opacity="0.5"/>
          </svg>
        </div>
        <span className="font-display font-bold text-lg text-foreground">
          <span className="text-primary">trackware</span>
        </span>
      </Link>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-4">
          <Link
            to="/setup"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all border border-dashed border-border hover:border-primary/30"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        </div>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="glass-card p-3 text-center">
          <div className="text-xs text-muted-foreground">trackware v0.1.0</div>
          <div className="text-[10px] text-muted-foreground/60 mt-0.5">Engineering Intelligence</div>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
