import express from "express";
import cors from "cors";
import ViteExpress from "vite-express";
import { getUserInfo } from "@replit/repl-auth";

const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);

app.use(cors());
app.use(express.json());

app.get("/api/auth/user", (req, res) => {
  const user = getUserInfo(req as any) as Record<string, string> | null;
  if (!user) return res.json({ user: null });
  res.json({
    user: {
      id: user["userId"] || user["id"] || null,
      name: user["name"] || user["userName"] || null,
      profileImage: user["profileImage"] || user["profilePicture"] || null,
    },
  });
});

app.post("/api/github-repo", async (req, res) => {
  const { repoUrl } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ error: "repoUrl is required" });
  }

  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\s#?]+)/);
  if (!match) {
    return res.status(400).json({ error: "Invalid GitHub URL" });
  }

  const owner = match[1];
  const repo = match[2].replace(/\.git$/, "");
  const apiBase = `https://api.github.com/repos/${owner}/${repo}`;

  const githubToken = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "Trackware-App",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (githubToken) {
    headers["Authorization"] = `Bearer ${githubToken}`;
  }

  try {
    const repoRes = await fetch(apiBase, { headers });

    if (!repoRes.ok) {
      const errBody = await repoRes.text();
      console.error("GitHub API error:", repoRes.status, errBody.substring(0, 500));
      return res.status(repoRes.status).json({
        error:
          repoRes.status === 404
            ? "Repository not found or is private"
            : `GitHub API error: ${repoRes.status}`,
        hint:
          repoRes.status === 403
            ? "Rate limited. Try again later or add a GitHub token."
            : undefined,
      });
    }

    const repoData = await repoRes.json();

    const [
      branchesRes, commitsRes, contributorsRes, languagesRes,
      issuesRes, pullsRes, releasesRes, weeklyCommitRes,
    ] = await Promise.all([
      fetch(`${apiBase}/branches?per_page=100`, { headers }),
      fetch(`${apiBase}/commits?per_page=100`, { headers }),
      fetch(`${apiBase}/contributors?per_page=30`, { headers }),
      fetch(`${apiBase}/languages`, { headers }),
      fetch(`${apiBase}/issues?state=all&per_page=100`, { headers }),
      fetch(`${apiBase}/pulls?state=all&per_page=100`, { headers }),
      fetch(`${apiBase}/releases?per_page=10`, { headers }),
      fetch(`${apiBase}/stats/commit_activity`, { headers }),
    ]);

    const branches = branchesRes.ok ? await branchesRes.json() : [];
    const commits = commitsRes.ok ? await commitsRes.json() : [];
    const contributors = contributorsRes.ok ? await contributorsRes.json() : [];
    const languages = languagesRes.ok ? await languagesRes.json() : {};
    const issues = issuesRes.ok ? await issuesRes.json() : [];
    const pulls = pullsRes.ok ? await pullsRes.json() : [];
    const releases = releasesRes.ok ? await releasesRes.json() : [];
    const weeklyCommits = weeklyCommitRes.ok ? await weeklyCommitRes.json() : [];

    const pureIssues = Array.isArray(issues) ? issues.filter((i: any) => !i.pull_request) : [];
    const openIssues = pureIssues.filter((i: any) => i.state === "open");
    const closedIssues = pureIssues.filter((i: any) => i.state === "closed");

    const openPRs = Array.isArray(pulls) ? pulls.filter((p: any) => p.state === "open") : [];
    const closedPRs = Array.isArray(pulls) ? pulls.filter((p: any) => p.state === "closed") : [];
    const mergedPRs = Array.isArray(pulls) ? pulls.filter((p: any) => p.merged_at) : [];

    const issueCloseTimes = closedIssues
      .filter((i: any) => i.closed_at && i.created_at)
      .map((i: any) => (new Date(i.closed_at).getTime() - new Date(i.created_at).getTime()) / 86400000);
    const avgIssueCloseTimeDays =
      issueCloseTimes.length > 0
        ? +(issueCloseTimes.reduce((a: number, b: number) => a + b, 0) / issueCloseTimes.length).toFixed(1)
        : null;

    const prMergeTimes = mergedPRs
      .filter((p: any) => p.merged_at && p.created_at)
      .map((p: any) => (new Date(p.merged_at).getTime() - new Date(p.created_at).getTime()) / 86400000);
    const avgPrMergeTimeDays =
      prMergeTimes.length > 0
        ? +(prMergeTimes.reduce((a: number, b: number) => a + b, 0) / prMergeTimes.length).toFixed(1)
        : null;

    const totalBytes = Object.values(languages).reduce((s: number, v: any) => s + v, 0) as number;
    const languageBreakdown = Object.entries(languages)
      .map(([name, bytes]: [string, any]) => ({
        name,
        bytes,
        percentage: totalBytes > 0 ? +(bytes / totalBytes * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);

    const recentWeeks = Array.isArray(weeklyCommits)
      ? weeklyCommits.slice(-12).map((w: any) => ({
          week: new Date(w.week * 1000).toISOString().split("T")[0],
          total: w.total,
          days: w.days,
        }))
      : [];

    const contributorData = Array.isArray(contributors)
      ? contributors.map((c: any) => ({
          login: c.login,
          avatar: c.avatar_url,
          contributions: c.contributions,
          percentage: commits.length > 0 ? +(c.contributions / commits.length * 100).toFixed(1) : 0,
        }))
      : [];

    const repoAgeDays = Math.floor(
      (Date.now() - new Date(repoData.created_at).getTime()) / 86400000
    );
    const daysSinceLastUpdate = Math.floor(
      (Date.now() - new Date(repoData.updated_at).getTime()) / 86400000
    );

    const result = {
      repo: {
        name: repoData.full_name,
        description: repoData.description,
        default_branch: repoData.default_branch,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        watchers: repoData.subscribers_count,
        open_issues: repoData.open_issues_count,
        language: repoData.language,
        license: repoData.license?.spdx_id || null,
        updated_at: repoData.updated_at,
        created_at: repoData.created_at,
        size_kb: repoData.size,
        has_wiki: repoData.has_wiki,
        has_pages: repoData.has_pages,
        archived: repoData.archived,
        topics: repoData.topics || [],
      },
      metrics: {
        repoAgeDays,
        daysSinceLastUpdate,
        totalCommitsFetched: Array.isArray(commits) ? commits.length : 0,
        totalBranches: Array.isArray(branches) ? branches.length : 0,
        totalContributors: Array.isArray(contributors) ? contributors.length : 0,
        totalReleases: Array.isArray(releases) ? releases.length : 0,
        openIssues: openIssues.length,
        closedIssues: closedIssues.length,
        avgIssueCloseTimeDays,
        openPRs: openPRs.length,
        closedPRs: closedPRs.length,
        mergedPRs: mergedPRs.length,
        prMergeRate:
          closedPRs.length + mergedPRs.length > 0
            ? +(mergedPRs.length / (closedPRs.length + mergedPRs.length) * 100).toFixed(1)
            : null,
        avgPrMergeTimeDays,
      },
      languages: languageBreakdown,
      contributors: contributorData,
      branches: Array.isArray(branches)
        ? branches.map((b: any) => ({
            name: b.name,
            sha: b.commit?.sha?.substring(0, 7),
            protected: b.protected,
          }))
        : [],
      commits: Array.isArray(commits)
        ? commits.slice(0, 20).map((c: any) => ({
            sha: c.sha?.substring(0, 7),
            message: c.commit?.message?.split("\n")[0],
            author: c.commit?.author?.name,
            date: c.commit?.author?.date,
            avatar: c.author?.avatar_url,
          }))
        : [],
      weeklyActivity: recentWeeks,
      releases: Array.isArray(releases)
        ? releases.map((r: any) => ({
            tag: r.tag_name,
            name: r.name,
            published_at: r.published_at,
            prerelease: r.prerelease,
          }))
        : [],
    };

    res.json(result);
  } catch (error: any) {
    console.error("Server error:", error);
    res.status(500).json({ error: error.message || "Unknown error" });
  }
});

ViteExpress.listen(app, PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
