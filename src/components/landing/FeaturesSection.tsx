import { BarChart3, Users, TrendingUp, AlertTriangle, GitBranch, Gauge } from "lucide-react";

const features = [
  {
    icon: GitBranch,
    title: "Workspace Architecture",
    description: "Organize teams and projects in a familiar structure. Manage workspaces and track progress across your portfolio.",
    tag: "Organization",
  },
  {
    icon: BarChart3,
    title: "Daily Work Logs",
    description: "Team members log hours, work type, and effort level. The system auto-generates weekly reports and analytics.",
    tag: "Logging",
  },
  {
    icon: TrendingUp,
    title: "Earned Value Analysis",
    description: "See at a glance whether your project is on budget and on schedule with automatically computed progress metrics.",
    tag: "Metrics",
  },
  {
    icon: Gauge,
    title: "Health Radar",
    description: "5-axis radar chart showing Schedule, Cost, Quality, Productivity, and Risk health at a glance.",
    tag: "Intelligence",
  },
  {
    icon: AlertTriangle,
    title: "Smart Alerts",
    description: "Get notified when deadlines slip, quality drops, or team members are overloaded. Clear, actionable warnings.",
    tag: "Alerts",
  },
  {
    icon: Users,
    title: "Workload Heatmap",
    description: "Visual weekly heatmap showing team effort distribution. Spot overload and underutilization instantly.",
    tag: "Team",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="relative py-32">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full mb-4">
            Core Features
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Built for engineers<br />
            <span className="text-gradient-lime">& managers alike</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Clear, intuitive project intelligence anyone on the team can understand — no technical background required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="glass-card-hover p-6 group animate-fade-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                  {feature.tag}
                </span>
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
