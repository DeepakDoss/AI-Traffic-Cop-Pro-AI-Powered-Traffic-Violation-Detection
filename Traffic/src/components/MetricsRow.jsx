import { Car, AlertTriangle, Activity, IndianRupee, TrendingUp } from 'lucide-react';
import { MOCK_METRICS_CONFIG } from '../data/mockData';

const ICON_MAP = { Car, AlertTriangle, Activity, IndianRupee };

const COLOR_CONFIG = {
  indigo: {
    iconBg: 'from-indigo-600/30 to-indigo-900/20',
    iconBorder: 'border-indigo-500/25',
    iconColor: 'text-indigo-400',
    glow: 'glow-indigo',
    topBar: 'from-indigo-500/0 via-indigo-500/30 to-indigo-500/0',
    orb: 'bg-indigo-600/10',
  },
  red: {
    iconBg: 'from-red-600/30 to-red-900/20',
    iconBorder: 'border-red-500/25',
    iconColor: 'text-red-400',
    glow: 'glow-red',
    topBar: 'from-red-500/0 via-red-500/30 to-red-500/0',
    orb: 'bg-red-600/10',
  },
  emerald: {
    iconBg: 'from-emerald-600/30 to-emerald-900/20',
    iconBorder: 'border-emerald-500/25',
    iconColor: 'text-emerald-400',
    glow: 'glow-emerald',
    topBar: 'from-emerald-500/0 via-emerald-500/30 to-emerald-500/0',
    orb: 'bg-emerald-600/10',
  },
  amber: {
    iconBg: 'from-amber-600/30 to-amber-900/20',
    iconBorder: 'border-amber-500/25',
    iconColor: 'text-amber-400',
    glow: 'glow-amber',
    topBar: 'from-amber-500/0 via-amber-500/30 to-amber-500/0',
    orb: 'bg-amber-600/10',
  },
};

/** Formats a raw INR number into a human-readable string (e.g. 124500 → ₹1,24,500) */
function formatINR(n) {
  return '₹' + n.toLocaleString('en-IN');
}

/** Formats a large number with commas */
function formatNum(n) {
  return n.toLocaleString('en-IN');
}

// ─────────────────────────────────────────────────────────────────────────────
// MetricCard: renders a single KPI card.
// `value`     – the live string value to display (computed by MetricsRow below)
// `trendBadge`– the trend badge string (e.g. "+5.2%" or "+13 today")
// ─────────────────────────────────────────────────────────────────────────────
function MetricCard({ cfg, value, trendBadge, delay = 0 }) {
  const Icon = ICON_MAP[cfg.icon];
  const c    = COLOR_CONFIG[cfg.color];

  return (
    <div
      id={`metric-${cfg.id}`}
      className={`metric-card ${c.glow} animate-fade-in-up hover:scale-[1.02] transition-transform duration-300 cursor-default`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top accent gradient bar */}
      <div className={`absolute top-0 left-8 right-8 h-px bg-gradient-to-r ${c.topBar}`} />

      {/* Decorative background orb */}
      <div className={`absolute top-0 right-0 w-28 h-28 ${c.orb} rounded-full blur-2xl translate-x-8 -translate-y-8 pointer-events-none`} />

      <div className="relative p-5 z-10">
        <div className="flex items-start justify-between mb-4">
          {/* Colored icon ring */}
          <div className={`flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${c.iconBg} border ${c.iconBorder} shadow-lg`}>
            {Icon && <Icon size={20} className={c.iconColor} />}
          </div>

          {/* Live trend badge — always emerald for "up" direction */}
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full border text-emerald-400 bg-emerald-400/8 border-emerald-400/15">
            <TrendingUp size={10} />
            {trendBadge}
          </span>
        </div>

        {/* Live value — key prop triggers React to re-render with new number */}
        <p key={value} className="text-2xl font-bold text-white tracking-tight leading-none mb-1">
          {value}
        </p>
        <p className="text-xs font-medium text-slate-400 mb-0.5">{cfg.label}</p>
        <p className="text-[10px] text-slate-600">{cfg.trendLabel}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MetricsRow: maps static config + live kpi props → MetricCard instances.
// All values start at zero and only grow from real backend detections.
// ─────────────────────────────────────────────────────────────────────────────
export default function MetricsRow({ kpi }) {
  const cards = MOCK_METRICS_CONFIG.map((cfg) => {
    const hasData = kpi.activeViolations > 0 || kpi.totalVehicles > 0;
    switch (cfg.id) {
      case 'total-vehicles':
        return {
          cfg,
          value:      formatNum(kpi.totalVehicles),
          trendBadge: hasData ? `${kpi.totalVehicles} detected` : 'Awaiting data',
        };
      case 'active-violations':
        return {
          cfg,
          value:      formatNum(kpi.activeViolations),
          trendBadge: hasData ? `+${kpi.newViolationsToday} this session` : 'Awaiting data',
        };
      case 'system-uptime':
        return {
          cfg,
          value:      cfg.staticValue,   // real infra metric — never changes
          trendBadge: '99.7% this week',
        };
      case 'fines-generated':
        return {
          cfg,
          value:      kpi.finesGenerated > 0 ? formatINR(kpi.finesGenerated) : '₹0',
          trendBadge: hasData ? `${kpi.activeViolations} challans` : 'Awaiting data',
        };
      default:
        return { cfg, value: '—', trendBadge: '—' };
    }
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map(({ cfg, value, trendBadge }, i) => (
        <MetricCard key={cfg.id} cfg={cfg} value={value} trendBadge={trendBadge} delay={i * 80} />
      ))}
    </div>
  );
}
