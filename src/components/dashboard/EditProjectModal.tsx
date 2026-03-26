import { useState } from "react";
import { useDashboard } from "@/contexts/DashboardContext";
import { X } from "lucide-react";

const EditProjectModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { project, updateProject } = useDashboard();
  const [form, setForm] = useState({ ...project });

  if (!open) return null;

  const handleSave = () => {
    updateProject(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">Edit Project</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Project Name</label>
            <input className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Workspace</label>
            <input className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={form.workspace} onChange={e => setForm({ ...form, workspace: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Total Budget ($)</label>
            <input type="number" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={form.totalBudget || ""} onChange={e => setForm({ ...form, totalBudget: e.target.value === "" ? 0 : Number(e.target.value) })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Team Size</label>
            <input type="number" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={form.teamSize || ""} onChange={e => setForm({ ...form, teamSize: e.target.value === "" ? 0 : Number(e.target.value) })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Schedule (weeks)</label>
            <input type="number" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={form.totalScheduleWeeks || ""} onChange={e => setForm({ ...form, totalScheduleWeeks: e.target.value === "" ? 0 : Number(e.target.value) })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Current Week</label>
            <input type="number" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={form.currentWeek || ""} onChange={e => setForm({ ...form, currentWeek: e.target.value === "" ? 0 : Number(e.target.value) })} />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:brightness-110 transition-all">Save</button>
        </div>
      </div>
    </div>
  );
};

export default EditProjectModal;
