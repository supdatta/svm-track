import { useState } from "react";
import { useDashboard } from "@/contexts/DashboardContext";
import { X } from "lucide-react";

const EditMetricsModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { ev, health, updateEV, updateHealth } = useDashboard();
  const [tab, setTab] = useState<"ev" | "health">("ev");
  const [evForm, setEvForm] = useState({ pv: ev.pv, ev: ev.ev, ac: ev.ac });
  const [healthForm, setHealthForm] = useState({
    schedule: health.schedule, cost: health.cost, quality: health.quality,
    productivity: health.productivity, risk: health.risk,
  });

  if (!open) return null;

  const handleSave = () => {
    if (tab === "ev") {
      updateEV(evForm);
    } else {
      updateHealth(healthForm);
    }
    onClose();
  };

  const clamp = (v: number) => Math.min(100, Math.max(0, v));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">Edit Metrics</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>

        <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
          <button onClick={() => setTab("ev")} className={`flex-1 px-3 py-1.5 text-xs rounded-md transition-all ${tab === "ev" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            Earned Value
          </button>
          <button onClick={() => setTab("health")} className={`flex-1 px-3 py-1.5 text-xs rounded-md transition-all ${tab === "health" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            Health Scores
          </button>
        </div>

        {tab === "ev" ? (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Planned Value ($)</label>
              <input type="number" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={evForm.pv || ""} onChange={e => setEvForm({ ...evForm, pv: e.target.value === "" ? 0 : Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Earned Value ($)</label>
              <input type="number" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={evForm.ev || ""} onChange={e => setEvForm({ ...evForm, ev: e.target.value === "" ? 0 : Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Actual Cost ($)</label>
              <input type="number" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={evForm.ac || ""} onChange={e => setEvForm({ ...evForm, ac: e.target.value === "" ? 0 : Number(e.target.value) })} />
            </div>
            <p className="text-xs text-muted-foreground">SPI, CPI, and variances are auto-calculated from these values.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {(["schedule", "cost", "quality", "productivity", "risk"] as const).map(key => (
              <div key={key}>
                <label className="text-xs text-muted-foreground mb-1 block capitalize">{key} (0–100)</label>
                <input type="number" min={0} max={100}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={healthForm[key] || ""} onChange={e => setHealthForm({ ...healthForm, [key]: e.target.value === "" ? 0 : clamp(Number(e.target.value)) })} />
              </div>
            ))}
            <p className="col-span-2 text-xs text-muted-foreground">Overall score is auto-averaged from all five dimensions.</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:brightness-110 transition-all">Save</button>
        </div>
      </div>
    </div>
  );
};

export default EditMetricsModal;
