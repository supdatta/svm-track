import { useState, useEffect } from "react";
import { Folder, GitBranch, Search, Trash2, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";

type ProjectType = "github" | "manual";

interface Project {
  id: string;
  title: string;
  type: ProjectType;
  description?: string;
  lastUpdated: string;
  status: "active" | "archived" | "completed";
}

const PLACEHOLDER_IDS = new Set(["1", "2"]);
const PLACEHOLDER_TITLES = new Set(["Frontend Refactor", "Q1 Marketing Campaign"]);

const loadProjects = (): Project[] => {
  try {
    const stored = localStorage.getItem("trackware_projects");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        // Remove old auto-generated placeholder projects that were injected by a previous version
        const real = parsed.filter(
          (p: Project) => !(PLACEHOLDER_IDS.has(p.id) && PLACEHOLDER_TITLES.has(p.title))
        );
        if (real.length !== parsed.length) {
          localStorage.setItem("trackware_projects", JSON.stringify(real));
        }
        return real;
      }
    }
  } catch (error) {
    console.warn("Failed to load projects from localStorage:", error);
  }
  return [];
};

const ProjectsManager = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>(loadProjects);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "trackware_projects") {
        setProjects(loadProjects());
      }
    };
    const onCustom = () => setProjects(loadProjects());
    window.addEventListener("storage", onStorage);
    window.addEventListener("trackware_projects_updated", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("trackware_projects_updated", onCustom);
    };
  }, []);

  const handleDelete = (id: string) => {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    try {
      localStorage.setItem("trackware_projects", JSON.stringify(updated));
    } catch (error) {
      console.warn("Failed to save projects to localStorage:", error);
    }
  };

  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const githubProjects = filteredProjects.filter(p => p.type === "github");
  const manualProjects = filteredProjects.filter(p => p.type === "manual");

  const renderProjectCard = (project: Project) => (
    <div key={project.id} className="glass-card flex flex-col group transition-all hover:border-primary/30">
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2 rounded-lg ${project.type === 'github' ? 'bg-primary/10 text-primary' : 'bg-health-amber/10 text-health-amber'}`}>
            {project.type === 'github' ? <GitBranch className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
          </div>
          <span className={`text-[10px] font-medium px-2 py-1 rounded-full uppercase tracking-wider ${
            project.status === 'active' ? 'bg-health-green/10 text-health-green' :
            project.status === 'completed' ? 'bg-primary/10 text-primary' :
            'bg-muted text-muted-foreground'
          }`}>
            {project.status}
          </span>
        </div>
        <h3 className="font-display font-semibold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
          {project.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.description || "No description provided."}
        </p>
      </div>
      <div className="px-5 py-4 border-t border-border/50 bg-secondary/20 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Updated {new Date(project.lastUpdated).toLocaleDateString()}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(project.type === 'github' ? '/dashboard/github' : '/dashboard/spm', { state: { project } })}
            className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-primary/10"
            title="Open Dashboard"
          >
            <Activity className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(project.id)}
            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10"
            title="Delete Project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
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
          <div>All projects: {filteredProjects.length}</div>
          <div>GitHub: {githubProjects.length}</div>
          <div>Manual: {manualProjects.length}</div>
        </div>
      )}

      {filteredProjects.length === 0 ? (
        <div className="col-span-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-border rounded-xl">
          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-4">
            {searchQuery ? <Search className="w-6 h-6 text-muted-foreground" /> : <Folder className="w-6 h-6 text-muted-foreground" />}
          </div>
          <h3 className="font-medium text-foreground text-lg">
            {searchQuery ? "No projects found" : "No projects yet"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {searchQuery
              ? "No projects match your search query."
              : "Create your first project to start tracking metrics."}
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
              <h2 className="text-lg font-semibold text-foreground mb-4">GitHub Projects</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {githubProjects.map(renderProjectCard)}
              </div>
            </section>
          )}

          {manualProjects.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4">Manual Projects</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {manualProjects.map(renderProjectCard)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectsManager;
