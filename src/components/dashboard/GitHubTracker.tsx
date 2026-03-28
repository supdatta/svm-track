import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GitBranch, GitCommit, Star, GitFork, AlertCircle, Users, Code,
  ExternalLink, Loader2, Eye, Tag, Calendar, Clock, GitPullRequest,
  TrendingUp, TrendingDown, CheckCircle, XCircle, BarChart3, Activity,
  ArrowLeft, Layers,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

interface RepoMetrics {
  repoAgeDays: number;
  daysSinceLastUpdate: number;
  totalCommitsFetched: number;
  totalBranches: number;
  totalContributors: number;
  totalReleases: number;
  openIssues: number;
  closedIssues: number;
  avgIssueCloseTimeDays: number | null;
  openPRs: number;
  closedPRs: number;
  mergedPRs: number;
  prMergeRate: number | null;
  avgPrMergeTimeDays: number | null;
}

interface GitHubData {
  repo: {
    name: string;
    description: string | null;
    default_branch: string;
    stars: number;
    forks: number;
    watchers: number;
    open_issues: number;
    language: string | null;
    license: string | null;
    updated_at: string;
    created_at: string;
    size_kb: number;
    has_wiki: boolean;
    has_pages: boolean;
    archived: boolean;
    topics: string[];
  };
  metrics: RepoMetrics;
  languages: { name: string; bytes: number; percentage: number }[];
  contributors: { login: string; avatar: string; contributions: number; percentage: number }[];
  branches: { name: string; sha: string; protected: boolean }[];
  commits: { sha: string; message: string; author: string; date: string; avatar: string | null }[];
  weeklyActivity: { week: string; total: number; days: number[] }[];
  releases: { tag: string; name: string; published_at: string; prerelease: boolean }[];
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "hsl(210, 60%, 50%)", JavaScript: "hsl(50, 90%, 50%)", Python: "hsl(210, 50%, 40%)",
  Java: "hsl(20, 70%, 50%)", Go: "hsl(190, 80%, 45%)", Rust: "hsl(25, 70%, 45%)",
  Ruby: "hsl(0, 60%, 50%)", PHP: "hsl(240, 50%, 55%)", C: "hsl(200, 30%, 45%)",
  "C++": "hsl(340, 50%, 50%)", "C#": "hsl(280, 50%, 50%)", Swift: "hsl(15, 80%, 55%)",
  Kotlin: "hsl(260, 60%, 55%)", Dart: "hsl(190, 70%, 50%)", Shell: "hsl(120, 30%, 45%)",
  HTML: "hsl(15, 80%, 55%)", CSS: "hsl(260, 60%, 55%)", SCSS: "hsl(330, 60%, 55%)",
};
const getColor = (lang: string, i: number) => LANG_COLORS[lang] || `hsl(${(i * 47) % 360}, 60%, 50%)`;

