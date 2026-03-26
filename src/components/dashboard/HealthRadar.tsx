import { useDashboard } from "@/contexts/DashboardContext";
import { useState } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

const HealthRadar = () => {
  const { health } = useDashboard();
  const [hoveredAxis, setHoveredAxis] = useState<string | null>(null);

  const data = [
    { axis: "Schedule", value: health.schedule },
    { axis: "Cost", value: health.cost },
    { axis: "Quality", value: health.quality },
    { axis: "Productivity", value: health.productivity },
    { axis: "Risk", value: health.risk },
  ];

  const hoveredItem = data.find((d) => d.axis === hoveredAxis);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Health Radar</h3>
        <div className="text-xs text-muted-foreground tabular-nums">
          Overall: <span className="text-foreground font-semibold">{health.overall}%</span>
        </div>
      </div>
      {hoveredAxis && hoveredItem && (
        <div className="mb-2 px-3 py-2 rounded-lg bg-primary/10 text-sm animate-in fade-in duration-200">
          <span className="text-primary font-medium">{hoveredAxis}</span>
          <span className="text-foreground ml-2 font-display font-bold">{hoveredItem.value}%</span>
          <span className="text-muted-foreground ml-2 text-xs">
            {hoveredItem.value >= 75 ? "✓ Healthy" : hoveredItem.value >= 50 ? "⚠ At Risk" : "✗ Critical"}
          </span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="hsl(240, 6%, 22%)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "hsl(240, 4%, 55%)", fontSize: 11, cursor: "pointer" }}
            onMouseEnter={(e: any) => setHoveredAxis(e?.value)}
            onMouseLeave={() => setHoveredAxis(null)}
          />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Health" dataKey="value"
            stroke="hsl(72, 95%, 55%)" fill="hsl(72, 95%, 55%)"
            fillOpacity={0.15} strokeWidth={2} animationDuration={800}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HealthRadar;
