import { useDashboard } from "@/contexts/DashboardContext";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const TeamCapacityTable = () => {
  const { team } = useDashboard();
  const [sortKey, setSortKey] = useState<"name" | "role" | "avgHours">("avgHours");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const roles = Array.from(new Set(team.map((m) => m.role)));

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filtered = selectedRole ? team.filter((m) => m.role === selectedRole) : team;
  const sorted = [...filtered].sort((a, b) => {
    const mul = sortDir === "asc" ? 1 : -1;
    if (sortKey === "name") return mul * a.name.localeCompare(b.name);
    if (sortKey === "role") return mul * a.role.localeCompare(b.role);
    return mul * (a.avgHours - b.avgHours);
  });

  const totalHours = team.reduce((s, m) => s + m.avgHours, 0);
  const avgTeamHours = team.length ? (totalHours / team.length) : 0;

  const SortIcon = ({ col }: { col: typeof sortKey }) =>
    sortKey === col ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3 inline ml-0.5" /> : <ChevronDown className="w-3 h-3 inline ml-0.5" />) : null;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Team Capacity</h3>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">
            Avg: <span className={`font-semibold ${avgTeamHours >= 45 ? "text-health-red" : "text-foreground"}`}>{avgTeamHours.toFixed(1)}h</span>
          </div>
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
            <button
              onClick={() => setSelectedRole(null)}
              className={`px-2 py-1 text-xs rounded-md transition-all ${!selectedRole ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              All
            </button>
            {roles.map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRole(selectedRole === r ? null : r)}
                className={`px-2 py-1 text-xs rounded-md transition-all ${selectedRole === r ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left text-xs text-muted-foreground pb-3 font-medium cursor-pointer" onClick={() => toggleSort("name")}>
              Name <SortIcon col="name" />
            </th>
            <th className="text-left text-xs text-muted-foreground pb-3 font-medium cursor-pointer" onClick={() => toggleSort("role")}>
              Role <SortIcon col="role" />
            </th>
            <th className="text-right text-xs text-muted-foreground pb-3 font-medium cursor-pointer" onClick={() => toggleSort("avgHours")}>
              Avg Hrs <SortIcon col="avgHours" />
            </th>
            <th className="text-right text-xs text-muted-foreground pb-3 font-medium">Capacity</th>
            <th className="text-right text-xs text-muted-foreground pb-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((m) => {
            const capacity = Math.min(100, Math.round((m.avgHours / 50) * 100));
            const status = m.avgHours >= 48 ? "Overloaded" : m.avgHours >= 40 ? "Full" : m.avgHours >= 30 ? "Normal" : "Low";
            const statusColor = m.avgHours >= 48 ? "text-health-red" : m.avgHours >= 40 ? "text-health-amber" : "text-health-green";
            return (
              <tr key={m.name} className="hover:bg-muted/30 transition-colors">
                <td className="py-2.5 text-sm text-foreground font-medium">{m.name}</td>
                <td className="py-2.5 text-sm text-muted-foreground">{m.role}</td>
                <td className="py-2.5 text-sm text-right font-display font-semibold">
                  <span className={m.avgHours >= 45 ? "text-health-red" : "text-foreground"}>{m.avgHours}h</span>
                </td>
                <td className="py-2.5 text-right">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          capacity >= 95 ? "bg-health-red" : capacity >= 80 ? "bg-health-amber" : "bg-primary"
                        }`}
                        style={{ width: `${capacity}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums w-8">{capacity}%</span>
                  </div>
                </td>
                <td className={`py-2.5 text-xs text-right font-medium ${statusColor}`}>{status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TeamCapacityTable;
