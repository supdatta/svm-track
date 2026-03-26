import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Activity, Mail, Lock, User, ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signInWithFallback, signUpWithFallback } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const result = await signInWithFallback(email, password);
        toast.success(result.mode === "local" ? "Signed in (local mode)" : "Signed in successfully!");
        navigate("/dashboard");
      } else {
        const result = await signUpWithFallback(email, password, displayName);
        if (result.mode === "local") {
          toast.success("Account created in local mode");
          navigate("/dashboard");
        } else {
          toast.success("Check your email to verify your account!");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 gradient-mesh" />
      <div className="absolute inset-0 dot-grid opacity-15" />

      {/* Left panel — brand / creative */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 relative p-12">
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 mb-20">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-lime">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-2xl text-foreground">
              <span className="text-primary">trackware</span>
            </span>
          </Link>

          <div className="max-w-md">
            <h2 className="font-display text-5xl font-bold tracking-tight leading-[1.1] mb-6">
              <span className="text-foreground">Track work,</span>
              <br />
              <span className="inline-flex items-center gap-2">
                <span className="text-gradient-lime">ship</span>
                <Sparkles className="w-8 h-8 text-primary" />
                <span className="text-gradient-lime">faster</span>
              </span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Work intelligence for engineers & managers. Monitor progress, detect risks, and keep your team in sync.
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-12 left-12 right-12 z-10">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground font-bold">
                    {["EN", "PM", "TL"][i]}
                  </span>
                </div>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">Built for teams that ship.</span>
          </div>
        </div>

        {/* Floating glow */}
        <div className="absolute top-1/4 right-0 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/3 blur-3xl" />
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-3 justify-center mb-10 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-lime">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-2xl text-foreground">
              <span className="text-primary">trackware</span>
            </span>
          </Link>

          {/* Auth Card */}
          <div className="glass-card p-8 rounded-2xl">
            <h2 className="font-display text-2xl font-bold text-foreground text-center mb-2">
              {isLogin ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-8">
              {isLogin ? "Sign in to your workspace" : "Start tracking your engineering metrics"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required={!isLogin}
                    className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-secondary border border-border rounded-xl pl-10 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl hover:brightness-110 transition-all glow-lime disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    {isLogin ? "Sign In" : "Create Account"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <span className="text-primary font-medium">{isLogin ? "Sign up" : "Sign in"}</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground/40 text-center mt-6">
            By continuing, you agree to our Terms & Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
