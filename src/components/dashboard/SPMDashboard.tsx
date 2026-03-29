import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  TrendingUp, TrendingDown, DollarSign, Calendar, Users, Activity,
  AlertTriangle, CheckCircle, Info, Clock, BarChart3, RefreshCw, Layers, ArrowLeft,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar,
} from "recharts";

const jitter = (base: number, pct = 0.05) =>
  +(base * (1 + (Math.random() - 0.5) * 2 * pct)).toFixed(2);
const jitterInt = (base: number, pct = 0.05) =>
  Math.round(base * (1 + (Math.random() - 0.5) * 2 * pct));

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "hsl(240, 8%, 10%)",
  border: "1px solid hsl(240, 6%, 22%)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "hsl(0, 0%, 95%)",
};

const MetricCard = ({ label, value, icon: Icon, sub, trend }: {
  label: string; value: string | number; icon: React.ElementType; sub?: string;
  trend?: "up" | "down";
}) => (
  <div className="glass-card p-4 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      {trend === "up" && <TrendingUp className="w-4 h-4 text-health-green" />}
      {trend === "down" && <TrendingDown className="w-4 h-4 text-health-red" />}
    </div>
    <div className="font-display text-2xl font-bold text-foreground">{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
    {sub && <div className="text-[10px] text-muted-foreground/70">{sub}</div>}
  </div>
);

const SPMDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const passedProject = (location.state as any)?.project;

  const [project] = useState(() => ({
    name: passedProject?.name || passedProject?.title || "My Project",
    description: passedProject?.description || "",
    totalBudget: passedProject?.totalBudget || 120000,
    totalScheduleWeeks: passedProject?.totalScheduleWeeks || 24,
    currentWeek: passedProject?.currentWeek || 14,
    teamSize: passedProject?.teamMembers?.length || 5,
    actualCostSpent: passedProject?.actualCostSpent ?? null,
    percentComplete: passedProject?.percentComplete ?? null,
    extraBudgetRequested: passedProject?.extraBudgetRequested ?? 0,
  }));

  const teamMembers = passedProject?.teamMembers?.filter((m: any) => m.name?.trim()) || [];

  // Core EV metrics — use real values if provided, else estimate
  const [ev, setEv] = useState(() => {
    const progress = project.currentWeek / project.totalScheduleWeeks;
    const pv = Math.round(project.totalBudget * progress);
    // If user entered % complete, use it to calculate EV; else estimate at 90% of PV
    const pctDone = project.percentComplete !== null ? project.percentComplete / 100 : progress * 0.9;
    const evVal = Math.round(project.totalBudget * pctDone);
    // Use actual cost if provided, else estimate at 97% of PV
    const ac = project.actualCostSpent !== null ? project.actualCostSpent : Math.round(pv * 0.97);
    return {
      pv, ev: evVal, ac,
      spi: pv > 0 ? +(evVal / pv).toFixed(2) : 1,
      cpi: ac > 0 ? +(evVal / ac).toFixed(2) : 1,
      scheduleVariance: evVal - pv,
      costVariance: evVal - ac,
    };
  });

  // Health scores
  const [health, setHealth] = useState({
    schedule: 72, cost: 78, quality: 85, productivity: 68, risk: 60, overall: 73,
  });

  // Weekly trend
  const [trend] = useState(() => {
    const weeks: any[] = [];
    for (let i = 0; i < Math.min(project.currentWeek, 7); i++) {
      const wk = project.currentWeek - 6 + i;
      if (wk < 1) continue;
      const progress = wk / project.totalScheduleWeeks;
      const pvW = Math.round(project.totalBudget * progress);
      weeks.push({
        week: `W${wk}`,
        pv: pvW,
        ev: Math.round(pvW * (0.85 + Math.random() * 0.1)),
        ac: Math.round(pvW * (0.9 + Math.random() * 0.12)),
      });
    }
    return weeks;
  });

  // Team workload
  const [teamData] = useState(() =>
    teamMembers.map((m: any) => ({
      ...m,
      weeklyHours: Array.from({ length: 7 }, () => Math.floor(Math.random() * 6) + 4),
      avgHours: +(Math.random() * 4 + 5).toFixed(1),
    }))
  );

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const refreshNow = useCallback(() => {
    setEv(prev => ({
      pv: jitterInt(prev.pv, 0.02),
      ev: jitterInt(prev.ev, 0.03),
      ac: jitterInt(prev.ac, 0.03),
      spi: jitter(prev.spi, 0.04),
      cpi: jitter(prev.cpi, 0.04),
      scheduleVariance: jitterInt(prev.scheduleVariance, 0.1),
      costVariance: jitterInt(prev.costVariance, 0.1),
    }));
    setHealth(prev => {
      const s = {
        schedule: Math.min(100, Math.max(0, jitterInt(prev.schedule, 0.06))),
        cost: Math.min(100, Math.max(0, jitterInt(prev.cost, 0.06))),
        quality: Math.min(100, Math.max(0, jitterInt(prev.quality, 0.04))),
        productivity: Math.min(100, Math.max(0, jitterInt(prev.productivity, 0.08))),
        risk: Math.min(100, Math.max(0, jitterInt(prev.risk, 0.08))),
        overall: 0,
      };
      s.overall = Math.round((s.schedule + s.cost + s.quality + s.productivity + s.risk) / 5);
      return s;
    });
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(refreshNow, 5000);
    return () => clearInterval(id);
  }, [autoRefresh, refreshNow]);

  // Alerts
  const alerts = [];
  if (ev.spi < 0.95) alerts.push({ type: ev.spi < 0.85 ? "critical" : "warning", title: "SPI Below Threshold", desc: `SPI is ${ev.spi.toFixed(2)}` });
  if (ev.cpi < 0.95) alerts.push({ type: ev.cpi < 0.85 ? "critical" : "warning", title: "CPI Below Threshold", desc: `CPI is ${ev.cpi.toFixed(2)}` });
  if (ev.costVariance < -5000) alerts.push({ type: "warning", title: "Cost Overrun", desc: `CV is $${ev.costVariance.toLocaleString()}` });
  if (health.schedule < 60) alerts.push({ type: "critical", title: "Schedule Health Critical", desc: `Score: ${health.schedule}/100` });
  if (ev.spi >= 1.0 && ev.cpi >= 1.0) alerts.push({ type: "info", title: "Project On Track", desc: `SPI ${ev.spi.toFixed(2)} / CPI ${ev.cpi.toFixed(2)}` });

  const overloaded = teamData.filter((m: any) => m.avgHours >= 9);
  if (overloaded.length > 0) alerts.push({ type: "critical", title: "Team Overload", desc: `${overloaded.map((m: any) => m.name).join(", ")}` });

  const radarData = [
    { axis: "Schedule", value: health.schedule },
    { axis: "Cost", value: health.cost },
    { axis: "Quality", value: health.quality },
    { axis: "Productivity", value: health.productivity },
    { axis: "Risk", value: health.risk },
  ];

  const circumference = 2 * Math.PI * 80;
  const progress = (health.overall / 100) * circumference;
  const healthColor = health.overall >= 75 ? "text-health-green" : health.overall >= 50 ? "text-health-amber" : "text-health-red";
  const healthStroke = health.overall >= 75 ? "hsl(142, 71%, 45%)" : health.overall >= 50 ? "hsl(38, 92%, 50%)" : "hsl(0, 72%, 51%)";

  const budgetUsed = ev.ac;
  const budgetPct = Math.round((budgetUsed / project.totalBudget) * 100);
  const schedulePct = Math.round((project.currentWeek / project.totalScheduleWeeks) * 100);

  return (
    <div className="space-y-6">
      {/* Back to Projects */}
      <button
        onClick={() => navigate("/dashboard/projects")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <Layers className="w-3.5 h-3.5" />
        Back to Projects
      </button>

      {/* Project Header */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">{project.name}</h2>
            {project.description && <p className="text-sm text-muted-foreground mt-1">{project.description}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg transition-all ${autoRefresh ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? "animate-spin" : ""}`} style={autoRefresh ? { animationDuration: "3s" } : {}} />
            </button>
            <span className="text-[10px] text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Budget: ${project.totalBudget.toLocaleString()}</span>
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Week {project.currentWeek} / {project.totalScheduleWeeks}</span>
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {project.teamSize} members</span>
        </div>
      </div>

      {/* Budget + Schedule Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Budget Used</span>
            <span className="text-sm font-bold text-foreground">${budgetUsed.toLocaleString()} / ${project.totalBudget.toLocaleString()}</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${budgetPct > 100 ? "bg-health-red" : budgetPct > 80 ? "bg-health-amber" : "bg-primary"}`}
              style={{ width: `${Math.min(100, budgetPct)}%` }} />
          </div>
          <div className="text-xs text-muted-foreground mt-1">{budgetPct}% consumed</div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Schedule Progress</span>
            <span className="text-sm font-bold text-foreground">Week {project.currentWeek} of {project.totalScheduleWeeks}</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, schedulePct)}%` }} />
          </div>
          <div className="text-xs text-muted-foreground mt-1">{schedulePct}% elapsed</div>
        </div>
      </div>

      {/* Earned Value Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Planned Value" value={`$${ev.pv.toLocaleString()}`} icon={BarChart3} />
        <MetricCard label="Earned Value" value={`$${ev.ev.toLocaleString()}`} icon={Activity}
          trend={ev.ev >= ev.pv ? "up" : "down"} />
        <MetricCard label="Actual Cost" value={`$${ev.ac.toLocaleString()}`} icon={DollarSign}
          trend={ev.ac <= ev.ev ? "up" : "down"} />
        <MetricCard label="SPI / CPI" value={`${ev.spi} / ${ev.cpi}`} icon={TrendingUp}
          sub={`SV: $${ev.scheduleVariance.toLocaleString()} · CV: $${ev.costVariance.toLocaleString()}`}
          trend={ev.spi >= 1 && ev.cpi >= 1 ? "up" : "down"} />
      </div>

      {/* Health Ring + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 flex flex-col items-center justify-center">
          <h3 className="text-sm font-medium text-muted-foreground mb-4 self-start">Overall Health Score</h3>
          <div className="relative w-48 h-48">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
              <circle cx="90" cy="90" r="80" fill="none" stroke="hsl(240, 6%, 18%)" strokeWidth="8" />
              <circle cx="90" cy="90" r="80" fill="none" stroke={healthStroke} strokeWidth="8"
                strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - progress}
                className="transition-all duration-1000 ease-out"
                style={{ filter: `drop-shadow(0 0 8px ${healthStroke})` }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-4xl font-bold text-foreground">{health.overall}</span>
              <span className={`text-sm font-medium ${healthColor}`}>
                {health.overall >= 75 ? "Healthy" : health.overall >= 50 ? "Attention" : "At Risk"}
              </span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Health Radar</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="hsl(240, 6%, 22%)" />
              <PolarAngleAxis dataKey="axis" tick={{ fill: "hsl(240, 4%, 55%)", fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Health" dataKey="value" stroke="hsl(72, 95%, 55%)" fill="hsl(72, 95%, 55%)"
                fillOpacity={0.15} strokeWidth={2} animationDuration={800} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* EV Trend Chart */}
      {trend.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Earned Value Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 6%, 16%)" />
              <XAxis dataKey="week" tick={{ fill: "hsl(240, 4%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(240, 4%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: number) => [`$${v.toLocaleString()}`]} />
              <Line type="monotone" dataKey="pv" stroke="hsl(240, 4%, 55%)" strokeWidth={2} dot={false} name="Planned" />
              <Line type="monotone" dataKey="ev" stroke="hsl(72, 95%, 55%)" strokeWidth={2} dot={false} name="Earned" />
              <Line type="monotone" dataKey="ac" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={false} name="Actual" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-3">
            <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-muted-foreground rounded" /> <span className="text-xs text-muted-foreground">PV</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-primary rounded" /> <span className="text-xs text-muted-foreground">EV</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-health-amber rounded" /> <span className="text-xs text-muted-foreground">AC</span></div>
          </div>
        </div>
      )}

      {/* Smart Alerts */}
      {alerts.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Smart Alerts</h3>
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${
                a.type === "critical" ? "bg-health-red/10 border border-health-red/20" :
                a.type === "warning" ? "bg-health-amber/10 border border-health-amber/20" :
                "bg-primary/5 border border-primary/20"
              }`}>
                {a.type === "critical" ? <AlertTriangle className="w-4 h-4 text-health-red mt-0.5 shrink-0" /> :
                 a.type === "warning" ? <AlertTriangle className="w-4 h-4 text-health-amber mt-0.5 shrink-0" /> :
                 <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />}
                <div>
                  <div className="text-sm font-medium text-foreground">{a.title}</div>
                  <div className="text-xs text-muted-foreground">{a.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Workload */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Team Capacity
        </h3>
        <div className="space-y-3">
          {teamData.map((m: any, i: number) => {
            const loadPct = Math.min(100, Math.round((m.avgHours / 10) * 100));
            return (
              <div key={i} className="flex items-center gap-4 py-2 px-3 rounded-lg bg-secondary/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {m.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{m.name}</span>
                    <span className="text-xs text-muted-foreground">{m.role || "Member"}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${
                        loadPct >= 90 ? "bg-health-red" : loadPct >= 70 ? "bg-health-amber" : "bg-primary"
                      }`} style={{ width: `${loadPct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums w-16 text-right">{m.avgHours}h/day</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Workload Heatmap */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Weekly Workload Heatmap</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left text-muted-foreground py-2 px-2 font-medium">Member</th>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                  <th key={d} className="text-center text-muted-foreground py-2 px-2 font-medium">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teamData.map((m: any, i: number) => (
                <tr key={i}>
                  <td className="py-1.5 px-2 text-foreground font-medium">{m.name}</td>
                  {m.weeklyHours.map((h: number, j: number) => {
                    const intensity = Math.min(1, h / 10);
                    return (
                      <td key={j} className="py-1.5 px-2 text-center">
                        <div className="w-8 h-8 mx-auto rounded flex items-center justify-center text-[10px] font-bold"
                          style={{
                            backgroundColor: `hsl(72, 95%, 55%, ${intensity * 0.4})`,
                            color: intensity > 0.5 ? "hsl(0, 0%, 95%)" : "hsl(240, 4%, 55%)",
                          }}>
                          {h}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SPMDashboard;
