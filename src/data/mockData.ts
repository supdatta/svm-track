// Mock data for the dashboard
export const mockProject = {
  name: "SVM Core API",
  workspace: "SVM Labs",
  totalBudget: 120000,
  totalScheduleWeeks: 24,
  currentWeek: 14,
  teamSize: 5,
};

export const mockEarnedValue = {
  pv: 70000,
  ev: 63000,
  ac: 68000,
  spi: 0.90,
  cpi: 0.93,
  scheduleVariance: -7000,
  costVariance: -5000,
};

export const mockHealthScores = {
  schedule: 72,
  cost: 78,
  quality: 85,
  productivity: 68,
  risk: 60,
  overall: 73,
};

export const mockTeamMembers = [
  { name: "Alice Chen", role: "Lead", weeklyHours: [8, 9, 7, 9, 8, 4, 0], avgHours: 6.4 },
  { name: "Bob Kumar", role: "Backend", weeklyHours: [7, 8, 8, 7, 8, 3, 0], avgHours: 5.9 },
  { name: "Carol Diaz", role: "Frontend", weeklyHours: [6, 7, 6, 7, 7, 2, 0], avgHours: 5.0 },
  { name: "Dan Okafor", role: "DevOps", weeklyHours: [9, 10, 9, 10, 9, 6, 2], avgHours: 7.9 },
  { name: "Eve Park", role: "QA", weeklyHours: [7, 6, 8, 7, 7, 4, 0], avgHours: 5.6 },
];

export const mockAlerts = [
  {
    id: 1,
    type: "warning" as const,
    title: "SPI Below Threshold",
    description: "Schedule Performance Index is 0.90, below the 0.95 threshold.",
    cause: "Feature scope creep in Sprint 12",
    action: "Re-prioritize backlog, defer non-critical items to next release.",
  },
  {
    id: 2,
    type: "critical" as const,
    title: "Developer Overload Detected",
    description: "Dan Okafor averaging 49 hrs/week over last 4 weeks.",
    cause: "DevOps tasks concentrated on single team member",
    action: "Redistribute infrastructure tasks or bring in additional support.",
  },
  {
    id: 3,
    type: "info" as const,
    title: "Quality Health Strong",
    description: "Defect density has decreased 12% over the last 3 sprints.",
    cause: "Improved code review process",
    action: "Continue current review practices.",
  },
];

export const mockWeeklyTrend = [
  { week: "W8", pv: 40000, ev: 38000, ac: 39000 },
  { week: "W9", pv: 45000, ev: 42000, ac: 44000 },
  { week: "W10", pv: 50000, ev: 47000, ac: 49000 },
  { week: "W11", pv: 55000, ev: 51000, ac: 54000 },
  { week: "W12", pv: 60000, ev: 55000, ac: 59000 },
  { week: "W13", pv: 65000, ev: 59000, ac: 63000 },
  { week: "W14", pv: 70000, ev: 63000, ac: 68000 },
];

export const mockProductivity = [
  { week: "W8", tasksPerHour: 0.42, locPerHour: 18 },
  { week: "W9", tasksPerHour: 0.45, locPerHour: 21 },
  { week: "W10", tasksPerHour: 0.38, locPerHour: 16 },
  { week: "W11", tasksPerHour: 0.50, locPerHour: 24 },
  { week: "W12", tasksPerHour: 0.43, locPerHour: 19 },
  { week: "W13", tasksPerHour: 0.47, locPerHour: 22 },
  { week: "W14", tasksPerHour: 0.41, locPerHour: 17 },
];
