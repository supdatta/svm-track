import { useState } from "react";
import { useDashboard, TeamMember } from "@/contexts/DashboardContext";
import { X, Plus, Trash2, Pencil } from "lucide-react";

const emptyMember: TeamMember = { name: "", role: "", weeklyHours: [8, 8, 8, 8, 8, 0, 0], avgHours: 5.7 };

const EditTeamModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { team, addTeamMember, updateTeamMember, removeTeamMember } = useDashboard();
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [form, setForm] = useState<TeamMember>(emptyMember);
  const [isAdding, setIsAdding] = useState(false);

  if (!open) return null;

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setForm({ ...team[idx] });
    setIsAdding(false);
  };

  const startAdd = () => {
    setEditingIdx(null);
    setForm({ ...emptyMember });
    setIsAdding(true);
  };

  const handleSave = () => {
    const avg = form.weeklyHours.length > 0
      ? +(form.weeklyHours.reduce((a, b) => a + b, 0) / form.weeklyHours.length).toFixed(1)
      : form.avgHours;
    const member = { ...form, avgHours: avg };

    if (isAdding) {
      if (!member.name.trim() || !member.role.trim()) return;
      addTeamMember(member);
    } else if (editingIdx !== null) {
      updateTeamMember(editingIdx, member);
    }
    setIsAdding(false);
    setEditingIdx(null);
    setForm(emptyMember);
  };

  const handleRemove = (idx: number) => {
    removeTeamMember(idx);
    if (editingIdx === idx) {
      setEditingIdx(null);
      setForm(emptyMember);
    }
  };

  const updateHour = (dayIdx: number, val: string) => {
    const hrs = [...form.weeklyHours];
    const num = val === "" ? 0 : Math.min(24, Math.max(0, Number(val)));
    hrs[dayIdx] = num;
    setForm({ ...form, weeklyHours: hrs });
  };

  const showForm = isAdding || editingIdx !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card w-full max-w-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">Manage Team</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>

        {/* Team list */}
        <div className="space-y-2">
          {team.map((m, idx) => (
            <div key={idx} className={`flex items-center justify-between px-4 py-3 rounded-lg bg-secondary/50 transition-all ${editingIdx === idx ? "ring-1 ring-primary/40" : ""}`}>
              <div>
                <div className="text-sm font-medium text-foreground">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.role} · {m.avgHours}h avg</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => startEdit(idx)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleRemove(idx)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {!showForm && (
          <button onClick={startAdd} className="flex items-center gap-2 text-sm text-primary hover:underline">
            <Plus className="w-4 h-4" /> Add Team Member
          </button>
        )}

        {showForm && (
          <div className="space-y-4 p-4 rounded-lg border border-border bg-secondary/30">
            <h3 className="text-sm font-medium text-foreground">{isAdding ? "New Member" : `Editing: ${team[editingIdx!]?.name}`}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Name</label>
                <input className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Role</label>
                <input className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Weekly Hours (Mon–Sun)</label>
              <div className="grid grid-cols-7 gap-2">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                  <div key={i} className="text-center">
                    <div className="text-[10px] text-muted-foreground mb-1">{day}</div>
                    <input type="number" min={0} max={24} step={1}
                      className="w-full bg-secondary border border-border rounded px-1 py-1.5 text-xs text-center text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      value={form.weeklyHours[i] ?? ""}
                      onChange={e => updateHour(i, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setIsAdding(false); setEditingIdx(null); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={handleSave} className="px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:brightness-110 transition-all">
                {isAdding ? "Add Member" : "Update"}
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

export default EditTeamModal;
