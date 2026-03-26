import { useDashboard } from "@/contexts/DashboardContext";
import { TrendingDown, TrendingUp, DollarSign, Clock, BarChart3, Activity } from "lucide-react";
import { useState } from "react";

const MetricCard = ({ label, value, icon: Icon, subtext, trend, detail, active, onClick }: {
  label: string; value: string; icon: React.ElementType;
  subtext?: string; trend?: "up" | "down" | "neutral";
  detail?: string; active?: boolean; onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className={`glass-card p-5 text-left w-full transition-all duration-300 ${
      active ? "ring-1 ring-primary/40 bg-primary/5" : "hover:bg-glass-hover hover:border-primary/20"
    }`}
  >
    <div className="flex items-start justify-between mb-3">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      {trend === "up" && <TrendingUp className="w-4 h-4 text-health-green" />}
      {trend === "down" && <TrendingDown className="w-4 h-4 text-health-red" />}
    </div>
    <div className="font-display text-2xl font-bold text-foreground transition-all duration-500">{value}</div>
    <div className="text-xs text-muted-foreground mt-1">{label}</div>
    {subtext && <div className="text-[10px] text-muted-foreground/70 mt-0.5">{subtext}</div>}
    {active && detail && (
      <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground animate-in slide-in-from-top-1 duration-200">
        {detail}
      </div>
    )}
  </button>
);

const EarnedValueCards = () => {
  const { ev, project } = useDashboard();
  const [expanded, setExpanded] = useState<string | null>(null);
  const toggle = (k: string) => setExpanded(expanded === k ? null : k);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Planned Value" value={`$${(ev.pv / 1000).toFixed(0)}k`} icon={Clock}
        subtext={`Week ${project.currentWeek}/${project.totalScheduleWeeks}`}
        active={expanded === "pv"} onClick={() => toggle("pv")}
        detail={`Total budget: $${(project.totalBudget / 1000).toFixed(0)}k · ${Math.round((ev.pv / project.totalBudget) * 100)}% allocated`}
      />
      <MetricCard
        label="Earned Value" value={`$${(ev.ev / 1000).toFixed(0)}k`} icon={BarChart3}
        trend="down" subtext={`${((ev.ev / ev.pv) * 100).toFixed(0)}% of planned`}
        active={expanded === "ev"} onClick={() => toggle("ev")}
        detail={`Schedule variance: $${(ev.scheduleVariance / 1000).toFixed(1)}k — work delivered is behind plan`}
      />
      <MetricCard
        label="SPI" value={ev.spi.toFixed(2)} icon={Activity}
        trend={ev.spi >= 1 ? "up" : "down"} subtext={ev.spi >= 1 ? "On schedule" : "Behind schedule"}
        active={expanded === "spi"} onClick={() => toggle("spi")}
        detail={`Target ≥ 1.00 · Current gap: ${(1 - ev.spi).toFixed(2)} — need ${Math.round((1 - ev.spi) * 100)}% acceleration`}
      />
      <MetricCard
        label="CPI" value={ev.cpi.toFixed(2)} icon={DollarSign}
        trend={ev.cpi >= 1 ? "up" : "down"} subtext={ev.cpi >= 1 ? "Under budget" : "Over budget"}
        active={expanded === "cpi"} onClick={() => toggle("cpi")}
        detail={`Cost variance: $${(ev.costVariance / 1000).toFixed(1)}k — spending exceeds earned value`}
      />
    </div>
  );
};

export default EarnedValueCards;
