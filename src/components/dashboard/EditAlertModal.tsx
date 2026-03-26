import { useState } from "react";
import { useDashboard, Alert } from "@/contexts/DashboardContext";
import { X, Plus, Trash2, Pencil } from "lucide-react";

const EditAlertModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { alerts, addAlert, updateAlert, removeAlert } = useDashboard();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ type: "warning" as Alert["type"], title: "", description: "", cause: "", action: "" });

  if (!open) return null;

  const startEdit = (a: Alert) => {
    setEditingId(a.id);
    setForm({ type: a.type, title: a.title, description: a.description, cause: a.cause, action: a.action });
    setIsAdding(false);
  };

  const startAdd = () => {
    setEditingId(null);
    setForm({ type: "warning", title: "", description: "", cause: "", action: "" });
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    if (isAdding) {
      addAlert(form);
    } else if (editingId !== null) {
      updateAlert(editingId, form);
    }
    setIsAdding(false);
    setEditingId(null);
    setForm({ type: "warning", title: "", description: "", cause: "", action: "" });
  };

  const showForm = isAdding || editingId !== null;
  const typeColors = { warning: "text-health-amber", critical: "text-health-red", info: "text-primary" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card w-full max-w-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">Manage Alerts</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>

        <div className="space-y-2">
          {alerts.map(a => (
            <div key={a.id} className={`flex items-center justify-between px-4 py-3 rounded-lg bg-secondary/50 ${editingId === a.id ? "ring-1 ring-primary/40" : ""}`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold uppercase ${typeColors[a.type]}`}>{a.type}</span>
                  <span className="text-sm font-medium text-foreground">{a.title}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">{a.description}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => startEdit(a)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => removeAlert(a.id)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {!showForm && (
          <button onClick={startAdd} className="flex items-center gap-2 text-sm text-primary hover:underline">
            <Plus className="w-4 h-4" /> Add Alert
          </button>
        )}

        {showForm && (
          <div className="space-y-4 p-4 rounded-lg border border-border bg-secondary/30">
            <h3 className="text-sm font-medium text-foreground">{isAdding ? "New Alert" : "Edit Alert"}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                <select className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={form.type} onChange={e => setForm({ ...form, type: e.target.value as Alert["type"] })}>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Title</label>
                <input className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                <textarea className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[60px]"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Root Cause</label>
                <input className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={form.cause} onChange={e => setForm({ ...form, cause: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Recommended Action</label>
                <input className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={form.action} onChange={e => setForm({ ...form, action: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={handleSave} className="px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:brightness-110 transition-all">
                {isAdding ? "Add Alert" : "Update"}
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Done</button>
        </div>
      </div>
    </div>
  );
};

export default EditAlertModal;