const MetricCard = ({ label, value, icon: Icon, sub, trend }: {
  label: string; value: string | number; icon: React.ElementType; sub?: string;
  trend?: "up" | "down" | "neutral";
}) => (
  <div className="glass-card p-4 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      {trend === "up" && <TrendingUp className="w-4 h-4 text-health-green" />}
      {trend === "down" && <TrendingDown className="w-4 h-4 text-health-red" />}
    </div>
    <div className="font-display text-2xl font-bold text-foreground">{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
    {sub && <div className="text-[10px] text-muted-foreground/70">{sub}</div>}
  </div>
);

const computeHealthScore = (m: RepoMetrics, stars: number) => {
  let score = 50; // base
  // Activity: recent update
  if (m.daysSinceLastUpdate <= 1) score += 15;
  else if (m.daysSinceLastUpdate <= 7) score += 10;
  else if (m.daysSinceLastUpdate <= 30) score += 5;
  else if (m.daysSinceLastUpdate > 90) score -= 10;
  // PR merge rate
  if (m.prMergeRate !== null) {
    if (m.prMergeRate >= 80) score += 10;
    else if (m.prMergeRate >= 50) score += 5;
    else score -= 5;
  }
  // Issue resolution
  if (m.avgIssueCloseTimeDays !== null) {
    if (m.avgIssueCloseTimeDays <= 7) score += 10;
    else if (m.avgIssueCloseTimeDays <= 30) score += 5;
    else score -= 5;
  }
  // Contributors
  if (m.totalContributors >= 10) score += 5;
  else if (m.totalContributors >= 3) score += 3;
  // Community
  if (stars >= 100) score += 5;
  if (m.totalReleases >= 3) score += 5;
  return Math.max(0, Math.min(100, score));
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

const GitHubTracker = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [data, setData] = useState<GitHubData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFromClient = async (owner: string, repo: string): Promise<GitHubData> => {
    const apiBase = `https://api.github.com/repos/${owner}/${repo}`;
    const h = { Accept: "application/vnd.github+json" };
    const [repoRes, branchesRes, commitsRes, contribRes, langRes, issuesRes, pullsRes, releasesRes, weeklyRes] =
      await Promise.all([
        fetch(apiBase, { headers: h }),
        fetch(`${apiBase}/branches?per_page=100`, { headers: h }),
        fetch(`${apiBase}/commits?per_page=100`, { headers: h }),
        fetch(`${apiBase}/contributors?per_page=30`, { headers: h }),
        fetch(`${apiBase}/languages`, { headers: h }),
        fetch(`${apiBase}/issues?state=all&per_page=100`, { headers: h }),
        fetch(`${apiBase}/pulls?state=all&per_page=100`, { headers: h }),
        fetch(`${apiBase}/releases?per_page=10`, { headers: h }),
        fetch(`${apiBase}/stats/commit_activity`, { headers: h }),
      ]);
    if (!repoRes.ok) {
      if (repoRes.status === 404) throw new Error("Repository not found or is private.");
      if (repoRes.status === 403) throw new Error("GitHub rate limit reached. Try again later.");
      throw new Error(`GitHub API error: ${repoRes.status}`);
    }
    const rd = await repoRes.json();
    const branches = branchesRes.ok ? await branchesRes.json() : [];
    const commits = commitsRes.ok ? await commitsRes.json() : [];
    const contributors = contribRes.ok ? await contribRes.json() : [];
    const languages = langRes.ok ? await langRes.json() : {};
    const issues = issuesRes.ok ? await issuesRes.json() : [];
    const pulls = pullsRes.ok ? await pullsRes.json() : [];
    const releases = releasesRes.ok ? await releasesRes.json() : [];
    const weekly = weeklyRes.ok ? await weeklyRes.json() : [];

    const pureIssues = Array.isArray(issues) ? issues.filter((i: any) => !i.pull_request) : [];
    const openIssues = pureIssues.filter((i: any) => i.state === "open");
    const closedIssues = pureIssues.filter((i: any) => i.state === "closed");
    const openPRs = Array.isArray(pulls) ? pulls.filter((p: any) => p.state === "open") : [];
    const closedPRs = Array.isArray(pulls) ? pulls.filter((p: any) => p.state === "closed") : [];
    const mergedPRs = Array.isArray(pulls) ? pulls.filter((p: any) => p.merged_at) : [];

    const issueCloseTimes = closedIssues.filter((i: any) => i.closed_at && i.created_at)
      .map((i: any) => (new Date(i.closed_at).getTime() - new Date(i.created_at).getTime()) / 86400000);
    const avgIssueClose = issueCloseTimes.length > 0 ? +(issueCloseTimes.reduce((a, b) => a + b, 0) / issueCloseTimes.length).toFixed(1) : null;

    const prMergeTimes = mergedPRs.filter((p: any) => p.merged_at && p.created_at)
      .map((p: any) => (new Date(p.merged_at).getTime() - new Date(p.created_at).getTime()) / 86400000);
    const avgPrMerge = prMergeTimes.length > 0 ? +(prMergeTimes.reduce((a, b) => a + b, 0) / prMergeTimes.length).toFixed(1) : null;

    const totalBytes = Object.values(languages).reduce((s: number, v: any) => s + (v as number), 0) as number;
    const langBreakdown = Object.entries(languages).map(([name, bytes]: [string, any]) => ({
      name, bytes: bytes as number, percentage: totalBytes > 0 ? +((bytes as number) / totalBytes * 100).toFixed(1) : 0,
    })).sort((a, b) => b.percentage - a.percentage);

    const repoAgeDays = Math.floor((Date.now() - new Date(rd.created_at).getTime()) / 86400000);
    const daysSinceLastUpdate = Math.floor((Date.now() - new Date(rd.updated_at).getTime()) / 86400000);

    return {
      repo: {
        name: rd.full_name, description: rd.description, default_branch: rd.default_branch,
        stars: rd.stargazers_count, forks: rd.forks_count, watchers: rd.subscribers_count,
        open_issues: rd.open_issues_count, language: rd.language, license: rd.license?.spdx_id || null,
        updated_at: rd.updated_at, created_at: rd.created_at, size_kb: rd.size,
        has_wiki: rd.has_wiki, has_pages: rd.has_pages, archived: rd.archived, topics: rd.topics || [],
      },
      metrics: {
        repoAgeDays, daysSinceLastUpdate,
        totalCommitsFetched: Array.isArray(commits) ? commits.length : 0,
        totalBranches: Array.isArray(branches) ? branches.length : 0,
        totalContributors: Array.isArray(contributors) ? contributors.length : 0,
        totalReleases: Array.isArray(releases) ? releases.length : 0,
        openIssues: openIssues.length, closedIssues: closedIssues.length,
        avgIssueCloseTimeDays: avgIssueClose,
        openPRs: openPRs.length, closedPRs: closedPRs.length, mergedPRs: mergedPRs.length,
        prMergeRate: (closedPRs.length + mergedPRs.length) > 0 ? +(mergedPRs.length / (closedPRs.length + mergedPRs.length) * 100).toFixed(1) : null,
        avgPrMergeTimeDays: avgPrMerge,
      },
      languages: langBreakdown,
      contributors: Array.isArray(contributors) ? contributors.map((c: any) => ({
        login: c.login, avatar: c.avatar_url, contributions: c.contributions,
        percentage: commits.length > 0 ? +(c.contributions / commits.length * 100).toFixed(1) : 0,
      })) : [],
      branches: Array.isArray(branches) ? branches.map((b: any) => ({ name: b.name, sha: b.commit?.sha?.substring(0, 7), protected: b.protected })) : [],
      commits: Array.isArray(commits) ? commits.slice(0, 20).map((c: any) => ({
        sha: c.sha?.substring(0, 7), message: c.commit?.message?.split("\n")[0],
        author: c.commit?.author?.name, date: c.commit?.author?.date, avatar: c.author?.avatar_url,
      })) : [],
      weeklyActivity: Array.isArray(weekly) ? weekly.slice(-12).map((w: any) => ({
        week: new Date(w.week * 1000).toISOString().split("T")[0], total: w.total, days: w.days,
      })) : [],
      releases: Array.isArray(releases) ? releases.map((r: any) => ({
        tag: r.tag_name, name: r.name, published_at: r.published_at, prerelease: r.prerelease,
      })) : [],
    };
  };

  const fetchRepo = async () => {
    if (!url.includes("github.com")) {
      setError("Please enter a valid GitHub URL");
      return;
    }
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch("/api/github-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: url }),
      });
      if (res.ok) {
        const result = await res.json();
        setData(result);
        return;
      }
      console.log("Server API unavailable, using direct GitHub API");
      const match = url.match(/github\.com\/([^\/]+)\/([^\/\s#?]+)/);
      if (!match) throw new Error("Invalid GitHub URL");
      const clientResult = await fetchFromClient(match[1], match[2].replace(/\.git$/, ""));
      setData(clientResult);
    } catch (err: any) {
      setError(err.message || "Failed to fetch repo data");
    } finally {
      setLoading(false);
    }
  };

  const healthScore = data ? computeHealthScore(data.metrics, data.repo.stars) : 0;
  const healthColor = healthScore >= 75 ? "text-health-green" : healthScore >= 50 ? "text-health-amber" : "text-health-red";
  const healthStroke = healthScore >= 75 ? "hsl(142, 71%, 45%)" : healthScore >= 50 ? "hsl(38, 92%, 50%)" : "hsl(0, 72%, 51%)";
  const healthLabel = healthScore >= 75 ? "Healthy" : healthScore >= 50 ? "Needs Attention" : "At Risk";

  const circumference = 2 * Math.PI * 80;
  const progress = (healthScore / 100) * circumference;

  // Radar data from metrics
  const radarData = data ? [
    { axis: "Activity", value: Math.min(100, data.metrics.daysSinceLastUpdate <= 1 ? 100 : data.metrics.daysSinceLastUpdate <= 7 ? 80 : data.metrics.daysSinceLastUpdate <= 30 ? 50 : 20) },
    { axis: "Community", value: Math.min(100, (data.repo.stars + data.repo.forks * 2) > 500 ? 90 : (data.repo.stars + data.repo.forks * 2) > 50 ? 60 : 30) },
    { axis: "Issues", value: data.metrics.closedIssues + data.metrics.openIssues > 0 ? Math.min(100, Math.round(data.metrics.closedIssues / (data.metrics.closedIssues + data.metrics.openIssues) * 100)) : 50 },
    { axis: "PRs", value: data.metrics.prMergeRate ?? 50 },
    { axis: "Team", value: Math.min(100, data.metrics.totalContributors >= 10 ? 90 : data.metrics.totalContributors >= 5 ? 70 : data.metrics.totalContributors >= 2 ? 50 : 25) },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Back to Projects */}
      <button
        onClick={() => navigate("/dashboard/projects")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <Layers className="w-3.5 h-3.5" />
        Back to Projects
      </button>

      {/* URL Input */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Scan a Public GitHub Repository</h3>
        <div className="flex gap-3">
          <input
            type="url"
            placeholder="https://github.com/owner/repo"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchRepo()}
            className="flex-1 bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <button
            onClick={fetchRepo}
            disabled={loading || !url.trim()}
            className="px-6 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Code className="w-4 h-4" />}
            {loading ? "Scanning…" : "Scan Repo"}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-destructive flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" /> {error}
          </p>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Scanning repository…</p>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Repo Header */}
          <div className="glass-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                  {data.repo.name}
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  {data.repo.archived && <span className="px-2 py-0.5 text-xs bg-health-amber/20 text-health-amber rounded-full">Archived</span>}
                </h2>
                {data.repo.description && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{data.repo.description}</p>}
                {data.repo.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {data.repo.topics.slice(0, 8).map(t => (
                      <span key={t} className="px-2 py-0.5 text-[10px] bg-primary/10 text-primary rounded-full">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              {data.repo.language && (
                <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full shrink-0">
                  {data.repo.language}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" /> {data.repo.stars.toLocaleString()}</span>
              <span className="flex items-center gap-1"><GitFork className="w-3.5 h-3.5" /> {data.repo.forks.toLocaleString()}</span>
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {data.repo.watchers.toLocaleString()}</span>
              <span className="flex items-center gap-1"><GitBranch className="w-3.5 h-3.5" /> {data.repo.default_branch}</span>
              {data.repo.license && <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> {data.repo.license}</span>}
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {Math.round(data.metrics.repoAgeDays / 30)} months old</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Updated {timeAgo(data.repo.updated_at)}</span>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Commits" value={data.metrics.totalCommitsFetched} icon={GitCommit} sub="Recent 100" />
            <MetricCard label="Contributors" value={data.metrics.totalContributors} icon={Users} />
            <MetricCard label="Open Issues" value={data.metrics.openIssues} icon={AlertCircle}
              sub={data.metrics.avgIssueCloseTimeDays ? `Avg close: ${data.metrics.avgIssueCloseTimeDays}d` : undefined}
              trend={data.metrics.openIssues > data.metrics.closedIssues ? "down" : "up"} />
            <MetricCard label="Open PRs" value={data.metrics.openPRs} icon={GitPullRequest}
              sub={data.metrics.prMergeRate ? `Merge rate: ${data.metrics.prMergeRate}%` : undefined}
              trend={(data.metrics.prMergeRate ?? 0) >= 70 ? "up" : "down"} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Merged PRs" value={data.metrics.mergedPRs} icon={CheckCircle}
              sub={data.metrics.avgPrMergeTimeDays ? `Avg merge: ${data.metrics.avgPrMergeTimeDays}d` : undefined} />
            <MetricCard label="Branches" value={data.metrics.totalBranches} icon={GitBranch} />
            <MetricCard label="Releases" value={data.metrics.totalReleases} icon={Tag}
              sub={data.releases[0] ? `Latest: ${data.releases[0].tag}` : undefined} />
            <MetricCard label="Repo Size" value={data.repo.size_kb > 1000 ? `${(data.repo.size_kb / 1024).toFixed(1)} MB` : `${data.repo.size_kb} KB`} icon={BarChart3} />
          </div>

          {/* Health Score + Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Ring */}
            <div className="glass-card p-6 flex flex-col items-center justify-center">
              <h3 className="text-sm font-medium text-muted-foreground mb-4 self-start">Project Health Score</h3>
              <div className="relative w-48 h-48">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
                  <circle cx="90" cy="90" r="80" fill="none" stroke="hsl(240, 6%, 18%)" strokeWidth="8" />
                  <circle cx="90" cy="90" r="80" fill="none" stroke={healthStroke} strokeWidth="8"
                    strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - progress}
                    className="transition-all duration-1000 ease-out"
                    style={{ filter: `drop-shadow(0 0 8px ${healthStroke})` }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-4xl font-bold text-foreground">{healthScore}</span>
                  <span className={`text-sm font-medium ${healthColor}`}>{healthLabel}</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-4 text-center max-w-xs">
                Based on update recency, PR merge rate, issue resolution, contributors, and community signals.
              </div>
            </div>

            {/* Health Radar */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Health Breakdown</h3>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="hsl(240, 6%, 22%)" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: "hsl(240, 4%, 55%)", fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Health" dataKey="value" stroke="hsl(72, 95%, 55%)" fill="hsl(72, 95%, 55%)"
                    fillOpacity={0.15} strokeWidth={2} animationDuration={800} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Commit Activity Chart */}
          {data.weeklyActivity.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Weekly Commit Activity (last 12 weeks)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 6%, 16%)" />
                  <XAxis dataKey="week" tick={{ fill: "hsl(240, 4%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => { const d = new Date(v); return `${d.getMonth() + 1}/${d.getDate()}`; }} />
                  <YAxis tick={{ fill: "hsl(240, 4%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{
                    backgroundColor: "hsl(240, 8%, 10%)", border: "1px solid hsl(240, 6%, 22%)",
                    borderRadius: "8px", fontSize: "12px", color: "hsl(0, 0%, 95%)",
                  }} />
                  <Bar dataKey="total" fill="hsl(72, 95%, 55%)" radius={[4, 4, 0, 0]} animationDuration={600} name="Commits" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Languages + Contributors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Language Breakdown */}
            {data.languages.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Language Breakdown</h3>
                <div className="flex items-center gap-6">
                  <div className="w-40 h-40 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.languages.slice(0, 6)} dataKey="percentage" nameKey="name" cx="50%" cy="50%"
                          innerRadius={35} outerRadius={65} strokeWidth={0} animationDuration={600}>
                          {data.languages.slice(0, 6).map((l, i) => (
                            <Cell key={l.name} fill={getColor(l.name, i)} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{
                          backgroundColor: "hsl(240, 8%, 10%)", border: "1px solid hsl(240, 6%, 22%)",
                          borderRadius: "8px", fontSize: "12px", color: "hsl(0, 0%, 95%)",
                        }} formatter={(v: number) => [`${v}%`]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 flex-1">
                    {data.languages.slice(0, 6).map((l, i) => (
                      <div key={l.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: getColor(l.name, i) }} />
                          <span className="text-sm text-foreground">{l.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">{l.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Top Contributors */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Top Contributors ({data.contributors.length})
              </h3>
              <div className="space-y-2">
                {data.contributors.slice(0, 8).map((c) => (
                  <div key={c.login} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <img src={c.avatar} alt={c.login} className="w-6 h-6 rounded-full" />
                      <span className="text-sm text-foreground font-medium">{c.login}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, c.percentage)}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums w-16 text-right">{c.contributions} commits</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Issues & PRs Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-primary" /> Issues Summary
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center py-3 rounded-lg bg-secondary/50">
                  <div className="font-display text-2xl font-bold text-health-amber">{data.metrics.openIssues}</div>
                  <div className="text-xs text-muted-foreground">Open</div>
                </div>
                <div className="text-center py-3 rounded-lg bg-secondary/50">
                  <div className="font-display text-2xl font-bold text-health-green">{data.metrics.closedIssues}</div>
                  <div className="text-xs text-muted-foreground">Closed</div>
                </div>
              </div>
              {data.metrics.avgIssueCloseTimeDays !== null && (
                <div className="flex items-center justify-between text-sm px-2">
                  <span className="text-muted-foreground">Avg Close Time</span>
                  <span className="font-medium text-foreground">{data.metrics.avgIssueCloseTimeDays} days</span>
                </div>
              )}
              {(data.metrics.closedIssues + data.metrics.openIssues) > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Resolution Rate</span>
                    <span>{Math.round(data.metrics.closedIssues / (data.metrics.closedIssues + data.metrics.openIssues) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-health-green rounded-full transition-all duration-700"
                      style={{ width: `${Math.round(data.metrics.closedIssues / (data.metrics.closedIssues + data.metrics.openIssues) * 100)}%` }} />
                  </div>
                </div>
              )}
            </div>

            <div className="glass-card p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-primary" /> Pull Requests Summary
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center py-3 rounded-lg bg-secondary/50">
                  <div className="font-display text-2xl font-bold text-health-amber">{data.metrics.openPRs}</div>
                  <div className="text-xs text-muted-foreground">Open</div>
                </div>
                <div className="text-center py-3 rounded-lg bg-secondary/50">
                  <div className="font-display text-2xl font-bold text-health-green">{data.metrics.mergedPRs}</div>
                  <div className="text-xs text-muted-foreground">Merged</div>
                </div>
                <div className="text-center py-3 rounded-lg bg-secondary/50">
                  <div className="font-display text-2xl font-bold text-health-red">{data.metrics.closedPRs}</div>
                  <div className="text-xs text-muted-foreground">Closed</div>
                </div>
              </div>
              {data.metrics.prMergeRate !== null && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Merge Rate</span>
                    <span>{data.metrics.prMergeRate}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-700"
                      style={{ width: `${data.metrics.prMergeRate}%` }} />
                  </div>
                </div>
              )}
              {data.metrics.avgPrMergeTimeDays !== null && (
                <div className="flex items-center justify-between text-sm px-2 mt-3">
                  <span className="text-muted-foreground">Avg Merge Time</span>
                  <span className="font-medium text-foreground">{data.metrics.avgPrMergeTimeDays} days</span>
                </div>
              )}
            </div>
          </div>

          {/* Recent Commits */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-primary" /> Recent Commits
            </h3>
            <div className="space-y-1">
              {data.commits.slice(0, 15).map((commit) => (
                <div key={commit.sha} className="flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-secondary/50 transition-colors">
                  {commit.avatar ? (
                    <img src={commit.avatar} alt={commit.author} className="w-6 h-6 rounded-full mt-0.5 shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center mt-0.5 shrink-0">
                      <GitCommit className="w-3 h-3 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{commit.message}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{commit.author}</span>
                      <span className="text-xs text-muted-foreground/50">·</span>
                      <code className="text-xs text-primary/70 font-mono">{commit.sha}</code>
                      <span className="text-xs text-muted-foreground/50">·</span>
                      <span className="text-xs text-muted-foreground">{timeAgo(commit.date)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Releases */}
          {data.releases.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" /> Releases ({data.releases.length})
              </h3>
              <div className="space-y-2">
                {data.releases.map((r) => (
                  <div key={r.tag} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground font-medium">{r.tag}</span>
                      {r.name && r.name !== r.tag && <span className="text-xs text-muted-foreground">— {r.name}</span>}
                      {r.prerelease && <span className="px-1.5 py-0.5 text-[10px] bg-health-amber/20 text-health-amber rounded">pre</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">{timeAgo(r.published_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GitHubTracker;
