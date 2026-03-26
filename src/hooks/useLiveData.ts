import { useState, useEffect, useCallback } from "react";
import {
  mockEarnedValue,
  mockHealthScores,
  mockTeamMembers,
  mockAlerts,
  mockWeeklyTrend,
} from "@/data/mockData";

const jitter = (base: number, pct = 0.05) =>
  +(base * (1 + (Math.random() - 0.5) * 2 * pct)).toFixed(2);

const jitterInt = (base: number, pct = 0.05) =>
  Math.round(base * (1 + (Math.random() - 0.5) * 2 * pct));

export type TimeRange = "1w" | "2w" | "4w" | "7w" | "12w";

export const useLiveEarnedValue = () => {
  const [ev, setEv] = useState(mockEarnedValue);

  useEffect(() => {
    const id = setInterval(() => {
      setEv({
        pv: jitterInt(mockEarnedValue.pv, 0.02),
        ev: jitterInt(mockEarnedValue.ev, 0.03),
        ac: jitterInt(mockEarnedValue.ac, 0.03),
        spi: jitter(mockEarnedValue.spi, 0.04),
        cpi: jitter(mockEarnedValue.cpi, 0.04),
        scheduleVariance: jitterInt(mockEarnedValue.scheduleVariance, 0.1),
        costVariance: jitterInt(mockEarnedValue.costVariance, 0.1),
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return ev;
};

export const useLiveHealth = () => {
  const [health, setHealth] = useState(mockHealthScores);

  useEffect(() => {
    const id = setInterval(() => {
      const s = {
        schedule: Math.min(100, Math.max(0, jitterInt(mockHealthScores.schedule, 0.06))),
        cost: Math.min(100, Math.max(0, jitterInt(mockHealthScores.cost, 0.06))),
        quality: Math.min(100, Math.max(0, jitterInt(mockHealthScores.quality, 0.04))),
        productivity: Math.min(100, Math.max(0, jitterInt(mockHealthScores.productivity, 0.08))),
        risk: Math.min(100, Math.max(0, jitterInt(mockHealthScores.risk, 0.08))),
        overall: 0,
      };
      s.overall = Math.round((s.schedule + s.cost + s.quality + s.productivity + s.risk) / 5);
      setHealth(s);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return health;
};

export const useLiveTeam = () => {
  const [team, setTeam] = useState(mockTeamMembers);

  useEffect(() => {
    const id = setInterval(() => {
      setTeam(
        mockTeamMembers.map((m) => ({
          ...m,
          weeklyHours: m.weeklyHours.map((h) => jitterInt(h, 0.08)),
          avgHours: jitter(m.avgHours, 0.06),
        }))
      );
    }, 6000);
    return () => clearInterval(id);
  }, []);

  return team;
};

export const useLiveTrend = (range: TimeRange) => {
  const [trend, setTrend] = useState(mockWeeklyTrend);

  const generate = useCallback(() => {
    const weeks: Record<TimeRange, number> = { "1w": 1, "2w": 2, "4w": 4, "7w": 7, "12w": 12 };
    const count = weeks[range];
    const base = mockWeeklyTrend.slice(-Math.min(count, mockWeeklyTrend.length));
    // Pad if needed
    const result = [];
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
  }, [range]);

  useEffect(() => {
    setTrend(generate());
    const id = setInterval(() => setTrend(generate()), 5000);
    return () => clearInterval(id);
  }, [generate]);

  return trend;
};

export const useLiveAlerts = () => {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const dismiss = (id: number) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  const restore = () => setDismissed(new Set());

  const visible = alerts.filter((a) => !dismissed.has(a.id));

  useEffect(() => {
    const id = setInterval(() => {
      setAlerts((prev) =>
        prev.map((a) => ({
          ...a,
          description: a.id === 1
            ? `Schedule Performance Index is ${jitter(0.90, 0.05).toFixed(2)}, below the 0.95 threshold.`
            : a.id === 2
            ? `Dan Okafor averaging ${jitterInt(49, 0.06)} hrs/week over last 4 weeks.`
            : a.description,
        }))
      );
    }, 7000);
    return () => clearInterval(id);
  }, []);

  return { alerts: visible, dismiss, restore, dismissedCount: dismissed.size };
};
