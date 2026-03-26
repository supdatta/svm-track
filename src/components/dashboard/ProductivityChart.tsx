import { useDashboard } from "@/contexts/DashboardContext";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const ProductivityChart = () => {
  const { productivity } = useDashboard();
  const [metric, setMetric] = useState<"tasksPerHour" | "locPerHour">("tasksPerHour");

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Productivity Trend</h3>
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
          <button
            onClick={() => setMetric("tasksPerHour")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              metric === "tasksPerHour" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Tasks/hr
          </button>
          <button
            onClick={() => setMetric("locPerHour")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              metric === "locPerHour" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            LOC/hr
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={productivity}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 6%, 16%)" />
          <XAxis dataKey="week" tick={{ fill: "hsl(240, 4%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(240, 4%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(240, 8%, 10%)",
              border: "1px solid hsl(240, 6%, 22%)",
              borderRadius: "8px", fontSize: "12px", color: "hsl(0, 0%, 95%)",
            }}
          />
          <Bar
            dataKey={metric}
            fill="hsl(72, 95%, 55%)"
            radius={[4, 4, 0, 0]}
            animationDuration={600}
            name={metric === "tasksPerHour" ? "Tasks/hr" : "LOC/hr"}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProductivityChart;
