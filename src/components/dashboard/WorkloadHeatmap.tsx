import { useDashboard } from "@/contexts/DashboardContext";
import { useState } from "react";

const getHeatColor = (hours: number) => {
  if (hours >= 12) return "bg-health-red/80";
  if (hours >= 10) return "bg-health-amber/60";
  if (hours >= 8) return "bg-primary/40";
  if (hours >= 5) return "bg-primary/20";
  return "bg-muted";
};

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const WorkloadHeatmap = () => {
  const { team } = useDashboard();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "avg">("name");

  const sorted = [...team].sort((a, b) =>
    sortBy === "avg" ? b.avgHours - a.avgHours : a.name.localeCompare(b.name)
  );

  const displayed = selectedMember ? sorted.filter((m) => m.name === selectedMember) : sorted;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Workload Heatmap</h3>
        <div className="flex items-center gap-2">
          {selectedMember && (
            <button onClick={() => setSelectedMember(null)} className="text-xs text-primary hover:underline">Show All</button>
          )}
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
            <button onClick={() => setSortBy("name")} className={`px-2 py-1 text-xs rounded-md transition-all ${sortBy === "name" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>A-Z</button>
            <button onClick={() => setSortBy("avg")} className={`px-2 py-1 text-xs rounded-md transition-all ${sortBy === "avg" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Hours</button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-xs text-muted-foreground pb-3 pr-4 font-medium">Member</th>
              {days.map((d) => (<th key={d} className="text-center text-xs text-muted-foreground pb-3 font-medium w-10">{d}</th>))}
              <th className="text-right text-xs text-muted-foreground pb-3 pl-4 font-medium">Avg</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((member) => (
              <tr key={member.name}
                className={`cursor-pointer transition-colors ${selectedMember === member.name ? "bg-primary/5" : "hover:bg-muted/30"}`}
                onClick={() => setSelectedMember(selectedMember === member.name ? null : member.name)}
              >
                <td className="py-1.5 pr-4">
                  <div className="text-sm text-foreground font-medium">{member.name}</div>
                  <div className="text-xs text-muted-foreground">{member.role}</div>
                </td>
                {member.weeklyHours.map((hours, i) => (
                  <td key={i} className="py-1.5 px-0.5">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-medium ${getHeatColor(hours)} text-foreground mx-auto transition-all duration-500`} title={`${hours}h`}>
                      {hours}
                    </div>
                  </td>
                ))}
                <td className="py-1.5 pl-4 text-right">
                  <span className={`text-sm font-semibold font-display transition-colors duration-500 ${member.avgHours >= 10 ? "text-health-red" : "text-foreground"}`}>
                    {member.avgHours}h
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-muted" /> &lt;5h</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary/20" /> 5-8h</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary/40" /> 8-10h</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-health-amber/60" /> 10-12h</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-health-red/80" /> &gt;12h</span>
      </div>
    </div>
  );
};

export default WorkloadHeatmap;
