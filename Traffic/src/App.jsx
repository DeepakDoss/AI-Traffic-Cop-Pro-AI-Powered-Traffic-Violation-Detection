import { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import MetricsRow from './components/MetricsRow';
import VideoPanel from './components/VideoPanel';
import AlertStream from './components/AlertStream';
import EvidenceTable from './components/EvidenceTable';
import EvidenceModal from './components/EvidenceModal';
import ToastContainer from './components/ToastContainer';
import { INITIAL_KPI } from './data/mockData';

// ─── Placeholder pages ───────────────────────────────────────────────────────
function PlaceholderPage({ title, subtitle, emoji = '🚧' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] text-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center mb-5 shadow-2xl animate-float">
        <span className="text-3xl">{emoji}</span>
      </div>
      <h2 className="text-lg font-bold text-slate-200 mb-2">{title}</h2>
      <p className="text-sm text-slate-500 max-w-sm leading-relaxed">{subtitle}</p>
      <div className="mt-6 px-4 py-2 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-xs text-indigo-400 font-semibold">
        Coming Soon · Under Development
      </div>
    </div>
  );
}

// ─── Monitoring Page ─────────────────────────────────────────────────────────
// Receives all state as props from App — no state lives inside this component.
function MonitoringPage({ kpi, violations, latestId, onViewEvidence, onDetections, videoStats, backendReady, addToast }) {
  return (
    <div className="flex flex-col gap-5">
      <MetricsRow kpi={kpi} />
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_330px] gap-5">
        {/* stats prop drives the real-data mini-row inside VideoPanel */}
        <VideoPanel 
          onDetections={onDetections} 
          stats={videoStats} 
          backendReady={backendReady}
          addToast={addToast}
        />
        <AlertStream
          violations={violations}
          latestId={latestId}
          onViewEvidence={onViewEvidence}
        />
      </div>
      <EvidenceTable
        violations={violations}
        onViewEvidence={onViewEvidence}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root App
//
// IMPORTANT: All KPI counters and violation lists start at ZERO.
// No random data is ever injected — the only source of truth is the
// real FastAPI backend at POST /api/upload-video.
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [activePage, setActivePage] = useState('monitoring');
  const [backendReady, setBackendReady] = useState(false);

  useEffect(() => {
    let intervalId;
    const checkHealth = async () => {
      try {
        const res = await fetch('/health');
        if (res.ok) {
          const data = await res.json();
          if (data.model_loaded) {
            setBackendReady(true);
            clearInterval(intervalId);
          }
        }
      } catch (err) {
        // Backend not ready or unreachable
      }
    };
    checkHealth();
    intervalId = setInterval(checkHealth, 2000);
    return () => clearInterval(intervalId);
  }, []);

  // ── Violations (empty until backend responds) ──────────────────────────────
  const [violations, setViolations] = useState([]);
  const [latestId, setLatestId]     = useState(null);

  // ── KPI counters (all zero on load — increment only from real detections) ──
  const [kpi, setKpi] = useState({
    totalVehicles:      INITIAL_KPI.totalVehicles,     // 0
    activeViolations:   INITIAL_KPI.activeViolations,  // 0
    finesGenerated:     INITIAL_KPI.finesGenerated,    // 0
    newViolationsToday: 0,
    newFinesTotal:      0,
  });

  // ── Video panel stats: real cumulative values from API responses ───────────
  // totalDetections = total objects detected (passed as batchCount from VideoPanel)
  // totalViolations = subset that were flagged as violations
  // avgConfidence   = rolling weighted average confidence score across all batches
  const [videoStats, setVideoStats] = useState({
    totalDetections: 0,
    totalViolations: 0,
    avgConfidence:   null, // null → displayed as "—" until first upload
  });

  // ── Modal state ────────────────────────────────────────────────────────────
  const [selectedViolation, setSelectedViolation] = useState(null);
  const isModalOpen = selectedViolation !== null;

  // ── Toast queue ────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', sub = '') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, sub }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Modal open / close ─────────────────────────────────────────────────────
  const openModal  = useCallback((violation) => setSelectedViolation(violation), []);
  const closeModal = useCallback(() => setSelectedViolation(null), []);

  // ── Status update (called by modal action buttons) ─────────────────────────
  const updateViolationStatus = useCallback((id, newStatus) => {
    setViolations(prev =>
      prev.map(v => v.id === id ? { ...v, status: newStatus } : v)
    );
  }, []);

  // ── Handle: Flag as False Positive ────────────────────────────────────────
  const handleFlagFalsePositive = useCallback(() => {
    if (!selectedViolation) return;
    updateViolationStatus(selectedViolation.id, 'Dismissed');
    addToast(
      `Violation for ${selectedViolation.plate} marked as false positive`,
      'error',
      `Case #${String(selectedViolation.id).padStart(6, '0')} · ${selectedViolation.cam}`
    );
    closeModal();
  }, [selectedViolation, updateViolationStatus, addToast, closeModal]);

  // ── Handle: Issue Digital Challan ─────────────────────────────────────────
  const handleIssueChallan = useCallback(() => {
    if (!selectedViolation) return;
    updateViolationStatus(selectedViolation.id, 'Challan Issued');
    addToast(
      `Digital Challan Auto-Generated for ${selectedViolation.plate}`,
      'success',
      `₹${selectedViolation.fine?.toLocaleString('en-IN') ?? '—'} · ${selectedViolation.type} · ${selectedViolation.cam}`
    );
    closeModal();
  }, [selectedViolation, updateViolationStatus, addToast, closeModal]);

  // ── Handle: Real API detections from VideoPanel ────────────────────────────
  // Called by VideoPanel's UploadView after POST /api/upload-video succeeds.
  //
  // Parameters:
  //   newViolations – array of violation objects mapped from backend response
  //   batchCount    – total raw objects detected in the video (may be > violations)
  const handleApiDetections = useCallback((newViolations, batchCount = 0) => {
    if (!newViolations?.length && batchCount === 0) return;

    // 1. Prepend real violations to the shared stream (cap at 50 entries)
    if (newViolations?.length) {
      setViolations(prev => [...newViolations, ...prev].slice(0, 50));
      setLatestId(newViolations[0].id);
      setTimeout(() => setLatestId(null), 2500);
    }

    // 2. Increment KPI counters using actual data from the backend
    const totalFine = newViolations.reduce((s, v) => s + (v.fine ?? 0), 0);
    setKpi(prev => ({
      ...prev,
      // totalVehicles = total detected objects (vehicles seen, not just violations)
      totalVehicles:      prev.totalVehicles + (batchCount || newViolations.length),
      activeViolations:   prev.activeViolations + newViolations.length,
      finesGenerated:     prev.finesGenerated + totalFine,
      newViolationsToday: prev.newViolationsToday + newViolations.length,
      newFinesTotal:      prev.newFinesTotal + totalFine,
    }));

    // 3. Update the VideoPanel stats row with real cumulative numbers
    setVideoStats(prev => {
      const newTotalDet  = prev.totalDetections + (batchCount || newViolations.length);
      const newTotalViol = prev.totalViolations + newViolations.length;
      // Rolling weighted average confidence across all processed batches
      const batchAvgConf = newViolations.length
        ? newViolations.reduce((s, v) => s + v.conf, 0) / newViolations.length
        : null;
      const newAvgConf = (prev.avgConfidence === null || batchAvgConf === null)
        ? (batchAvgConf ?? prev.avgConfidence)
        : (prev.avgConfidence * prev.totalViolations + batchAvgConf * newViolations.length)
          / newTotalViol;
      return { totalDetections: newTotalDet, totalViolations: newTotalViol, avgConfidence: newAvgConf };
    });

    // 4. Fire a success toast with actual numbers
    if (newViolations?.length) {
      addToast(
        `${newViolations.length} violation${newViolations.length !== 1 ? 's' : ''} detected by AI`,
        'success',
        `Evidence added · Fines: ₹${totalFine.toLocaleString('en-IN')}`
      );
    } else {
      addToast('No violations detected in this footage', 'warning', 'Footage processed successfully');
    }
  }, [addToast]);

  // ── Page map ───────────────────────────────────────────────────────────────
  const pageContent = {
    monitoring: (
      <MonitoringPage
        kpi={kpi}
        violations={violations}
        latestId={latestId}
        onViewEvidence={openModal}
        onDetections={handleApiDetections}
        videoStats={videoStats}
        backendReady={backendReady}
        addToast={addToast}
      />
    ),
    forensics: <PlaceholderPage emoji="🔍" title="Forensics Search" subtitle="Search and correlate evidence across all cameras and time ranges with AI-assisted lookup." />,
    analytics:  <PlaceholderPage emoji="📊" title="Analytics Dashboard" subtitle="Violation heatmaps, trend analysis, and predictive AI insights." />,
    reports:    <PlaceholderPage emoji="📄" title="Report Generator" subtitle="Generate exportable PDF/CSV compliance and violation reports." />,
    cameras:    <PlaceholderPage emoji="📷" title="Camera Infrastructure" subtitle="Manage, configure, and monitor all connected camera nodes across junctions." />,
    settings:   <PlaceholderPage emoji="⚙️" title="System Settings" subtitle="Configure AI detection thresholds, notification rules, and system integrations." />,
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#020617' }}>
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 60%)' }} />

      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <div className="relative z-10 flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopHeader activePage={activePage} />

        <main className="flex-1 overflow-y-auto px-6 py-5">
          <div className="max-w-screen-2xl mx-auto">
            {pageContent[activePage]}
          </div>
        </main>

        <footer className="status-bar flex items-center justify-between px-6 py-2 shrink-0">
          <div className="flex items-center gap-4 text-[10px] font-mono text-slate-700">
            <span className="text-slate-600">v2.4.1-prod</span>
            <span className="text-slate-800">·</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-500" />
              <span className="text-emerald-700">7/7 cameras operational</span>
            </span>
            <span className="text-slate-800">·</span>
            <span className="text-slate-600">YOLOv8n-traffic · ANPR v3 · GPU: 72°C</span>
          </div>
          <div className="text-[10px] font-mono text-slate-700">Mumbai Traffic Authority © 2026</div>
        </footer>
      </div>

      {/* Evidence Review Modal — rendered at root so it overlays everything */}
      {isModalOpen && (
        <EvidenceModal
          violation={selectedViolation}
          onClose={closeModal}
          onFlagFalsePositive={handleFlagFalsePositive}
          onIssueChallan={handleIssueChallan}
        />
      )}

      {/* Toast Notification Queue — fixed top-right */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
