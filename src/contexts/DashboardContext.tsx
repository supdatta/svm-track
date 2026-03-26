import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  mockEarnedValue,
  mockHealthScores,
  mockTeamMembers,
  mockWeeklyTrend,
  mockProject,
  mockProductivity,
} from "@/data/mockData";

const jitter = (base: number, pct = 0.05) =>
  +(base * (1 + (Math.random() - 0.5) * 2 * pct)).toFixed(2);

const jitterInt = (base: number, pct = 0.05) =>
  Math.round(base * (1 + (Math.random() - 0.5) * 2 * pct));

export type TimeRange = "1w" | "2w" | "4w" | "7w" | "12w";

export interface ProjectData {
  name: string;
  workspace: string;
  totalBudget: number;
  totalScheduleWeeks: number;
  currentWeek: number;
  teamSize: number;
}

export interface EarnedValueData {
  pv: number; ev: number; ac: number;
  spi: number; cpi: number;
  scheduleVariance: number; costVariance: number;
}

export interface HealthData {
  schedule: number; cost: number; quality: number;
  productivity: number; risk: number; overall: number;
}

export interface TeamMember {
  name: string; role: string;
  weeklyHours: number[]; avgHours: number;
}

export interface Alert {
  id: number; type: "warning" | "critical" | "info";
  title: string; description: string;
  cause: string; action: string;
}

export interface TrendPoint {
  week: string; pv: number; ev: number; ac: number;
}

export interface ProductivityPoint {
  week: string; tasksPerHour: number; locPerHour: number;
}

interface DashboardState {
  ev: EarnedValueData;
  health: HealthData;
  team: TeamMember[];
  alerts: Alert[];
  dismissedAlertIds: Set<number>;
  trend: TrendPoint[];
  productivity: ProductivityPoint[];
  project: ProjectData;
  timeRange: TimeRange;
  autoRefresh: boolean;
  refreshInterval: number;
  lastUpdated: Date;
}

interface DashboardActions {
  setTimeRange: (r: TimeRange) => void;
  dismissAlert: (id: number) => void;
  restoreAlerts: () => void;
  setAutoRefresh: (v: boolean) => void;
  setRefreshInterval: (v: number) => void;
  refreshNow: () => void;
  // Mutation actions
  updateProject: (p: Partial<ProjectData>) => void;
  updateEV: (e: Partial<EarnedValueData>) => void;
  updateHealth: (h: Partial<HealthData>) => void;
  addTeamMember: (m: TeamMember) => void;
  updateTeamMember: (index: number, m: Partial<TeamMember>) => void;
  removeTeamMember: (index: number) => void;
  addAlert: (a: Omit<Alert, "id">) => void;
  updateAlert: (id: number, a: Partial<Alert>) => void;
  removeAlert: (id: number) => void;
  addTrendPoint: (t: TrendPoint) => void;
  addProductivityPoint: (p: ProductivityPoint) => void;
}

export type DashboardContextType = DashboardState & DashboardActions;

const DashboardContext = createContext<DashboardContextType | null>(null);

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
};

