import { useDashboard } from "@/contexts/DashboardContext";
import { useState } from "react";

const StabilityRing = () => {
  const { health } = useDashboard();
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const score = selectedMetric
    ? (health as any)[selectedMetric.toLowerCase()] ?? health.overall
    : health.overall;

  const circumference = 2 * Math.PI * 80;
  const progress = (score / 100) * circumference;
  const color = score >= 75 ? "text-health-green" : score >= 50 ? "text-health-amber" : "text-health-red";
  const strokeColor = score >= 75 ? "hsl(142, 71%, 45%)" : score >= 50 ? "hsl(38, 92%, 50%)" : "hsl(0, 72%, 51%)";
  const label = score >= 75 ? "Stable" : score >= 50 ? "At Risk" : "Critical";

  const metrics = [
    { label: "Schedule", key: "schedule", value: health.schedule },
    { label: "Cost", key: "cost", value: health.cost },
    { label: "Quality", key: "quality", value: health.quality },
    { label: "Prod.", key: "productivity", value: health.productivity },
  ];

  return (
    <div className="glass-card p-6 flex flex-col items-center justify-center">
      <div className="flex items-center justify-between w-full mb-6">
        <h3 className="text-sm font-medium text-muted-foreground">Project Stability</h3>
        {selectedMetric && (
          <button onClick={() => setSelectedMetric(null)} className="text-xs text-primary hover:underline">
            Show Overall
          </button>
        )}
      </div>
      <div className="relative w-48 h-48 cursor-pointer" onClick={() => setSelectedMetric(null)}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
          <circle cx="90" cy="90" r="80" fill="none" stroke="hsl(240, 6%, 18%)" strokeWidth="8" />
          <circle
            cx="90" cy="90" r="80" fill="none" stroke={strokeColor} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 8px ${strokeColor})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-bold text-foreground transition-all duration-500">{score}</span>
          <span className={`text-sm font-medium ${color} transition-colors duration-500`}>
            {selectedMetric || label}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3 mt-6 w-full text-center">
        {metrics.map((item) => (
          <button
            key={item.label}
            onClick={() => setSelectedMetric(selectedMetric === item.key ? null : item.key)}
            className={`rounded-lg py-2 transition-all duration-300 ${
              selectedMetric === item.key ? "bg-primary/15 ring-1 ring-primary/30" : "hover:bg-muted/50"
            }`}
          >
            <div className="text-xs text-muted-foreground">{item.label}</div>
            <div className="font-display font-semibold text-foreground text-sm transition-all duration-500">
              {item.value}%
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StabilityRing;
