import { Link } from "react-router-dom";
import { ArrowRight, Menu } from "lucide-react";
import { useState } from "react";
import TrackwareLogo from "@/components/Logo";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <TrackwareLogo size={8} />
          <span className="font-display font-bold text-lg text-foreground">
            <span className="text-primary">trackware</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Docs</a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">GitHub</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/auth"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:brightness-110 transition-all shadow-md shadow-primary/20"
          >
            Get Started
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl px-6 py-4 space-y-3">
          <a href="#features" className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-2">Features</a>
          <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-2">Docs</a>
          <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-2">GitHub</a>
          <div className="pt-2 border-t border-border/50 flex flex-col gap-2">
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2">Sign In</Link>
            <Link
              to="/auth"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:brightness-110 transition-all"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
