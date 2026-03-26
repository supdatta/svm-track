import { Github, Activity, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const FooterSection = () => {
  return (
    <footer className="relative border-t border-border bg-card/30 pt-20 pb-8 overflow-hidden">
      {/* Giant brand watermark */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none select-none">
        <div className="font-display font-black text-[12vw] leading-none text-foreground/[0.03] whitespace-nowrap tracking-tighter">
          trackware
        </div>
      </div>

      <div className="container relative z-10 mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
          {/* Brand column */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center glow-lime-sm">
                <Activity className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg text-foreground">
                <span className="text-primary">trackware</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Work intelligence for engineers & managers. Simple, clear, and built for real teams.
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:brightness-110 transition-all"
            >
              Get Started
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-display font-semibold text-sm text-foreground mb-4 uppercase tracking-wider">Product</h4>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors w-fit">Features</a>
              <a href="#" className="hover:text-foreground transition-colors w-fit">Documentation</a>
              <a href="#" className="hover:text-foreground transition-colors w-fit">Changelog</a>
              <a href="#" className="hover:text-foreground transition-colors w-fit">Pricing</a>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-display font-semibold text-sm text-foreground mb-4 uppercase tracking-wider">Resources</h4>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors w-fit">Getting Started</a>
              <a href="#" className="hover:text-foreground transition-colors w-fit">API Reference</a>
              <a href="#" className="hover:text-foreground transition-colors w-fit">FAQ</a>
              <a href="#" className="hover:text-foreground transition-colors w-fit">Support</a>
            </div>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-display font-semibold text-sm text-foreground mb-4 uppercase tracking-wider">Community</h4>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors flex items-center gap-1.5 w-fit">
                <Github className="w-3.5 h-3.5" /> GitHub
              </a>
              <a href="#" className="hover:text-foreground transition-colors w-fit">Discussions</a>
              <a href="#" className="hover:text-foreground transition-colors w-fit">Discord</a>
              <a href="#" className="hover:text-foreground transition-colors w-fit">Twitter / X</a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground/60">© 2026 trackware. All rights reserved.</span>
          <div className="flex items-center gap-6 text-xs text-muted-foreground/60">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
