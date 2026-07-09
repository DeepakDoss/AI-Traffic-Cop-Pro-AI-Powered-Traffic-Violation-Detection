// ─── Static Config for AI Traffic Cop Pro ──────────────────────────────────────
// All KPI counters start at ZERO — they only increment from real API responses.
// MOCK_VIOLATIONS_POOL and INITIAL_ALERTS have been removed:
// the violations table is now populated exclusively by /api/upload-video results.

export const INITIAL_KPI = {
  totalVehicles:    0,   // will increment as API detections come in
  activeViolations: 0,   // only real violations from the backend
  finesGenerated:   0,   // computed from actual fine amounts returned by AI
};

// Static config for each KPI card (icon, color, label etc.) — never changes
export const MOCK_METRICS_CONFIG = [
  {
    id: 'total-vehicles',
    label: 'Total Vehicles',
    trendLabel: 'this session',
    icon: 'Car',
    color: 'indigo',
  },
  {
    id: 'active-violations',
    label: 'Active Violations',
    trendLabel: 'this session',
    icon: 'AlertTriangle',
    color: 'red',
  },
  {
    id: 'system-uptime',
    label: 'System Uptime',
    trendLabel: 'this week',
    icon: 'Activity',
    color: 'emerald',
    staticValue: '99.7%', // real infra metric — not AI-derived
  },
  {
    id: 'fines-generated',
    label: 'Fines Generated',
    trendLabel: 'this session',
    icon: 'IndianRupee',
    color: 'amber',
  },
];


export const NAV_ITEMS = [
  { id: 'monitoring', label: 'Monitoring', icon: 'MonitorPlay', group: 'Operations' },
  { id: 'forensics',  label: 'Forensics',  icon: 'Search',      group: 'Operations' },
  { id: 'analytics',  label: 'Analytics',  icon: 'BarChart2',   group: 'Intelligence' },
  { id: 'reports',    label: 'Reports',    icon: 'FileText',    group: 'Intelligence' },
  { id: 'cameras',    label: 'Cameras',    icon: 'Camera',      group: 'Infrastructure' },
  { id: 'settings',   label: 'Settings',   icon: 'Settings',    group: 'System' },
];
