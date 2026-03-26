import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, ArrowLeft, GitBranch, PenTool, Users, Plus, Trash2,
  Activity, BarChart3, Shield, Zap, Sparkles, CheckCircle, Code,
} from "lucide-react";

type Mode = "github" | "manual" | null;

interface TeamMember {
  name: string;
  role: string;
}

interface ManualProject {
  name: string;
  description: string;
  totalBudget: number;
  totalScheduleWeeks: number;
  currentWeek: number;
  teamMembers: TeamMember[];
}

const FEATURES = [
  {
    icon: BarChart3,
    title: "Earned Value Metrics",
    desc: "Track PV, EV, AC, SPI, CPI — understand cost and schedule performance at a glance.",
  },
  {
    icon: Shield,
    title: "5-Axis Health Radar",
    desc: "Monitor schedule, cost, quality, productivity, and risk health scores in real-time.",
  },
  {
    icon: Zap,
    title: "Smart Alerts",
    desc: "Automatic alerts when metrics cross thresholds — SPI drops, cost overruns, team overload.",
  },
  {
    icon: Users,
    title: "Team Capacity Tracking",
    desc: "Visualize workload distribution with heatmaps and capacity tables per team member.",
  },
  {
    icon: Activity,
    title: "Trend Analysis",
    desc: "Weekly EV trends and productivity charts to spot patterns and forecast outcomes.",
  },
  {
    icon: Code,
    title: "GitHub Repo Scanner",
    desc: "Scan any public repo to extract commit activity, PR health, contributor stats, and more.",
  },
];

const ProjectSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0: choose mode, 1: details, 2: feature intro
  const [mode, setMode] = useState<Mode>(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [project, setProject] = useState<ManualProject>({
    name: "",
    description: "",
    totalBudget: 50000,
    totalScheduleWeeks: 12,
    currentWeek: 1,
    teamMembers: [{ name: "", role: "" }],
  });

  const canProceedStep0 = mode !== null;
  const canProceedStep1 = mode === "github"
    ? githubUrl.includes("github.com")
    : project.name.trim().length > 0 && project.teamMembers.some(m => m.name.trim());

  const handleFinish = () => {
    // Save to local storage for ProjectsManager
    const existing = localStorage.getItem("trackware_projects");
    const projects = existing ? JSON.parse(existing) : [];
    
    const newProject = {
      id: Date.now().toString(),
      title: mode === "github" ? (githubUrl.split("/").pop() || "GitHub Project") : project.name,
      type: mode,
      description: mode === "github" ? `GitHub Repository: ${githubUrl}` : project.description,
      lastUpdated: new Date().toISOString(),
      status: "active"
    };
    
    localStorage.setItem("trackware_projects", JSON.stringify([...projects, newProject]));

    if (mode === "github") {
      navigate("/dashboard/github", { state: { githubUrl } });
    } else {
      navigate("/dashboard/spm", { state: { project } });
    }
  };

  const addTeamMember = () => {
    setProject(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, { name: "", role: "" }],
    }));
  };

  const removeTeamMember = (index: number) => {
    setProject(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== index),
    }));
  };

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    setProject(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.map((m, i) => i === index ? { ...m, [field]: value } : m),
    }));
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh" />
      <div className="absolute inset-0 dot-grid opacity-10" />

      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-lime-sm">
            <Activity className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-primary">trackware</span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-10 max-w-md mx-auto">
          {[0, 1, 2].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                s <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {s < step ? <CheckCircle className="w-4 h-4" /> : s + 1}
              </div>
              {s < 2 && (
                <div className={`flex-1 h-0.5 rounded-full transition-all ${
                  s < step ? "bg-primary" : "bg-muted"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0: Choose Mode */}
        {step === 0 && (
          <div className="max-w-2xl mx-auto animate-fade-up">
            <div className="text-center mb-10">
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">
                How do you want to track?
              </h1>
              <p className="text-muted-foreground">
                Scan a GitHub repo for instant metrics, or set up a manual project with budgets and teams.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setMode("github")}
                className={`glass-card p-6 text-left transition-all hover:border-primary/40 ${
                  mode === "github" ? "border-primary/60 bg-primary/5" : ""
                }`}
              >
                <GitBranch className={`w-8 h-8 mb-3 ${mode === "github" ? "text-primary" : "text-muted-foreground"}`} />
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">GitHub Repo Scan</h3>
                <p className="text-sm text-muted-foreground">
                  Paste a public repo URL and get instant metrics — commits, PRs, health score, contributors.
                </p>
              </button>

              <button
                onClick={() => setMode("manual")}
                className={`glass-card p-6 text-left transition-all hover:border-primary/40 ${
                  mode === "manual" ? "border-primary/60 bg-primary/5" : ""
                }`}
              >
                <PenTool className={`w-8 h-8 mb-3 ${mode === "manual" ? "text-primary" : "text-muted-foreground"}`} />
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">Manual Project Setup</h3>
                <p className="text-sm text-muted-foreground">
                  Enter project budget, schedule, and team — track earned value, costs, and health manually.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Details */}
        {step === 1 && mode === "github" && (
          <div className="max-w-xl mx-auto animate-fade-up">
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">Enter Repository URL</h1>
              <p className="text-muted-foreground text-sm">Paste a public GitHub repository URL to scan.</p>
            </div>
            <div className="glass-card p-6">
              <label className="text-sm font-medium text-foreground mb-2 block">GitHub URL</label>
              <input
                type="url"
                placeholder="https://github.com/owner/repo"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <p className="text-xs text-muted-foreground mt-2">Only public repositories are supported.</p>
            </div>
          </div>
        )}

        {step === 1 && mode === "manual" && (
          <div className="max-w-2xl mx-auto animate-fade-up">
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">Project Details</h1>
              <p className="text-muted-foreground text-sm">Set up your project parameters and team.</p>
            </div>

            <div className="space-y-6">
              {/* Project Info */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-sm font-medium text-foreground">Project Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Project Name *</label>
                    <input
                      value={project.name}
                      onChange={(e) => setProject(p => ({ ...p, name: e.target.value }))}
                      placeholder="My Project"
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                    <input
                      value={project.description}
                      onChange={(e) => setProject(p => ({ ...p, description: e.target.value }))}
                      placeholder="Brief description"
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Total Budget ($)</label>
                    <input
                      type="number"
                      value={project.totalBudget || ""}
                      onChange={(e) => setProject(p => ({ ...p, totalBudget: Number(e.target.value) }))}
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Schedule (weeks)</label>
                    <input
                      type="number"
                      value={project.totalScheduleWeeks || ""}
                      onChange={(e) => setProject(p => ({ ...p, totalScheduleWeeks: Number(e.target.value) }))}
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Current Week</label>
                    <input
                      type="number"
                      value={project.currentWeek || ""}
                      onChange={(e) => setProject(p => ({ ...p, currentWeek: Number(e.target.value) }))}
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              </div>

              {/* Team Members */}
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">Team Members</h3>
                  <button onClick={addTeamMember} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Member
                  </button>
                </div>
                <div className="space-y-3">
                  {project.teamMembers.map((member, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <input
                        value={member.name}
                        onChange={(e) => updateTeamMember(i, "name", e.target.value)}
                        placeholder="Name"
                        className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <input
                        value={member.role}
                        onChange={(e) => updateTeamMember(i, "role", e.target.value)}
                        placeholder="Role (e.g. Lead, Backend)"
                        className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      {project.teamMembers.length > 1 && (
                        <button onClick={() => removeTeamMember(i)} className="text-muted-foreground hover:text-destructive p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Feature Introduction */}
        {step === 2 && (
          <div className="max-w-3xl mx-auto animate-fade-up">
            <div className="text-center mb-10">
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">
                Here's what you'll get
              </h1>
              <p className="text-muted-foreground">
                {mode === "github"
                  ? "Your repo will be scanned for these insights."
                  : "Your project dashboard will include all these tools."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f) => (
                <div key={f.title} className="glass-card p-5 hover:border-primary/30 transition-all">
                  <f.icon className="w-6 h-6 text-primary mb-3" />
                  <h3 className="font-display text-sm font-semibold text-foreground mb-1">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">All metrics update in real-time</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="max-w-2xl mx-auto mt-10 flex items-center justify-between">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : navigate("/")}
            className="inline-flex items-center gap-2 px-6 py-3 glass-card-hover text-foreground font-medium text-sm rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 0 ? "Home" : "Back"}
          </button>

          {step < 2 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 0 ? !canProceedStep0 : !canProceedStep1}
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-semibold text-sm rounded-xl hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed glow-lime-sm"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-semibold text-sm rounded-xl hover:brightness-110 transition-all glow-lime"
            >
              Launch Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectSetup;
