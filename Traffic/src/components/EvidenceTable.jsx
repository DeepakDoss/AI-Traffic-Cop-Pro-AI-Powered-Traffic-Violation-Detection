import { useState } from 'react';
import { ExternalLink, ChevronLeft, ChevronRight, Filter, ArrowUpDown } from 'lucide-react';

// ─── Status pill config — includes new workflow statuses ─────────────────────
const STATUS_CFG = {
  'Unpaid':        { cls: 'bg-red-500/12 text-red-400 border-red-500/20',              dot: 'bg-red-500'    },
  'Verified':      { cls: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/20',  dot: 'bg-emerald-500' },
  'Paid':          { cls: 'bg-blue-500/12 text-blue-400 border-blue-500/20',           dot: 'bg-blue-500'   },
  'Under Review':  { cls: 'bg-amber-500/12 text-amber-400 border-amber-500/20',        dot: 'bg-amber-500'  },
  // ↓ Added by the modal workflow actions
  'Challan Issued':{ cls: 'bg-indigo-500/12 text-indigo-400 border-indigo-500/20',     dot: 'bg-indigo-500' },
  'Dismissed':     { cls: 'bg-slate-700/40  text-slate-500  border-slate-700/40',      dot: 'bg-slate-600'  },
};

// ─── Violation type colour map ────────────────────────────────────────────────
const VIOLATION_CLR = {
  'No Helmet':    'text-red-300',
  'Signal Jump':  'text-orange-300',
  'Overspeeding': 'text-amber-300',
  'Triple Ride':  'text-rose-300',
  'Wrong Lane':   'text-yellow-300',
};

const COLS = [
  { label: 'Timestamp',  field: 'ts'     },
  { label: 'Camera',     field: 'cam'    },
  { label: 'Plate No.',  field: 'plate'  },
  { label: 'Violation',  field: 'type'   },
  { label: 'Status',     field: 'status' },
];

const PER_PAGE = 6;

// ─────────────────────────────────────────────────────────────────────────────
// EvidenceTable: receives live `violations` from App and `onViewEvidence`
// callback to open the centralised EvidenceModal.
// No internal modal — that lives in App.jsx to overlay the full screen.
// ─────────────────────────────────────────────────────────────────────────────
export default function EvidenceTable({ violations = [], onViewEvidence }) {
  const [sortField, setSortField] = useState('ts');
  const [sortDir, setSortDir]     = useState('desc');
  const [page, setPage]           = useState(0);
  const [selected, setSelected]   = useState(new Set());

  // ── Sort ─────────────────────────────────────────────────────────────────
  const sorted = [...violations].sort((a, b) => {
    const m = sortDir === 'asc' ? 1 : -1;
    return (a[sortField] ?? '') > (b[sortField] ?? '') ? m : -m;
  });

  const pages    = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const safePage = Math.min(page, pages - 1);
  const rows     = sorted.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE);

  const toggleSort = (f) => {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(f); setSortDir('desc'); }
  };

  const toggleRow = (id) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  return (
    <div
      className="rounded-2xl border border-slate-800/60 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0d1528 0%, #0a1020 100%)' }}
    >
      {/* Top glow line */}
      <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/15 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <h2 className="text-sm font-bold text-slate-100">Evidence Log</h2>
          <p className="text-[11px] text-slate-600 mt-0.5">
            {violations.length} records · sorted by {sortField}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-600/15 text-indigo-300 border border-indigo-500/20 font-semibold">
              {selected.size} selected
            </span>
          )}
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 bg-slate-800/60 border border-slate-700/50 rounded-lg hover:text-slate-200 hover:border-slate-600 transition-all">
            <Filter size={12} />
            Filter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'rgba(2,6,23,0.5)' }}>
              <th className="w-10 px-5 py-3">
                <input type="checkbox" className="accent-indigo-500 w-3.5 h-3.5 cursor-pointer"
                  onChange={e => {
                    e.target.checked ? setSelected(new Set(rows.map(r => r.id))) : setSelected(new Set());
                  }} />
              </th>
              {COLS.map(({ label, field }) => (
                <th key={field} onClick={() => toggleSort(field)}
                  className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-600
                    cursor-pointer hover:text-slate-300 transition-colors select-none">
                  <div className="flex items-center gap-1.5">
                    {label}
                    <ArrowUpDown size={9} className={sortField === field ? 'text-indigo-400 opacity-100' : 'opacity-20'} />
                  </div>
                </th>
              ))}
              <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map(row => {
              const sc         = STATUS_CFG[row.status] || STATUS_CFG['Unpaid'];
              const isSelected = selected.has(row.id);
              return (
                <tr
                  key={row.id}
                  className={`border-t border-slate-800/30 transition-colors duration-100 group cursor-default ${
                    isSelected ? 'bg-indigo-950/20' : 'hover:bg-slate-800/20'
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <input type="checkbox" checked={isSelected} onChange={() => toggleRow(row.id)}
                      className="accent-indigo-500 w-3.5 h-3.5 cursor-pointer" />
                  </td>
                  <td className="px-3 py-3.5 text-[11px] text-slate-500 font-mono">{row.ts}</td>
                  <td className="px-3 py-3.5">
                    <span className="text-[11px] font-bold text-slate-300 bg-slate-800/80 border border-slate-700/50 px-2 py-0.5 rounded-md font-mono">
                      {row.cam}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="text-xs font-bold text-slate-100 font-mono tracking-wider">{row.plate}</span>
                  </td>
                  <td className={`px-3 py-3.5 text-xs font-semibold ${VIOLATION_CLR[row.type] || 'text-slate-300'}`}>
                    {row.type}
                  </td>
                  <td className="px-3 py-3.5">
                    {/* Status pill — updates live when modal actions are taken */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${sc.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    {/* "View Evidence" button — opens the centralised EvidenceModal */}
                    <button
                      id={`view-row-${row.id}`}
                      onClick={() => onViewEvidence(row)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400
                        hover:text-indigo-200 opacity-0 group-hover:opacity-100 transition-all duration-150"
                    >
                      <ExternalLink size={11} />
                      View Evidence
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800/30">
        <p className="text-[11px] text-slate-600 font-mono">
          {safePage * PER_PAGE + 1}–{Math.min((safePage + 1) * PER_PAGE, sorted.length)} of {sorted.length}
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={safePage === 0}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                i === safePage
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/60'
              }`}>
              {i + 1}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={safePage === pages - 1}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
