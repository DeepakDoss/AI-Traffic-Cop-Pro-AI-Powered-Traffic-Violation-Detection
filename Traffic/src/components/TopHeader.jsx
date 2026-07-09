import { Search, Download, ChevronRight, Bell, Wifi, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function TopHeader({ activePage }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const breadcrumbMap = {
    monitoring: ['Monitoring', 'Live Feed'],
    forensics:  ['Forensics', 'Evidence Search'],
    analytics:  ['Analytics', 'Overview'],
    reports:    ['Reports', 'Generate Report'],
    cameras:    ['Infrastructure', 'Camera Grid'],
    settings:   ['System', 'Settings'],
  };

  const crumbs = breadcrumbMap[activePage] || ['Monitoring', 'Live Feed'];

  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <header
      className="flex items-center gap-4 px-6 py-3 border-b border-indigo-900/20 sticky top-0 z-40 shrink-0"
      style={{
        background: 'linear-gradient(90deg, #080f1e 0%, #0a1020 100%)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
        <span className="text-slate-600 text-xs font-medium">ATC Pro</span>
        <ChevronRight size={12} className="text-slate-700 shrink-0" />
        {crumbs.map((crumb, idx) => (
          <span key={idx} className="flex items-center gap-1.5">
            {idx > 0 && <ChevronRight size={12} className="text-slate-700 shrink-0" />}
            <span className={idx === crumbs.length - 1 ? 'text-slate-100 font-semibold text-sm' : 'text-slate-500 text-xs font-medium'}>
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      {/* Live clock */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
        <Clock size={12} className="text-indigo-400 shrink-0" />
        <span className="text-xs font-mono text-slate-300">{timeStr}</span>
        <span className="text-slate-700">|</span>
        <span className="text-[11px] text-slate-500">{dateStr}</span>
      </div>

      {/* System Status */}
      <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/30">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot shrink-0" />
        <Wifi size={11} className="text-emerald-500 shrink-0" />
        <span className="text-[11px] font-semibold text-emerald-400">All Systems Nominal</span>
      </div>

      {/* Search */}
      <div className="relative hidden lg:block">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
        <input
          id="header-search"
          type="text"
          placeholder="Search plate, incident ID..."
          className="pl-9 pr-4 py-2 text-xs bg-slate-900/80 border border-slate-800 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-600/50 transition-all w-52"
        />
      </div>

      {/* Notification Bell */}
      <button
        id="notifications-btn"
        className="relative p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition-all"
      >
        <Bell size={15} className="text-slate-400" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
      </button>

      {/* Export Button */}
      <button
        id="export-pdf-btn"
        className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-white text-xs font-semibold transition-all active:scale-95 overflow-hidden group"
        style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Download size={13} />
        <span className="hidden sm:inline">Export PDF Report</span>
      </button>
    </header>
  );
}