export const DashboardProvider = ({ children }: { children: React.ReactNode }) => {
  const [project, setProject] = useState<ProjectData>(mockProject);
  const [ev, setEv] = useState<EarnedValueData>(mockEarnedValue);
  const [health, setHealth] = useState<HealthData>(mockHealthScores);
  const [team, setTeam] = useState<TeamMember[]>(mockTeamMembers);
  const [customAlerts, setCustomAlerts] = useState<Alert[]>([]);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<number>>(new Set());
  const [trend, setTrend] = useState<TrendPoint[]>(mockWeeklyTrend);
  const [productivity, setProductivity] = useState<ProductivityPoint[]>(mockProductivity);
  const [timeRange, setTimeRange] = useState<TimeRange>("7w");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [nextAlertId, setNextAlertId] = useState(100);

  const generateTrend = useCallback((range: TimeRange) => {
    const weeks: Record<TimeRange, number> = { "1w": 1, "2w": 2, "4w": 4, "7w": 7, "12w": 12 };
    const count = weeks[range];
    const base = trend.slice(-Math.min(count, trend.length));
    const result: TrendPoint[] = [];
    for (let i = 0; i < count; i++) {
      const src = base[i % base.length];
      result.push({
        week: `W${8 + i}`,
        pv: jitterInt(src.pv + i * 2000, 0.03),
        ev: jitterInt(src.ev + i * 1500, 0.04),
        ac: jitterInt(src.ac + i * 1800, 0.04),
      });
    }
    return result;
  }, [trend]);

  const generateProductivity = useCallback((range: TimeRange) => {
    const weeks: Record<TimeRange, number> = { "1w": 1, "2w": 2, "4w": 4, "7w": 7, "12w": 12 };
    const count = weeks[range];
    const base = productivity.slice(-Math.min(count, productivity.length));
    const result: ProductivityPoint[] = [];
    for (let i = 0; i < count; i++) {
      const src = base[i % base.length];
      result.push({
        week: `W${8 + i}`,
        tasksPerHour: jitter(src.tasksPerHour, 0.06),
        locPerHour: jitterInt(src.locPerHour, 0.08),
      });
    }
    return result;
  }, [productivity]);

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

    setTeam(prev =>
      prev.map((m) => ({
        ...m,
        weeklyHours: m.weeklyHours.map((h) => Math.min(24, Math.max(0, jitterInt(h, 0.08)))),
        avgHours: Math.min(24, jitter(m.avgHours, 0.06)),
      }))
    );

    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(refreshNow, refreshInterval * 1000);
    return () => clearInterval(id);
  }, [autoRefresh, refreshInterval, refreshNow]);

  useEffect(() => {
    setTrend(generateTrend(timeRange));
    setProductivity(generateProductivity(timeRange));
  }, [timeRange]);

  // Generate condition-based alerts from actual data
  const generatedAlerts: Alert[] = (() => {
    const a: Alert[] = [];
    let id = -1;
    if (ev.spi < 0.95) {
      a.push({ id: id--, type: ev.spi < 0.85 ? "critical" : "warning", title: "SPI Below Threshold",
        description: `Schedule Performance Index is ${ev.spi.toFixed(2)}, below the 0.95 threshold.`,
        cause: "Earned value is lagging behind planned value", action: "Re-prioritize backlog and defer non-critical items." });
    }
    if (ev.cpi < 0.95) {
      a.push({ id: id--, type: ev.cpi < 0.85 ? "critical" : "warning", title: "CPI Below Threshold",
        description: `Cost Performance Index is ${ev.cpi.toFixed(2)}, below the 0.95 threshold.`,
        cause: "Actual costs exceeding earned value", action: "Review spending and identify cost overruns." });
    }
    if (ev.costVariance < -5000) {
      a.push({ id: id--, type: "warning", title: "Cost Overrun",
        description: `Cost variance is $${ev.costVariance.toLocaleString()}.`,
        cause: "Actual cost exceeds earned value significantly", action: "Audit recent expenditures and adjust forecasts." });
    }
    if (health.schedule < 60) {
      a.push({ id: id--, type: "critical", title: "Schedule Health Critical",
        description: `Schedule health score is ${health.schedule}/100.`,
        cause: "Delivery timeline at risk", action: "Assess blockers and consider scope reduction." });
    }
    if (health.risk < 50) {
      a.push({ id: id--, type: "critical", title: "High Risk Score",
        description: `Risk health score is ${health.risk}/100.`,
        cause: "Multiple risk factors detected", action: "Conduct risk review and implement mitigations." });
    }
    const overloaded = team.filter(m => m.avgHours >= 10);
    if (overloaded.length > 0) {
      a.push({ id: id--, type: "critical", title: "Developer Overload Detected",
        description: `${overloaded.map(m => m.name).join(", ")} averaging 10+ hrs/day.`,
        cause: "Work concentrated on few team members", action: "Redistribute tasks or bring in additional support." });
    }
    if (health.quality >= 85) {
      a.push({ id: id--, type: "info", title: "Quality Health Strong",
        description: `Quality score is ${health.quality}/100 — above target.`,
        cause: "Good engineering practices in place", action: "Continue current quality practices." });
    }
    if (ev.spi >= 1.0 && ev.cpi >= 1.0) {
      a.push({ id: id--, type: "info", title: "Project On Track",
        description: `SPI ${ev.spi.toFixed(2)} and CPI ${ev.cpi.toFixed(2)} — both above 1.0.`,
        cause: "Delivery and cost within plan", action: "Maintain current pace." });
    }
    return a;
  })();

  const alerts = [...generatedAlerts, ...customAlerts];

  const dismissAlert = (id: number) => setDismissedAlertIds(prev => new Set(prev).add(id));
  const restoreAlerts = () => setDismissedAlertIds(new Set());

  // Mutation functions
  const updateProject = (p: Partial<ProjectData>) => {
    setProject(prev => ({ ...prev, ...p }));
    setLastUpdated(new Date());
  };

  const updateEV = (e: Partial<EarnedValueData>) => {
    setEv(prev => {
      const next = { ...prev, ...e };
      // Auto-calculate derived values
      if (next.pv > 0) next.spi = +(next.ev / next.pv).toFixed(2);
      if (next.ac > 0) next.cpi = +(next.ev / next.ac).toFixed(2);
      next.scheduleVariance = next.ev - next.pv;
      next.costVariance = next.ev - next.ac;
      return next;
    });
    setLastUpdated(new Date());
  };

  const updateHealth = (h: Partial<HealthData>) => {
    setHealth(prev => {
      const next = { ...prev, ...h };
      next.overall = Math.round((next.schedule + next.cost + next.quality + next.productivity + next.risk) / 5);
      return next;
    });
    setLastUpdated(new Date());
  };

  const addTeamMember = (m: TeamMember) => {
    setTeam(prev => [...prev, m]);
    setProject(prev => ({ ...prev, teamSize: prev.teamSize + 1 }));
    setLastUpdated(new Date());
  };

  const updateTeamMember = (index: number, m: Partial<TeamMember>) => {
    setTeam(prev => prev.map((t, i) => i === index ? { ...t, ...m } : t));
    setLastUpdated(new Date());
  };

  const removeTeamMember = (index: number) => {
    setTeam(prev => prev.filter((_, i) => i !== index));
    setProject(prev => ({ ...prev, teamSize: Math.max(0, prev.teamSize - 1) }));
    setLastUpdated(new Date());
  };

  const addAlert = (a: Omit<Alert, "id">) => {
    const id = nextAlertId;
    setNextAlertId(prev => prev + 1);
    setCustomAlerts(prev => [...prev, { ...a, id }]);
    setLastUpdated(new Date());
  };

  const updateAlert = (id: number, a: Partial<Alert>) => {
    setCustomAlerts(prev => prev.map(al => al.id === id ? { ...al, ...a } : al));
    setLastUpdated(new Date());
  };

  const removeAlert = (id: number) => {
    setCustomAlerts(prev => prev.filter(a => a.id !== id));
    setLastUpdated(new Date());
  };

  const addTrendPoint = (t: TrendPoint) => {
    setTrend(prev => [...prev, t]);
    setLastUpdated(new Date());
  };

  const addProductivityPoint = (p: ProductivityPoint) => {
    setProductivity(prev => [...prev, p]);
    setLastUpdated(new Date());
  };

  return (
    <DashboardContext.Provider value={{
      ev, health, team, alerts, dismissedAlertIds, trend, productivity,
      project, timeRange, autoRefresh, refreshInterval, lastUpdated,
      setTimeRange, dismissAlert, restoreAlerts,
      setAutoRefresh, setRefreshInterval, refreshNow,
      updateProject, updateEV, updateHealth,
      addTeamMember, updateTeamMember, removeTeamMember,
      addAlert, updateAlert, removeAlert,
      addTrendPoint, addProductivityPoint,
    }}>
      {children}
    </DashboardContext.Provider>
  );
};
