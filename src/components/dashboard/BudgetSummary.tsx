import { useDashboard } from "@/contexts/DashboardContext";

const BudgetSummary = () => {
  const { ev, project } = useDashboard();
  const spent = ev.ac;
  const remaining = project.totalBudget - spent;
  const burnRate = spent / project.currentWeek;
  const weeksLeft = project.totalScheduleWeeks - project.currentWeek;
  const projectedTotal = spent + burnRate * weeksLeft;
  const overUnder = projectedTotal - project.totalBudget;

  const items = [
    { label: "Total Budget", value: `$${(project.totalBudget / 1000).toFixed(0)}k` },
    { label: "Spent (AC)", value: `$${(spent / 1000).toFixed(0)}k`, color: "text-foreground" },
    { label: "Remaining", value: `$${(remaining / 1000).toFixed(0)}k`, color: remaining < 0 ? "text-health-red" : "text-health-green" },
    { label: "Burn Rate", value: `$${(burnRate / 1000).toFixed(1)}k/wk`, color: "text-foreground" },
    { label: "Projected Total", value: `$${(projectedTotal / 1000).toFixed(0)}k`, color: projectedTotal > project.totalBudget ? "text-health-red" : "text-health-green" },
    { label: overUnder >= 0 ? "Over Budget" : "Under Budget", value: `$${(Math.abs(overUnder) / 1000).toFixed(0)}k`, color: overUnder >= 0 ? "text-health-red" : "text-health-green" },
  ];

  const pct = Math.min(100, Math.round((spent / project.totalBudget) * 100));

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Budget Summary</h3>
      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Budget utilization</span>
          <span>{pct}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${pct >= 90 ? "bg-health-red" : pct >= 75 ? "bg-health-amber" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item.label} className="py-2">
            <div className="text-xs text-muted-foreground">{item.label}</div>
            <div className={`font-display font-semibold text-lg ${item.color || "text-foreground"} transition-all duration-500`}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BudgetSummary;
