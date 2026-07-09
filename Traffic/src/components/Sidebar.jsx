import {
  MonitorPlay, Search, BarChart2, FileText,
  Camera, Settings, LogOut, ShieldCheck, ChevronRight,
  Radio, Zap,
} from 'lucide-react';
import { NAV_ITEMS } from '../data/mockData';

const ICON_MAP = { MonitorPlay, Search, BarChart2, FileText, Camera, Settings };
const NAV_GROUPS = ['Operations', 'Intelligence', 'Infrastructure', 'System'];

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar-mesh flex flex-col w-64 shrink-0 h-screen sticky top-0 overflow-hidden border-r border-indigo-900/20">
      {/* Logo */}
      <div className="flex items-center gap-3.5 px-5 py-5 border-b border-indigo-900/20">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-lg shadow-indigo-900/50">
          <ShieldCheck size={20} className="text-white" />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent" />
        </div>
        <div>
          <p className="text-sm font-bold text-white tracking-tight leading-none">AI Traffic Cop</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] font-semibold text-indigo-400 tracking-widest uppercase leading-none">Pro</span>
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse-dot" />
              <span className="text-[9px] font-bold text-emerald-400 leading-none">LIVE</span>
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-5">
        {NAV_GROUPS.map((group) => {
          const items = NAV_ITEMS.filter((i) => i.group === group);
          if (!items.length) return null;
          return (
            <div key={group}>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-2">{group}</p>
              {items.map((item) => {
                const Icon = ICON_MAP[item.icon];
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all duration-200 group relative overflow-hidden ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-500 hover:text-slate-200'
                    }`}
                  >
                    {/* Active background */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/90 to-indigo-700/80 rounded-xl" />
                    )}
                    {!isActive && (
                      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800/50" />
                    )}

                    {/* Active left bar */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white/60 rounded-full" />
                    )}

                    <div className="relative z-10 flex items-center gap-3 w-full">
                      {Icon && (
                        <Icon size={16} className={isActive ? 'text-white' : 'text-slate-600 group-hover:text-slate-300 transition-colors'} />
                      )}
                      <span className="flex-1 text-left">{item.label}</span>
                      {isActive && <ChevronRight size={13} className="text-white/50" />}
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* System Health Mini Widget */}
      <div className="mx-3 mb-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">System Health</span>
          <Zap size={11} className="text-amber-400" />
        </div>
        <div className="space-y-1.5">
          {[
            { label: 'AI Engine', val: 96, color: 'bg-emerald-500' },
            { label: 'Cameras', val: 86, color: 'bg-indigo-500' },
            { label: 'Storage', val: 71, color: 'bg-amber-500' },
          ].map(({ label, val, color }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-slate-500">{label}</span>
                <span className="text-[10px] font-mono text-slate-400">{val}%</span>
              </div>
              <div className="h-0.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full`} style={{ width: `${val}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Profile */}
      <div className="border-t border-indigo-900/20 p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-800/40 transition-colors cursor-pointer group">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/30 to-indigo-600/20 border border-indigo-500/30 shrink-0">
            <span className="text-xs font-bold text-indigo-300">OP</span>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">Operator Admin</p>
            <p className="text-[10px] text-slate-500 truncate">Mumbai Authority</p>
          </div>
          <LogOut size={13} className="text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
        </div>
      </div>
    </aside>
  );
}
