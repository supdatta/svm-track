# Trackware

A real-time project tracking dashboard built with React, Vite, TypeScript, and an Express backend.

## Architecture

- **Frontend**: React + TypeScript + Vite (served via Express on port 5000)
- **Backend**: Express server with vite-express for unified dev/prod serving
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router v6
- **State**: React Context (DashboardContext) + localStorage for project persistence
- **Auth**: Replit Auth (via `@replit/repl-auth`) with local-mode fallback

## Key Pages

- `/` — Landing page
- `/auth` — Authentication (local-mode sign-in/sign-up)
- `/setup` — New project setup wizard (GitHub scan or manual)
- `/dashboard/projects` — ProjectsManager: lists all user-created projects
- `/dashboard/github` — GitHub repo scanner
- `/dashboard/spm` — SPM (Earned Value) dashboard
- `/dashboard/settings` — Workspace settings

## Server

The Express server lives in `server/index.ts` and serves:
- `GET /api/auth/user` — Returns Replit user info from request headers
- `POST /api/github-repo` — Proxies GitHub API calls server-side (uses `GITHUB_TOKEN` if set)
- All other routes are handled by Vite (dev) or static files (production)

## Key Features

### GitHub Repo Scanner (`/dashboard/github`)
- Calls `/api/github-repo` on the Express server, which fetches from GitHub API
- Falls back to direct client-side GitHub API if server is unreachable
- Displays commit activity, PR health, contributors, language breakdown, health score

### Projects Page (`/dashboard/projects`)
- Dynamically shows only real user-created projects from localStorage
- No placeholder/default projects
- Real-time updates via storage event listener when a new project is created

### Manual Project Setup (`/setup`)
- Team members have a **weekly hours** field
- AI-powered hour suggestions via **Gemini 1.5 Flash** API
- Click the wand icon next to any team member to get AI-suggested hours based on their role

### Dashboard
- Auto-refreshing metrics with jitter simulation
- Editable EV, health, team, and alert data via modal editors
- Condition-based smart alerts generated from live data

## Environment Variables

- `VITE_GEMINI_API_KEY` — Gemini API key for AI hour suggestions (set in Replit userenv)
- `GITHUB_TOKEN` — Optional GitHub personal access token to increase API rate limits
- `DATABASE_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` — PostgreSQL (provisioned, currently unused by app logic)

## Data Storage

Projects are stored in `localStorage` under the key `trackware_projects`. Each project has:
- `id`, `title`, `type` (github | manual), `description`, `lastUpdated`, `status`

## Running

- **Development**: `npm run dev` — starts Express + Vite via vite-express on port 5000
- **Production**: `npm run build` then `npm start`
