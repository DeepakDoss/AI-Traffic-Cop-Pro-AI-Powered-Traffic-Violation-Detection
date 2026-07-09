import { useEffect, useState } from 'react';
import {
  X, CheckCircle2, AlertTriangle, MapPin, Clock,
  Car, Shield, Zap, Camera, Maximize2,
} from 'lucide-react';

// ─── Violation type → bounding box position/label mapping ────────────────────
// These define where the simulated AI detection box is drawn in the mock image.
const DETECTION_CONFIG = {
  'No Helmet': {
    box:   { top: '10%', left: '35%', width: '28%', height: '35%' },
    label: 'HELMET MISSING',
    color: 'red',
    zone:  'Head Region',
  },
  'Signal Jump': {
    box:   { top: '40%', left: '15%', width: '70%', height: '40%' },
    label: 'SIGNAL VIOLATION',
    color: 'amber',
    zone:  'Intersection Zone',
  },
  'Overspeeding': {
    box:   { top: '25%', left: '10%', width: '80%', height: '55%' },
    label: 'SPEED EXCEEDED',
    color: 'orange',
    zone:  'Full Vehicle',
  },
  'Triple Ride': {
    box:   { top: '8%', left: '25%', width: '50%', height: '60%' },
    label: 'TRIPLE OCCUPANCY',
    color: 'red',
    zone:  'Rider Zone',
  },
  'Wrong Lane': {
    box:   { top: '30%', left: '5%', width: '90%', height: '50%' },
    label: 'LANE VIOLATION',
    color: 'amber',
    zone:  'Lane Marker',
  },
};

const BOX_COLORS = {
  red:    { border: 'border-red-500',    text: 'text-red-400',    bg: 'bg-red-500/8',    tag: 'bg-red-600'    },
  amber:  { border: 'border-amber-400',  text: 'text-amber-400',  bg: 'bg-amber-400/8',  tag: 'bg-amber-500'  },
  orange: { border: 'border-orange-400', text: 'text-orange-400', bg: 'bg-orange-400/8', tag: 'bg-orange-500' },
};

