# Trackware

A real-time project tracking dashboard built with React, Vite, and TypeScript.

## Architecture

- **Frontend**: React + TypeScript + Vite (port 5000)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router v6
- **State**: React Context (DashboardContext) + localStorage for project persistence

## Key Pages

- `/` — Landing page
- `/auth` — Authentication
- `/setup` — New project setup wizard (GitHub scan or manual)
- `/dashboard/projects` — ProjectsManager: lists all user-created projects
- `/dashboard/github` — GitHub repo scanner
- `/dashboard/spm` — SPM (Earned Value) dashboard
- `/dashboard/settings` — Workspace settings

## Key Features

### Projects Page (`/dashboard/projects`)
- Dynamically shows only real user-created projects from localStorage
- No placeholder/default projects
- Real-time updates via storage event listener when a new project is created
- Migrates away old placeholder projects on load

### Manual Project Setup (`/setup`)
- Team members have a **weekly hours** field
- AI-powered hour suggestions via **Gemini 1.5 Flash** API
- Click the wand icon next to any team member to get AI-suggested hours based on their role, project budget, schedule, and team context
- Suggestions include a one-sentence reasoning shown inline

### Dashboard
- Auto-refreshing metrics with jitter simulation
- Editable EV, health, team, and alert data via modal editors
- Condition-based smart alerts generated from live data

## Environment Variables

- `VITE_GEMINI_API_KEY` — Gemini API key for AI hour suggestions in manual project setup

## Data Storage

Projects are stored in `localStorage` under the key `trackware_projects`. Each project has:
- `id`, `title`, `type` (github | manual), `description`, `lastUpdated`, `status`
