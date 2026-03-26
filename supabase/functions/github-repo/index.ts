import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { repoUrl } = await req.json();

    if (!repoUrl) {
      return new Response(JSON.stringify({ error: "repoUrl is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\s#?]+)/);
    if (!match) {
      return new Response(JSON.stringify({ error: "Invalid GitHub URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, "");
    const apiBase = `https://api.github.com/repos/${owner}/${repo}`;

    const githubToken = Deno.env.get("GITHUB_TOKEN");
    const headers: Record<string, string> = {
      "Accept": "application/vnd.github+json",
      "User-Agent": "Trackware-App",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    if (githubToken) {
      headers["Authorization"] = `Bearer ${githubToken}`;
    }

    // Check repo access first
    const repoRes = await fetch(apiBase, { headers });

    if (!repoRes.ok) {
      const errBody = await repoRes.text();
      console.error("GitHub API error:", repoRes.status, errBody.substring(0, 500));
      return new Response(JSON.stringify({ 
        error: repoRes.status === 404 
          ? "Repository not found or is private" 
          : `GitHub API error: ${repoRes.status}`,
        hint: repoRes.status === 403 ? "Rate limited. Try again later or add a GitHub token." : undefined
      }), {
        status: repoRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const repoData = await repoRes.json();

    // Fetch all data in parallel
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

    // Separate issues from PRs (GitHub API returns PRs in issues too)
    const pureIssues = Array.isArray(issues) ? issues.filter((i: any) => !i.pull_request) : [];
    const openIssues = pureIssues.filter((i: any) => i.state === "open");
    const closedIssues = pureIssues.filter((i: any) => i.state === "closed");

    const openPRs = Array.isArray(pulls) ? pulls.filter((p: any) => p.state === "open") : [];
    const closedPRs = Array.isArray(pulls) ? pulls.filter((p: any) => p.state === "closed") : [];
    const mergedPRs = Array.isArray(pulls) ? pulls.filter((p: any) => p.merged_at) : [];

    // Calculate avg issue close time (for closed issues with both dates)
    const issueCloseTimes = closedIssues
      .filter((i: any) => i.closed_at && i.created_at)
      .map((i: any) => (new Date(i.closed_at).getTime() - new Date(i.created_at).getTime()) / (1000 * 60 * 60 * 24));
    const avgIssueCloseTimeDays = issueCloseTimes.length > 0
      ? issueCloseTimes.reduce((a: number, b: number) => a + b, 0) / issueCloseTimes.length
      : null;

    // Calculate avg PR merge time
    const prMergeTimes = mergedPRs
      .filter((p: any) => p.merged_at && p.created_at)
      .map((p: any) => (new Date(p.merged_at).getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24));
    const avgPrMergeTimeDays = prMergeTimes.length > 0
      ? prMergeTimes.reduce((a: number, b: number) => a + b, 0) / prMergeTimes.length
      : null;

    // Language breakdown as percentages
    const totalBytes = Object.values(languages).reduce((s: number, v: any) => s + v, 0);
    const languageBreakdown = Object.entries(languages).map(([name, bytes]: [string, any]) => ({
      name,
      bytes,
      percentage: totalBytes > 0 ? +(bytes / totalBytes * 100).toFixed(1) : 0,
    })).sort((a, b) => b.percentage - a.percentage);

    // Weekly commit activity (last 12 weeks)
    const recentWeeks = Array.isArray(weeklyCommits) ? weeklyCommits.slice(-12).map((w: any) => ({
      week: new Date(w.week * 1000).toISOString().split("T")[0],
      total: w.total,
      days: w.days, // array of 7 days (Sun-Sat)
    })) : [];

    // Commit frequency per contributor
    const contributorData = Array.isArray(contributors) ? contributors.map((c: any) => ({
      login: c.login,
      avatar: c.avatar_url,
      contributions: c.contributions,
      percentage: commits.length > 0 ? +(c.contributions / commits.length * 100).toFixed(1) : 0,
    })) : [];

    // Repo age in days
    const repoAgeDays = Math.floor((Date.now() - new Date(repoData.created_at).getTime()) / (1000 * 60 * 60 * 24));
    const daysSinceLastUpdate = Math.floor((Date.now() - new Date(repoData.updated_at).getTime()) / (1000 * 60 * 60 * 24));

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
        // Issues
        openIssues: openIssues.length,
        closedIssues: closedIssues.length,
        avgIssueCloseTimeDays: avgIssueCloseTimeDays ? +avgIssueCloseTimeDays.toFixed(1) : null,
        // PRs
        openPRs: openPRs.length,
        closedPRs: closedPRs.length,
        mergedPRs: mergedPRs.length,
        prMergeRate: (closedPRs.length + mergedPRs.length) > 0
          ? +(mergedPRs.length / (closedPRs.length + mergedPRs.length) * 100).toFixed(1)
          : null,
        avgPrMergeTimeDays: avgPrMergeTimeDays ? +avgPrMergeTimeDays.toFixed(1) : null,
      },
      languages: languageBreakdown,
      contributors: contributorData,
      branches: Array.isArray(branches) ? branches.map((b: any) => ({
        name: b.name,
        sha: b.commit?.sha?.substring(0, 7),
        protected: b.protected,
      })) : [],
      commits: Array.isArray(commits) ? commits.slice(0, 20).map((c: any) => ({
        sha: c.sha?.substring(0, 7),
        message: c.commit?.message?.split("\n")[0],
        author: c.commit?.author?.name,
        date: c.commit?.author?.date,
        avatar: c.author?.avatar_url,
      })) : [],
      weeklyActivity: recentWeeks,
      releases: Array.isArray(releases) ? releases.map((r: any) => ({
        tag: r.tag_name,
        name: r.name,
        published_at: r.published_at,
        prerelease: r.prerelease,
      })) : [],
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
