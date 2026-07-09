import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, X, Zap } from 'lucide-react';

// ─── Toast type config ────────────────────────────────────────────────────────
const TOAST_STYLES = {
  success: {
    icon:       CheckCircle2,
    iconClass:  'text-emerald-400',
    iconBg:     'bg-emerald-500/10 border-emerald-500/20',
    border:     'border-emerald-500/20',
    bar:        'bg-emerald-500',
    label:      'Success',
    labelClass: 'text-emerald-400',
  },
  warning: {
    icon:       AlertTriangle,
    iconClass:  'text-amber-400',
    iconBg:     'bg-amber-500/10 border-amber-500/20',
    border:     'border-amber-500/20',
    bar:        'bg-amber-500',
    label:      'Warning',
    labelClass: 'text-amber-400',
  },
  error: {
    icon:       AlertTriangle,
    iconClass:  'text-red-400',
    iconBg:     'bg-red-500/10 border-red-500/20',
    border:     'border-red-500/20',
    bar:        'bg-red-500',
    label:      'Dismissed',
    labelClass: 'text-red-400',
  },
};

// ─── Duration the toast stays visible before auto-dismissing ─────────────────
const TOAST_DURATION = 4000; // ms

// ─────────────────────────────────────────────────────────────────────────────
// ToastItem: a single notification card.
// `exiting` prop is set true ~300ms before removal to trigger the slide-out.
// ─────────────────────────────────────────────────────────────────────────────
function ToastItem({ toast, onDismiss }) {
  const [exiting, setExiting]     = useState(false);
  const [progress, setProgress]   = useState(100); // progress bar %
  const cfg = TOAST_STYLES[toast.type] || TOAST_STYLES.success;
  const Icon = cfg.icon;

  useEffect(() => {
    // Shrink the progress bar smoothly over TOAST_DURATION ms
    const startTime = Date.now();
    const rafId = { current: null };

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100);
      setProgress(pct);
      if (pct > 0) {
        rafId.current = requestAnimationFrame(tick);
      }
    };
    rafId.current = requestAnimationFrame(tick);

    // Trigger exit animation 300ms before the timeout fires
    const exitTimer   = setTimeout(() => setExiting(true), TOAST_DURATION - 300);
    const removeTimer = setTimeout(() => onDismiss(toast.id), TOAST_DURATION);

    return () => {
      cancelAnimationFrame(rafId.current);
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [toast.id, onDismiss]);

  const handleManualDismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      className={`relative flex items-start gap-3 w-80 rounded-xl overflow-hidden border
        ${cfg.border}
        ${exiting ? 'toast-exit' : 'toast-enter'}`}
      style={{
        background: 'linear-gradient(135deg, #0f1e35 0%, #0a1220 100%)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.06)',
      }}
    >
      {/* Progress bar — drains left-to-right over TOAST_DURATION */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-800">
        <div
          className={`h-full ${cfg.bar} transition-none rounded-full`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Icon */}
      <div className={`mt-4 ml-4 shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center ${cfg.iconBg}`}>
        <Icon size={15} className={cfg.iconClass} />
      </div>

      {/* Text */}
      <div className="flex-1 py-4 pr-2 min-w-0">
        <p className={`text-[11px] font-bold uppercase tracking-widest ${cfg.labelClass} mb-0.5`}>
          {cfg.label}
        </p>
        <p className="text-xs text-slate-300 font-medium leading-relaxed">
          {toast.message}
        </p>
        {toast.sub && (
          <p className="text-[10px] text-slate-600 font-mono mt-1">{toast.sub}</p>
        )}
      </div>

      {/* Manual close */}
      <button
        onClick={handleManualDismiss}
        className="mt-3.5 mr-3 p-1 rounded-md text-slate-600 hover:text-slate-300 hover:bg-slate-700/50 transition-colors shrink-0"
      >
        <X size={12} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ToastContainer: fixed top-right portal.
// Receives `toasts` array and `onDismiss` callback from App.jsx.
// ─────────────────────────────────────────────────────────────────────────────
export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
