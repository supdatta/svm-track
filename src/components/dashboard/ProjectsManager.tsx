import { useState, useEffect } from "react";
import {
  Folder, GitBranch, Search, Trash2, Activity, AlertTriangle,
  DollarSign, Clock, Users, TrendingUp, TrendingDown, Minus,
  CheckCircle2, AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type ProjectType = "github" | "manual";

interface TeamMember {
  name: string;
  role: string;
  hoursPerWeek: number;
  hoursWorkedTotal: number;
}

interface Project {
  id: string;
  title: string;
  type: ProjectType;
  description?: string;
  lastUpdated: string;
  status: "active" | "archived" | "completed";
  githubUrl?: string;
  // Manual project fields
  totalBudget?: number;
  actualCostSpent?: number;
  extraBudgetRequested?: number;
  totalScheduleWeeks?: number;
  currentWeek?: number;
  percentComplete?: number;
  teamMembers?: TeamMember[];
}

const loadProjects = (): Project[] => {
  try {
    const stored = localStorage.getItem("trackware_projects");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.warn("Failed to load projects from localStorage:", error);
  }
  return [];
};

const ConfirmDeleteDialog = ({
  project, onConfirm, onCancel,
}: {
  project: Project;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
    <div className="relative z-10 glass-card p-6 rounded-2xl w-full max-w-sm mx-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-destructive" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground">Delete Project?</h3>
          <p className="text-xs text-muted-foreground mt-0.5">This action cannot be undone.</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Are you sure you want to remove{" "}
        <span className="text-foreground font-medium">"{project.title}"</span>?
        All tracking data for this project will be lost.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium glass-card-hover text-foreground transition-all">Cancel</button>
        <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-destructive text-white hover:brightness-110 transition-all">Delete</button>
      </div>
    </div>
  </div>
);

const fmt = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` :
  n >= 1_000 ? `$${(n / 1_000).toFixed(1)}K` :
  `$${n}`;

const ManualProjectCard = ({ project, onDelete, onOpen }: { project: Project; onDelete: () => void; onOpen: () => void }) => {
  const budget = project.totalBudget ?? 0;
  const spent = project.actualCostSpent ?? 0;
  const extra = project.extraBudgetRequested ?? 0;
  const weeks = project.totalScheduleWeeks ?? 1;
  const currentWeek = project.currentWeek ?? 1;
  const pctComplete = project.percentComplete ?? 0;
  const members = project.teamMembers ?? [];
  const timeElapsedPct = Math.min(100, Math.round((currentWeek / weeks) * 100));

  // Cost metrics
  const budgetUsedPct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const costVariance = budget > 0 ? spent - budget * (pctComplete / 100) : 0;
  const isOverBudget = costVariance > 0;
  const isOnTrack = !isOverBudget && timeElapsedPct <= pctComplete + 5;

  // Schedule
  const behindSchedule = pctComplete < timeElapsedPct - 5;

  const totalHrsPlanned = members.reduce((s, m) => s + m.hoursPerWeek * currentWeek, 0);
  const totalHrsWorked = members.reduce((s, m) => s + (m.hoursWorkedTotal ?? 0), 0);

  return (
    <div className="glass-card flex flex-col group transition-all hover:border-primary/30">
      {/* Header */}
      <div className="p-5 flex-1 space-y-4">
        <div className="flex justify-between items-start">
          <div className={`p-2 rounded-lg bg-health-amber/10 text-health-amber`}>
            <Folder className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            {isOverBudget && (
              <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive uppercase tracking-wider">Over Budget</span>
            )}
            {behindSchedule && (
              <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-health-amber/10 text-health-amber uppercase tracking-wider">Behind</span>
            )}
            {isOnTrack && !isOverBudget && (
              <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-health-green/10 text-health-green uppercase tracking-wider">On Track</span>
            )}
            <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider ${
              project.status === 'active' ? 'bg-health-green/10 text-health-green' :
              project.status === 'completed' ? 'bg-primary/10 text-primary' :
              'bg-muted text-muted-foreground'
            }`}>{project.status}</span>
          </div>
        </div>

        <div>
          <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-primary transition-colors leading-tight">
            {project.title}
          </h3>
          {project.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{project.description}</p>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Week {currentWeek} of {weeks}</span>
            <span className="text-foreground font-medium">{pctComplete}% done</span>
          </div>
          <div className="space-y-1">
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${pctComplete}%` }} title="Work complete" />
            </div>
            <div className="h-1 bg-secondary rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${timeElapsedPct > pctComplete + 5 ? 'bg-health-amber' : 'bg-health-green/60'}`} style={{ width: `${timeElapsedPct}%` }} title="Time elapsed" />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-0.5"><span className="w-2 h-1 rounded-sm bg-primary inline-block" /> Work done</span>
              <span className="flex items-center gap-0.5"><span className={`w-2 h-1 rounded-sm inline-block ${timeElapsedPct > pctComplete + 5 ? 'bg-health-amber' : 'bg-health-green/60'}`} /> Time elapsed</span>
            </div>
          </div>
        </div>

        {/* Budget row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/40 rounded-lg p-2.5">
            <div className="flex items-center gap-1 mb-1">
              <DollarSign className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Planned Budget</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{fmt(budget)}</span>
          </div>
          <div className={`rounded-lg p-2.5 ${isOverBudget ? 'bg-destructive/10' : 'bg-secondary/40'}`}>
            <div className="flex items-center gap-1 mb-1">
              <DollarSign className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Actual Spent</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-sm font-semibold ${isOverBudget ? 'text-destructive' : 'text-foreground'}`}>{fmt(spent)}</span>
              {isOverBudget
                ? <TrendingUp className="w-3 h-3 text-destructive" />
                : spent === 0
                ? <Minus className="w-3 h-3 text-muted-foreground" />
                : <TrendingDown className="w-3 h-3 text-health-green" />}
            </div>
          </div>
        </div>

        {/* Budget bar */}
        {budget > 0 && (
          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Budget used: {budgetUsedPct}%</span>
              {extra > 0 && <span className="text-health-amber">+{fmt(extra)} extra requested</span>}
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${budgetUsedPct > 100 ? 'bg-destructive' : budgetUsedPct > 80 ? 'bg-health-amber' : 'bg-health-green'}`}
                style={{ width: `${Math.min(100, budgetUsedPct)}%` }} />
            </div>
          </div>
        )}

        {/* Team */}
        {members.length > 0 && (
          <div>
            <div className="flex items-center gap-1 mb-2">
              <Users className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium">Team ({members.length})</span>
              <span className="text-[10px] text-muted-foreground ml-auto">
                {totalHrsWorked}h worked / {totalHrsPlanned}h planned
              </span>
            </div>
            <div className="space-y-1">
              {members.slice(0, 3).map((m, i) => {
                const planned = m.hoursPerWeek * currentWeek;
                const worked = m.hoursWorkedTotal ?? 0;
                const utilPct = planned > 0 ? Math.min(100, Math.round((worked / planned) * 100)) : 0;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary flex-shrink-0">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-[10px] mb-0.5">
                        <span className="text-foreground truncate">{m.name} <span className="text-muted-foreground">· {m.role}</span></span>
                        <span className="text-muted-foreground flex-shrink-0 ml-1">{worked}h/{m.hoursPerWeek}h/wk</span>
                      </div>
                      <div className="h-1 bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${utilPct > 100 ? 'bg-destructive' : utilPct > 80 ? 'bg-health-amber' : 'bg-primary'}`}
                          style={{ width: `${utilPct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
              {members.length > 3 && (
                <p className="text-[10px] text-muted-foreground pl-7">+{members.length - 3} more members</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3.5 border-t border-border/50 bg-secondary/20 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">Updated {new Date(project.lastUpdated).toLocaleDateString()}</div>
        <div className="flex items-center gap-2">
          <button onClick={onOpen} className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-primary/10" title="Open Dashboard">
            <Activity className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const GitHubProjectCard = ({ project, onDelete, onOpen }: { project: Project; onDelete: () => void; onOpen: () => void }) => (
  <div className="glass-card flex flex-col group transition-all hover:border-primary/30">
    <div className="p-5 flex-1 space-y-3">
      <div className="flex justify-between items-start">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <GitBranch className="w-5 h-5" />
        </div>
        <span className={`text-[10px] font-medium px-2 py-1 rounded-full uppercase tracking-wider ${
          project.status === 'active' ? 'bg-health-green/10 text-health-green' :
          project.status === 'completed' ? 'bg-primary/10 text-primary' :
          'bg-muted text-muted-foreground'
        }`}>{project.status}</span>
      </div>
      <div>
        <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-primary transition-colors">{project.title}</h3>
        {project.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>}
      </div>
      {project.githubUrl && (
        <div className="flex items-center gap-1.5 text-xs text-primary/70">
          <GitBranch className="w-3 h-3" />
          <span className="truncate">{project.githubUrl.replace("https://github.com/", "")}</span>
        </div>
      )}
    </div>
    <div className="px-5 py-3.5 border-t border-border/50 bg-secondary/20 flex items-center justify-between">
      <div className="text-xs text-muted-foreground">Updated {new Date(project.lastUpdated).toLocaleDateString()}</div>
      <div className="flex items-center gap-2">
        <button onClick={onOpen} className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-primary/10" title="Open Dashboard">
          <Activity className="w-4 h-4" />
        </button>
        <button onClick={onDelete} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
);

const ProjectsManager = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>(loadProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === "trackware_projects") setProjects(loadProjects()); };
    const onCustom = () => setProjects(loadProjects());
    window.addEventListener("storage", onStorage);
    window.addEventListener("trackware_projects_updated", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("trackware_projects_updated", onCustom);
    };
  }, []);

  const handleDeleteConfirmed = () => {
    if (!pendingDelete) return;
    const updated = projects.filter(p => p.id !== pendingDelete.id);
    setProjects(updated);
    setPendingDelete(null);
    try { localStorage.setItem("trackware_projects", JSON.stringify(updated)); } catch {}
  };

  const handleOpen = (project: Project) => {
    if (project.type === "github") {
      navigate("/dashboard/github", { state: { githubUrl: project.githubUrl || project.description?.replace("GitHub Repository: ", "") } });
    } else {
      navigate("/dashboard/spm", { state: { project } });
    }
  };

  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const githubProjects = filteredProjects.filter(p => p.type === "github");
  const manualProjects = filteredProjects.filter(p => p.type === "manual");

  return (
    <>
      {pendingDelete && (
        <ConfirmDeleteDialog
          project={pendingDelete}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-secondary/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <button
            onClick={() => navigate("/setup")}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:brightness-110 transition-all shadow-md shadow-primary/20 whitespace-nowrap"
          >
            New Project
          </button>
        </div>

        {projects.length > 0 && (
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> All: {filteredProjects.length}</div>
            <div className="flex items-center gap-1.5"><GitBranch className="w-3.5 h-3.5" /> GitHub: {githubProjects.length}</div>
            <div className="flex items-center gap-1.5"><Folder className="w-3.5 h-3.5" /> Manual: {manualProjects.length}</div>
          </div>
        )}

        {filteredProjects.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-border rounded-xl">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-4">
              {searchQuery ? <Search className="w-6 h-6 text-muted-foreground" /> : <Folder className="w-6 h-6 text-muted-foreground" />}
            </div>
            <h3 className="font-medium text-foreground text-lg">{searchQuery ? "No projects found" : "No projects yet"}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {searchQuery ? "No projects match your search query." : "Create your first project to start tracking metrics."}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate("/setup")}
                className="mt-5 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:brightness-110 transition-all shadow-md shadow-primary/20"
              >
                Create your first project
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {githubProjects.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-primary" /> GitHub Projects
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {githubProjects.map(p => (
                    <GitHubProjectCard key={p.id} project={p} onDelete={() => setPendingDelete(p)} onOpen={() => handleOpen(p)} />
                  ))}
                </div>
              </section>
            )}
            {manualProjects.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Folder className="w-4 h-4 text-health-amber" /> Manual Projects
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {manualProjects.map(p => (
                    <ManualProjectCard key={p.id} project={p} onDelete={() => setPendingDelete(p)} onOpen={() => handleOpen(p)} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ProjectsManager;
