import { ArrowRight, Activity, Shield, Zap, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 gradient-mesh" />
      <div className="absolute inset-0 dot-grid opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />
      <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-primary/5 blur-3xl animate-pulse" />
      <div className="absolute bottom-32 right-[15%] w-96 h-96 rounded-full bg-primary/3 blur-3xl" />

      <div className="container relative z-10 mx-auto px-6 py-32">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card animate-fade-up">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
              <span className="text-sm font-medium text-muted-foreground">
                Open Source · Free to Use
              </span>
            </div>
            <div className="flex items-center gap-2 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground font-bold">
                      {["EN", "PM", "TL", "QA"][i]}
                    </span>
                  </div>
                ))}
              </div>
              <span className="text-xs text-muted-foreground ml-2">Trusted by teams</span>
            </div>
          </div>

          <div className="text-center mb-8 animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95]">
              <span className="text-foreground">Track work,</span>
              <br />
              <span className="inline-flex items-center gap-3">
                <span className="text-gradient-lime">ship</span>
                <Sparkles className="w-8 h-8 md:w-12 md:h-12 text-primary animate-pulse" />
                <span className="text-gradient-lime">faster</span>
              </span>
            </h1>
          </div>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto text-center mb-4 animate-fade-up"
             style={{ animationDelay: "0.2s" }}>
            Work intelligence for engineers & managers.
            Track effort, monitor progress, detect risks — all in one place.
          </p>

          <p className="text-sm text-muted-foreground/60 max-w-xl mx-auto text-center mb-10 animate-fade-up"
             style={{ animationDelay: "0.25s" }}>
            Simple dashboards · Earned Value Metrics · Team Health Scoring
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-up"
               style={{ animationDelay: "0.3s" }}>
            <Link
              to="/setup"
              className="group inline-flex items-center gap-3 px-10 py-4 bg-primary text-primary-foreground font-bold text-lg rounded-2xl hover:brightness-110 transition-all duration-300 glow-lime shadow-lg shadow-primary/25"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/dashboard/github"
              className="inline-flex items-center gap-2 px-10 py-4 glass-card-hover text-foreground font-semibold text-lg rounded-2xl border border-border hover:border-primary/40 transition-all duration-300"
            >
              Open Dashboard
              <ArrowRight className="w-4 h-4 opacity-50" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-20 max-w-2xl mx-auto animate-fade-up"
               style={{ animationDelay: "0.4s" }}>
            {[
              { icon: Activity, label: "Real-time Metrics", value: "12+", color: "text-primary" },
              { icon: Shield, label: "Health Checks", value: "5-Axis", color: "text-primary" },
              { icon: Zap, label: "Smart Alerts", value: "Auto", color: "text-primary" },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-4 text-center rounded-2xl">
                <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
                <div className="text-xl font-bold font-display text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
