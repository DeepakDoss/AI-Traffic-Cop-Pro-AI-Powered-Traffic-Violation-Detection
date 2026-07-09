import { useState } from 'react';
import { Clock, Siren, MapPin, ExternalLink } from 'lucide-react';

// ─── Severity styling config ─────────────────────────────────────────────────
const SEVERITY = {
  high:   { bar: 'bg-red-500',   badge: 'bg-red-500/10 text-red-400 border border-red-500/20',   dot: 'bg-red-500' },
  medium: { bar: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', dot: 'bg-amber-500' },
  low:    { bar: 'bg-slate-600', badge: 'bg-slate-700/50 text-slate-400 border border-slate-700', dot: 'bg-slate-500' },
};

// ─────────────────────────────────────────────────────────────────────────────
// AlertItem: a single detection log row.
// `isNew` triggers the flash+slide animation for 1.8s after being pushed.
// `onViewEvidence` opens the Evidence Review Modal in App.jsx.
// ─────────────────────────────────────────────────────────────────────────────
function AlertItem({ alert, isNew, onViewEvidence }) {
  const s = SEVERITY[alert.severity] || SEVERITY.medium;

  return (
    <div
      className={`relative flex items-start gap-0 border-b border-slate-800/40 transition-colors duration-700 group ${
        isNew ? 'animate-slide-in row-flash' : ''
      }`}
    >
      {/* Left severity accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${s.bar} opacity-70`} />

      <div className="flex-1 px-4 py-3 pl-5">
        {/* Row 1: plate + violation badge */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs font-bold text-slate-100 font-mono tracking-wider">{alert.plate}</span>
          <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.badge}`}>
            {alert.type}
          </span>
        </div>

        {/* Row 2: timestamp + camera + confidence */}
        <div className="flex items-center gap-3 text-[10px] font-mono mb-1">
          <span className="flex items-center gap-1 text-slate-600">
            <Clock size={8} />
            {alert.ts}
          </span>
          <span className="text-slate-700">{alert.cam}</span>
          <span className={`ml-auto font-bold ${
            alert.conf >= 95 ? 'text-emerald-400' :
            alert.conf >= 85 ? 'text-amber-400'   : 'text-slate-500'
          }`}>
            {alert.conf.toFixed(1)}%
          </span>
        </div>

        {/* Row 3: location + fine + View Evidence button */}
        <div className="flex items-center gap-1 text-[10px] font-mono">
          {alert.location && (
            <>
              <MapPin size={8} className="text-slate-700 shrink-0" />
              <span className="text-slate-700 truncate flex-1">{alert.location}</span>
            </>
          )}
          {alert.fine && (
            <span className="shrink-0 text-amber-700 font-bold ml-1">
              ₹{alert.fine.toLocaleString('en-IN')}
            </span>
          )}
          {/* "View Evidence" appears on hover */}
          <button
            onClick={() => onViewEvidence(alert)}
            className="shrink-0 ml-2 flex items-center gap-0.5 text-[10px] font-bold text-indigo-400
              hover:text-indigo-200 opacity-0 group-hover:opacity-100 transition-all duration-150"
          >
            <ExternalLink size={9} />
            View
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AlertStream: pure presentational component.
// Receives violations array + latestId from App.jsx (no internal interval).
// onViewEvidence is threaded down to each AlertItem.
// ─────────────────────────────────────────────────────────────────────────────
export default function AlertStream({ violations = [], latestId = null, onViewEvidence }) {
  const [filter, setFilter] = useState('All');

  const filtered = filter === 'All'
    ? violations
    : violations.filter(a => a.severity === filter.toLowerCase());

  const highCount = violations.filter(a => a.severity === 'high').length;

  return (
    <div
      className="flex flex-col rounded-2xl border border-slate-800/60 overflow-hidden h-full"
      style={{ background: 'linear-gradient(180deg, #0d1528 0%, #0a1020 100%)' }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-800/40 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Siren size={14} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 leading-none">Real-Time Detections</h2>
              <p className="text-[10px] text-slate-600 mt-0.5">{violations.length} events · from uploaded evidence</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/8 border border-emerald-500/15">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
            <span className="text-[10px] font-bold text-emerald-400">LIVE</span>
          </div>
        </div>

        {/* Severity filter tabs */}
        <div className="flex items-center gap-1.5">
          {['All', 'High', 'Medium'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                filter === f
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/40'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              {f}
            </button>
          ))}
          <span className="ml-auto text-[10px] font-mono text-slate-700">{filtered.length}</span>
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-xs text-slate-700">No detections yet</div>
        ) : (
          filtered.map(a => (
            <AlertItem
              key={a.id}
              alert={a}
              isNew={a.id === latestId}
              onViewEvidence={onViewEvidence}
            />
          ))
        )}
      </div>

      {/* Footer summary */}
      <div className="px-4 py-2.5 border-t border-slate-800/40 shrink-0">
        <p className="text-[10px] text-slate-700 font-mono text-center">
          {highCount} high severity · streaming from {[...new Set(violations.map(v => v.cam))].length} cameras
        </p>
      </div>
    </div>
  );
}