// ─── Confidence badge colour ───────────────────────────────────────────────────
function ConfBadge({ conf }) {
  const safeConf = Number(conf || 0);
  const color = safeConf >= 95 ? 'emerald' : safeConf >= 85 ? 'amber' : 'red';
  const cls = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    amber:   'bg-amber-500/10  text-amber-400  border-amber-500/25',
    red:     'bg-red-500/10    text-red-400    border-red-500/25',
  }[color];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-bold font-mono ${cls}`}>
      <Zap size={13} />
      {safeConf.toFixed(1)}% Confidence
    </span>
  );
}

// ─── Meta row in the right column ────────────────────────────────────────────
function MetaRow({ icon: Icon, label, value, valueClass = 'text-slate-100' }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-800/60 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={13} className="text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-0.5">{label}</p>
        <p className={`text-sm font-semibold ${valueClass} font-mono truncate`}>{value}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EvidenceModal
// Props:
//   violation       – the full violation object to display
//   onClose         – close without changes
//   onFlagFalsePositive – mark as "Dismissed" and close
//   onIssueChallan  – mark as "Challan Issued" and close (triggers toast)
// ─────────────────────────────────────────────────────────────────────────────
export default function EvidenceModal({ violation, onClose, onFlagFalsePositive, onIssueChallan }) {
  if (!violation) return null;

  const detection = DETECTION_CONFIG[violation.type] || DETECTION_CONFIG['No Helmet'];
  const boxColor  = BOX_COLORS[detection.color] || BOX_COLORS.red;

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    /* ── Backdrop ──────────────────────────────────────────────────────────── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop-in"
      style={{ background: 'rgba(2, 6, 23, 0.88)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      {/* ── Modal Card ────────────────────────────────────────────────────── */}
      <div
        className="relative w-full max-w-2xl animate-modal-in overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #111827 0%, #0d1528 100%)',
          border: '1px solid rgba(51,65,85,0.6)',
          borderRadius: '18px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.08)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top gradient accent bar */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

        {/* ── Modal Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Camera size={15} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Evidence Review</h2>
              <p className="text-[10px] font-mono text-slate-600 mt-0.5">
                Case #{String(violation.id).padStart(6, '0')} · {violation.cam}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-500 hover:text-slate-200 hover:border-slate-600 transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Two-Column Body ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-0">

          {/* ── LEFT: Visual Evidence ──────────────────────────────────── */}
          <div className="p-5 border-r border-slate-800/40">
            {/* Main camera capture */}
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Camera size={9} />
              Camera Capture · {violation.cam}
            </p>

            {/* Simulated camera image */}
            <div
              className="relative w-full rounded-xl overflow-hidden border border-slate-800/60"
              style={{
                aspectRatio: '16/10',
                backgroundColor: '#040b18',
                backgroundImage: `
                  linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px),
                  radial-gradient(ellipse at 40% 40%, #0a1428 0%, transparent 100%)
                `,
                backgroundSize: '28px 28px, 28px 28px, 100% 100%',
              }}
            >
              {/* Simulated scene elements — road, vehicle silhouettes */}
              {/* Road surface */}
              <div className="absolute bottom-0 left-0 right-0 h-2/5"
                style={{ background: 'linear-gradient(to top, rgba(20,28,48,0.9), transparent)' }} />
              {/* Lane markings */}
              <div className="absolute bottom-8 left-1/2 w-0.5 h-12 bg-slate-700/40 -translate-x-1/2" />
              {/* Vehicle silhouette (two-wheeler) */}
              <div className="absolute"
                style={{ bottom: '30%', left: '38%', width: '24%', height: '38%' }}>
                <div className="w-full h-full rounded-sm bg-slate-800/60 border border-slate-700/30"
                  style={{ clipPath: 'polygon(10% 100%, 90% 100%, 80% 40%, 60% 10%, 40% 10%, 20% 40%)' }} />
              </div>

              {/* ── AI Detection Bounding Box ────────────────────────── */}
              <div
                className={`absolute border-2 ${boxColor.border} ${boxColor.bg} rounded-sm`}
                style={detection.box}
              >
                {/* Corner accents */}
                <div className={`absolute -top-px -left-px  w-2.5 h-2.5 border-t-2 border-l-2 ${boxColor.border}`} />
                <div className={`absolute -top-px -right-px w-2.5 h-2.5 border-t-2 border-r-2 ${boxColor.border}`} />
                <div className={`absolute -bottom-px -left-px  w-2.5 h-2.5 border-b-2 border-l-2 ${boxColor.border}`} />
                <div className={`absolute -bottom-px -right-px w-2.5 h-2.5 border-b-2 border-r-2 ${boxColor.border}`} />
                {/* Detection label */}
                <div className={`absolute -top-6 left-0 ${boxColor.tag} text-[9px] text-white px-2 py-0.5 rounded font-mono font-bold whitespace-nowrap`}>
                  {detection.label} · {Number(violation.conf || 0).toFixed(1)}%
                </div>
                {/* Zone label inside box */}
                <div className={`absolute bottom-1 right-1 text-[8px] font-mono ${boxColor.text} opacity-60`}>
                  {detection.zone}
                </div>
              </div>

              {/* Camera overlay info */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5">
                <span className="flex items-center gap-1 text-[9px] font-mono text-white bg-red-600/80 px-2 py-0.5 rounded border border-red-500/40">
                  <span className="w-1 h-1 rounded-full bg-white animate-pulse-dot" />
                  REC
                </span>
                <span className="text-[9px] font-mono text-slate-400 bg-slate-900/70 border border-slate-800 px-1.5 py-0.5 rounded">
                  {violation.ts}
                </span>
              </div>
              <div className="absolute bottom-2 right-2 text-[8px] font-mono text-slate-600">
                AI INFERENCE ACTIVE · YOLO v8
              </div>
            </div>

            {/* ── OCR Plate Capture (zoomed crop) ─────────────────────── */}
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-4 mb-2 flex items-center gap-1.5">
              <Maximize2 size={9} />
              OCR Plate Capture
            </p>
            <div
              className="relative w-full rounded-xl border border-amber-500/20 overflow-hidden"
              style={{
                height: '72px',
                background: 'radial-gradient(ellipse at center, #0f1e10, #04100a)',
              }}
            >
              {/* Plate rectangle */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="px-6 py-2 rounded-md border-2 border-amber-400/70 bg-amber-400/5"
                  style={{ letterSpacing: '0.35em' }}>
                  <span className="text-xl font-black text-amber-300 font-mono tracking-widest">
                    {violation.plate}
                  </span>
                </div>
              </div>
              {/* Scan lines */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px)' }} />
              {/* Corner crosshairs */}
              {['top-1 left-1', 'top-1 right-1', 'bottom-1 left-1', 'bottom-1 right-1'].map((pos, i) => (
                <div key={i} className={`absolute ${pos} w-3 h-3 border-amber-500/60 ${
                  i === 0 ? 'border-t border-l' : i === 1 ? 'border-t border-r' :
                  i === 2 ? 'border-b border-l' : 'border-b border-r'
                }`} />
              ))}
              <div className="absolute top-1 right-2 text-[8px] font-mono text-amber-700">ANPR v3 · MATCH 99.1%</div>
            </div>
          </div>

          {/* ── RIGHT: Metadata & Verification ────────────────────────── */}
          <div className="p-5 flex flex-col gap-0">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Shield size={9} />
              Violation Details
            </p>

            {/* Confidence badge — prominent at top */}
            <div className="mb-4">
              <ConfBadge conf={violation.conf} />
            </div>

            {/* Structured metadata rows */}
            <div className="flex-1">
              <MetaRow icon={Clock}         label="Timestamp"    value={violation.ts} />
              <MetaRow icon={MapPin}        label="Location"     value={violation.location  || '—'} />
              <MetaRow icon={Car}           label="Vehicle Type" value={violation.vehicle   || '—'} />
              <MetaRow icon={Camera}        label="Camera"       value={violation.cam} />
              <MetaRow
                icon={AlertTriangle}
                label="Violation Type"
                value={violation.type}
                valueClass={
                  violation.type === 'No Helmet'    ? 'text-red-300'    :
                  violation.type === 'Signal Jump'  ? 'text-orange-300' :
                  violation.type === 'Overspeeding' ? 'text-amber-300'  :
                  violation.type === 'Triple Ride'  ? 'text-rose-300'   :
                  'text-yellow-300'
                }
              />
              <MetaRow
                icon={Zap}
                label="Detected Plate"
                value={violation.plate}
                valueClass="text-amber-300 tracking-widest"
              />
              {violation.fine && (
                <MetaRow
                  icon={CheckCircle2}
                  label="Fine Amount"
                  value={`₹${violation.fine.toLocaleString('en-IN')}`}
                  valueClass="text-emerald-300"
                />
              )}
            </div>

            {/* Current status pill */}
            <div className="mt-3 pt-3 border-t border-slate-800/40">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Current Status</p>
              <span className="text-xs font-bold text-slate-400 bg-slate-800/60 border border-slate-700/50 px-2.5 py-1 rounded-full">
                {violation.status}
              </span>
            </div>
          </div>
        </div>

        {/* ── Action Buttons ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-800/60"
          style={{ background: 'rgba(2,6,23,0.4)' }}>

          {/* 1. Dismiss / Close — neutral */}
          <button
            id="modal-close-btn"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-slate-400 border border-slate-700/60 text-sm font-semibold
              hover:border-slate-600 hover:text-slate-200 transition-all duration-150 active:scale-95"
          >
            Dismiss
          </button>

          {/* 2. Flag False Positive — subtle red/transparent */}
          <button
            id="modal-false-positive-btn"
            onClick={onFlagFalsePositive}
            className="flex-1 py-2.5 rounded-xl text-red-400 border border-red-500/25 bg-red-500/5 text-sm font-semibold
              hover:bg-red-500/12 hover:border-red-500/50 transition-all duration-150 active:scale-95 flex items-center justify-center gap-2"
          >
            <AlertTriangle size={14} />
            Flag False Positive
          </button>

          {/* 3. Issue Digital Challan — solid indigo primary */}
          <button
            id="modal-issue-challan-btn"
            onClick={onIssueChallan}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold
              transition-all duration-150 active:scale-95 flex items-center justify-center gap-2
              hover:opacity-90 shadow-lg shadow-indigo-900/40"
            style={{ background: 'linear-gradient(135deg, #4338ca, #6366f1)' }}
          >
            <CheckCircle2 size={14} />
            Issue Digital Challan
          </button>
        </div>
      </div>
    </div>
  );
}
