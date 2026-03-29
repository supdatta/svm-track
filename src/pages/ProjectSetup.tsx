import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, ArrowLeft, GitBranch, PenTool, Users, Plus, Trash2,
  Activity, BarChart3, Shield, Zap, Sparkles, CheckCircle, Code, Wand2, Loader2,
  DollarSign, Clock, TrendingUp,
} from "lucide-react";

type Mode = "github" | "manual" | null;

interface TeamMember {
  name: string;
  role: string;
  hoursPerWeek: number;
  hoursWorkedTotal: number;
  aiReasoning?: string;
}

interface ManualProject {
  name: string;
  description: string;
  totalBudget: number;
  actualCostSpent: number;
  extraBudgetRequested: number;
  totalScheduleWeeks: number;
  currentWeek: number;
  percentComplete: number;
  teamMembers: TeamMember[];
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const FEATURES = [
  { icon: BarChart3, title: "Earned Value Metrics", desc: "Track PV, EV, AC, SPI, CPI — understand cost and schedule performance at a glance." },
  { icon: Shield, title: "5-Axis Health Radar", desc: "Monitor schedule, cost, quality, productivity, and risk health scores in real-time." },
  { icon: Zap, title: "Smart Alerts", desc: "Automatic alerts when metrics cross thresholds — SPI drops, cost overruns, team overload." },
  { icon: Users, title: "Team Capacity Tracking", desc: "Visualize workload distribution with heatmaps and capacity tables per team member." },
  { icon: Activity, title: "Trend Analysis", desc: "Weekly EV trends and productivity charts to spot patterns and forecast outcomes." },
  { icon: Code, title: "GitHub Repo Scanner", desc: "Scan any public repo to extract commit activity, PR health, contributor stats, and more." },
];

const inputCls = "w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";
const labelCls = "text-xs text-muted-foreground mb-1 block font-medium";

const ProjectSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<Mode>(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [project, setProject] = useState<ManualProject>({
    name: "",
    description: "",
    totalBudget: 50000,
    actualCostSpent: 0,
    extraBudgetRequested: 0,
    totalScheduleWeeks: 12,
    currentWeek: 1,
    percentComplete: 0,
    teamMembers: [{ name: "", role: "", hoursPerWeek: 40, hoursWorkedTotal: 0 }],
  });
  const [aiLoading, setAiLoading] = useState<Record<number, boolean>>({});
  const [aiError, setAiError] = useState<Record<number, string>>({});

  const canProceedStep0 = mode !== null;
  const canProceedStep1 = mode === "github"
    ? githubUrl.includes("github.com")
    : project.name.trim().length > 0 && project.teamMembers.some(m => m.name.trim());

  const suggestHours = async (index: number) => {
    const member = project.teamMembers[index];
    if (!member.role.trim()) {
      setAiError(prev => ({ ...prev, [index]: "Please enter a role first." }));
      return;
    }
    setAiLoading(prev => ({ ...prev, [index]: true }));
    setAiError(prev => ({ ...prev, [index]: "" }));
    const otherRoles = project.teamMembers.filter((_, i) => i !== index).map(m => m.role).filter(r => r.trim()).join(", ") || "none";
    const prompt = `You are a project management expert. Given the following project context, suggest the appropriate weekly working hours for a team member based on their role and the cost/schedule constraints.

Project Name: ${project.name || "Untitled"}
Total Budget: $${project.totalBudget.toLocaleString()}
Schedule Duration: ${project.totalScheduleWeeks} weeks
Current Week: ${project.currentWeek} of ${project.totalScheduleWeeks}
Other Team Members' Roles: ${otherRoles}
Total Team Size: ${project.teamMembers.length}
Team Member Role: "${member.role}"

Consider:
- The role's typical workload and responsibilities
- The project budget (divide budget across team size and weeks)
- Whether this role is typically part-time or full-time in this context
- Industry standard hours for this role type

Respond with ONLY valid JSON in this exact format (no markdown, no explanation outside JSON):
{"hoursPerWeek": <number between 1 and 60>, "reasoning": "<one sentence explanation>"}`;
    try {
      const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 200 } }),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not parse AI response");
      const parsed = JSON.parse(jsonMatch[0]);
      const hours = Math.min(60, Math.max(1, Math.round(Number(parsed.hoursPerWeek))));
      setProject(prev => ({
        ...prev,
        teamMembers: prev.teamMembers.map((m, i) => i === index ? { ...m, hoursPerWeek: hours, aiReasoning: parsed.reasoning } : m),
      }));
    } catch {
      setAiError(prev => ({ ...prev, [index]: "Failed to get suggestion. You can set hours manually." }));
    } finally {
      setAiLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleFinish = () => {
    const existing = localStorage.getItem("trackware_projects");
    const projects = existing ? JSON.parse(existing) : [];

    const newProject = {
      id: Date.now().toString(),
      title: mode === "github" ? (githubUrl.split("/").pop() || "GitHub Project") : project.name,
      type: mode,
      description: mode === "github" ? `GitHub Repository: ${githubUrl}` : project.description,
      lastUpdated: new Date().toISOString(),
      status: "active",
      // Save ALL project data so cards can display it
      ...(mode === "manual" ? {
        totalBudget: project.totalBudget,
        actualCostSpent: project.actualCostSpent,
        extraBudgetRequested: project.extraBudgetRequested,
        totalScheduleWeeks: project.totalScheduleWeeks,
        currentWeek: project.currentWeek,
        percentComplete: project.percentComplete,
        teamMembers: project.teamMembers,
      } : { githubUrl }),
    };

    localStorage.setItem("trackware_projects", JSON.stringify([...projects, newProject]));
    window.dispatchEvent(new Event("trackware_projects_updated"));

    if (mode === "github") {
      navigate("/dashboard/github", { state: { githubUrl } });
    } else {
      navigate("/dashboard/spm", { state: { project } });
    }
  };

  const addTeamMember = () => {
    setProject(prev => ({ ...prev, teamMembers: [...prev.teamMembers, { name: "", role: "", hoursPerWeek: 40, hoursWorkedTotal: 0 }] }));
  };

  const removeTeamMember = (index: number) => {
    setProject(prev => ({ ...prev, teamMembers: prev.teamMembers.filter((_, i) => i !== index) }));
    setAiLoading(prev => { const n = { ...prev }; delete n[index]; return n; });
    setAiError(prev => { const n = { ...prev }; delete n[index]; return n; });
  };

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string | number) => {
    setProject(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.map((m, i) =>
        i === index ? { ...m, [field]: value, ...(field === "role" ? { aiReasoning: undefined } : {}) } : m
      ),
    }));
    if (field === "role") setAiError(prev => ({ ...prev, [index]: "" }));
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh" />
      <div className="absolute inset-0 dot-grid opacity-10" />

      <div className="relative z-10 container mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-lime-sm">
            <Activity className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-primary">trackware</span>
        </div>

        <div className="flex items-center gap-2 mb-10 max-w-md mx-auto">
          {[0, 1, 2].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${s <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {s < step ? <CheckCircle className="w-4 h-4" /> : s + 1}
              </div>
              {s < 2 && <div className={`flex-1 h-0.5 rounded-full transition-all ${s < step ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {/* Step 0: Choose Mode */}
        {step === 0 && (
          <div className="max-w-2xl mx-auto animate-fade-up">
            <div className="text-center mb-10">
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">How do you want to track?</h1>
              <p className="text-muted-foreground">Scan a GitHub repo for instant metrics, or set up a manual project with budgets and teams.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => setMode("github")} className={`glass-card p-6 text-left transition-all hover:border-primary/40 ${mode === "github" ? "border-primary/60 bg-primary/5" : ""}`}>
                <GitBranch className={`w-8 h-8 mb-3 ${mode === "github" ? "text-primary" : "text-muted-foreground"}`} />
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">GitHub Repo Scan</h3>
                <p className="text-sm text-muted-foreground">Paste a public repo URL and get instant metrics — commits, PRs, health score, contributors.</p>
              </button>
              <button onClick={() => setMode("manual")} className={`glass-card p-6 text-left transition-all hover:border-primary/40 ${mode === "manual" ? "border-primary/60 bg-primary/5" : ""}`}>
                <PenTool className={`w-8 h-8 mb-3 ${mode === "manual" ? "text-primary" : "text-muted-foreground"}`} />
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">Manual Project Setup</h3>
                <p className="text-sm text-muted-foreground">Enter project budget, schedule, and team — track earned value, costs, and health manually.</p>
              </button>
            </div>
          </div>
        )}

        {/* Step 1: GitHub URL */}
        {step === 1 && mode === "github" && (
          <div className="max-w-xl mx-auto animate-fade-up">
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">Enter Repository URL</h1>
              <p className="text-muted-foreground text-sm">Paste a public GitHub repository URL to scan.</p>
            </div>
            <div className="glass-card p-6">
              <label className={labelCls}>GitHub URL</label>
              <input type="url" placeholder="https://github.com/owner/repo" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className={inputCls} />
              <p className="text-xs text-muted-foreground mt-2">Only public repositories are supported.</p>
            </div>
          </div>
        )}

        {/* Step 1: Manual Project */}
        {step === 1 && mode === "manual" && (
          <div className="max-w-2xl mx-auto animate-fade-up space-y-6">
            <div className="text-center mb-2">
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">Project Details</h1>
              <p className="text-muted-foreground text-sm">Tell us about your project — we'll use this to calculate real metrics.</p>
            </div>

            {/* Basic Info */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Project Information</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Project Name *</label>
                  <input value={project.name} onChange={(e) => setProject(p => ({ ...p, name: e.target.value }))} placeholder="My Project" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <input value={project.description} onChange={(e) => setProject(p => ({ ...p, description: e.target.value }))} placeholder="Brief description" className={inputCls} />
                </div>
              </div>
            </div>

            {/* Budget & Cost */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Budget & Cost</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Total Planned Budget ($)</label>
                  <input type="number" min={0} value={project.totalBudget || ""} onChange={(e) => setProject(p => ({ ...p, totalBudget: Number(e.target.value) }))} className={inputCls} />
                  <p className="text-[10px] text-muted-foreground mt-1">Total approved project cost</p>
                </div>
                <div>
                  <label className={labelCls}>Actual Cost Spent So Far ($)</label>
                  <input type="number" min={0} value={project.actualCostSpent || ""} onChange={(e) => setProject(p => ({ ...p, actualCostSpent: Number(e.target.value) }))} placeholder="0" className={inputCls} />
                  <p className="text-[10px] text-muted-foreground mt-1">Real money spent to date</p>
                </div>
                <div>
                  <label className={labelCls}>Extra Budget Requested ($)</label>
                  <input type="number" min={0} value={project.extraBudgetRequested || ""} onChange={(e) => setProject(p => ({ ...p, extraBudgetRequested: Number(e.target.value) }))} placeholder="0" className={inputCls} />
                  <p className="text-[10px] text-muted-foreground mt-1">Any additional budget asked by team</p>
                </div>
              </div>
            </div>

            {/* Schedule & Progress */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Schedule & Progress</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Total Duration (weeks)</label>
                  <input type="number" min={1} value={project.totalScheduleWeeks || ""} onChange={(e) => setProject(p => ({ ...p, totalScheduleWeeks: Number(e.target.value) }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Current Week #</label>
                  <input type="number" min={1} value={project.currentWeek || ""} onChange={(e) => setProject(p => ({ ...p, currentWeek: Number(e.target.value) }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Work Completed (%)</label>
                  <input type="number" min={0} max={100} value={project.percentComplete || ""} onChange={(e) => setProject(p => ({ ...p, percentComplete: Number(e.target.value) }))} placeholder="0" className={inputCls} />
                  <p className="text-[10px] text-muted-foreground mt-1">% of deliverables done</p>
                </div>
              </div>
              {project.totalScheduleWeeks > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Time elapsed</span>
                    <span>{Math.round((project.currentWeek / project.totalScheduleWeeks) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, (project.currentWeek / project.totalScheduleWeeks) * 100)}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Team Members */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Team Members</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Add who's working, their role, weekly hours planned, and total hours worked so far.</p>
                  </div>
                </div>
                <button onClick={addTeamMember} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add Member
                </button>
              </div>

              <div className="space-y-5">
                {project.teamMembers.map((member, i) => (
                  <div key={i} className="space-y-2 p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Member {i + 1}</span>
                      {project.teamMembers.length > 1 && (
                        <button onClick={() => removeTeamMember(i)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelCls}>Name *</label>
                        <input value={member.name} onChange={(e) => updateTeamMember(i, "name", e.target.value)} placeholder="Full name" className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Role</label>
                        <input value={member.role} onChange={(e) => updateTeamMember(i, "role", e.target.value)} placeholder="e.g. Lead Developer" className={inputCls} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 items-end">
                      <div>
                        <label className={labelCls}>Planned hrs/week</label>
                        <div className="flex items-center gap-1">
                          <input type="number" min={1} max={60} value={member.hoursPerWeek} onChange={(e) => updateTeamMember(i, "hoursPerWeek", Number(e.target.value))} className={inputCls} />
                          <button
                            onClick={() => suggestHours(i)}
                            disabled={aiLoading[i] || !member.role.trim()}
                            title="AI: Suggest hours based on role"
                            className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                          >
                            {aiLoading[i] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Total hrs worked so far</label>
                        <input type="number" min={0} value={member.hoursWorkedTotal || ""} onChange={(e) => updateTeamMember(i, "hoursWorkedTotal", Number(e.target.value))} placeholder="0" className={inputCls} />
                      </div>
                    </div>
                    {member.aiReasoning && (
                      <div className="flex items-start gap-1.5 text-xs text-primary/70 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                        <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{member.aiReasoning}</span>
                      </div>
                    )}
                    {aiError[i] && <p className="text-xs text-destructive">{aiError[i]}</p>}
                  </div>
                ))}
              </div>

              {/* Team Summary */}
              {project.teamMembers.some(m => m.name.trim()) && (
                <div className="flex items-center gap-2 pt-1">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    Total capacity: <span className="text-foreground font-medium">{project.teamMembers.reduce((s, m) => s + m.hoursPerWeek, 0)} hrs/week</span>
                    {" · "}
                    Hours worked: <span className="text-foreground font-medium">{project.teamMembers.reduce((s, m) => s + m.hoursWorkedTotal, 0)} hrs total</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Feature Introduction */}
        {step === 2 && (
          <div className="max-w-3xl mx-auto animate-fade-up">
            <div className="text-center mb-10">
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">Here's what you'll get</h1>
              <p className="text-muted-foreground">
                {mode === "github" ? "Your repo will be scanned for these insights." : "Your project dashboard will include all these tools."}
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

        {/* Navigation */}
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
