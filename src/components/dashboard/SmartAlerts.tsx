import { useDashboard } from "@/contexts/DashboardContext";
import { AlertTriangle, AlertCircle, Info, ChevronRight, X, RotateCcw } from "lucide-react";

const iconMap = {
  warning: AlertTriangle,
  critical: AlertCircle,
  info: Info,
};

const colorMap = {
  warning: "text-health-amber border-health-amber/20 bg-health-amber/5",
  critical: "text-health-red border-health-red/20 bg-health-red/5",
  info: "text-primary border-primary/20 bg-primary/5",
};

const SmartAlerts = () => {
  const { alerts, dismissedAlertIds, dismissAlert, restoreAlerts } = useDashboard();
  const visible = alerts.filter((a) => !dismissedAlertIds.has(a.id));
  const dismissedCount = dismissedAlertIds.size;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Smart Alerts</h3>
        <div className="flex items-center gap-2">
          {dismissedCount > 0 && (
            <button onClick={restoreAlerts} className="flex items-center gap-1 text-xs text-primary hover:underline">
              <RotateCcw className="w-3 h-3" /> Restore {dismissedCount}
            </button>
          )}
          <span className="text-xs text-muted-foreground tabular-nums">{visible.length} active</span>
        </div>
      </div>
      <div className="space-y-3">
        {visible.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            All alerts dismissed. <button onClick={restoreAlerts} className="text-primary hover:underline ml-1">Restore all</button>
          </div>
        )}
        {visible.map((alert) => {
          const Icon = iconMap[alert.type];
          return (
            <details key={alert.id} className={`rounded-lg border p-4 ${colorMap[alert.type]} group animate-in fade-in duration-300`}>
              <summary className="flex items-center gap-3 cursor-pointer list-none">
                <Icon className="w-4 h-4 shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{alert.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{alert.description}</div>
                </div>
                <button
                  onClick={(e) => { e.preventDefault(); dismissAlert(alert.id); }}
                  className="p-1 rounded hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-open:rotate-90 transition-transform" />
              </summary>
              <div className="mt-3 pt-3 border-t border-border/50 space-y-2 text-xs">
                <div><span className="text-muted-foreground">Cause: </span><span className="text-foreground">{alert.cause}</span></div>
                <div><span className="text-muted-foreground">Action: </span><span className="text-foreground">{alert.action}</span></div>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
};

export default SmartAlerts;
