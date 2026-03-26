import { useState } from "react";
import { useDashboard } from "@/contexts/DashboardContext";
import type { TimeRange } from "@/contexts/DashboardContext";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const ranges: { label: string; value: TimeRange }[] = [
  { label: "1W", value: "1w" },
  { label: "2W", value: "2w" },
  { label: "4W", value: "4w" },
  { label: "7W", value: "7w" },
  { label: "12W", value: "12w" },
];

const EVTrendChart = () => {
  const { trend, timeRange, setTimeRange } = useDashboard();
  const [visibleLines, setVisibleLines] = useState({ pv: true, ev: true, ac: true });

  const toggleLine = (key: "pv" | "ev" | "ac") =>
    setVisibleLines((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Earned Value Trend</h3>
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => setTimeRange(r.value)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                timeRange === r.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={trend}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 6%, 16%)" />
          <XAxis dataKey="week" tick={{ fill: "hsl(240, 4%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(240, 4%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(240, 8%, 10%)",
              border: "1px solid hsl(240, 6%, 22%)",
              borderRadius: "8px", fontSize: "12px", color: "hsl(0, 0%, 95%)",
            }}
            formatter={(value: number) => [`$${(value / 1000).toFixed(1)}k`]}
          />
          {visibleLines.pv && <Line type="monotone" dataKey="pv" stroke="hsl(240, 4%, 55%)" strokeWidth={2} dot={false} name="Planned" animationDuration={600} />}
          {visibleLines.ev && <Line type="monotone" dataKey="ev" stroke="hsl(72, 95%, 55%)" strokeWidth={2} dot={false} name="Earned" animationDuration={600} />}
          {visibleLines.ac && <Line type="monotone" dataKey="ac" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={false} name="Actual" animationDuration={600} />}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground justify-center">
        <button onClick={() => toggleLine("pv")} className={`flex items-center gap-1.5 transition-opacity ${visibleLines.pv ? "" : "opacity-40 line-through"}`}>
          <span className="w-3 h-0.5 bg-muted-foreground rounded" /> Planned
        </button>
        <button onClick={() => toggleLine("ev")} className={`flex items-center gap-1.5 transition-opacity ${visibleLines.ev ? "" : "opacity-40 line-through"}`}>
          <span className="w-3 h-0.5 bg-primary rounded" /> Earned
        </button>
        <button onClick={() => toggleLine("ac")} className={`flex items-center gap-1.5 transition-opacity ${visibleLines.ac ? "" : "opacity-40 line-through"}`}>
          <span className="w-3 h-0.5 bg-health-amber rounded" /> Actual
        </button>
      </div>
    </div>
  );
};

export default EVTrendChart;
