import React, { useContext, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// ─── Status helpers ─────────────────────────────────────────────────────────

const PROJECT_STATUS_LABELS = {
  SCHEDULED: 'Scheduled',
  INSTALLATION_STARTED: 'Installation Started',
  WORK_IN_PROGRESS: 'Work in Progress',
  HALFWAY_COMPLETED: 'Halfway Completed',
  INSTALLATION_COMPLETED: 'Installation Completed',
};

const TICKET_STATUS_LABELS = {
  OPEN: 'Open',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  SUCCESSFULLY_RESOLVED: 'Successfully Resolved',
};

const TICKET_STATUS_COLORS = {
  OPEN:                  { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444', border: 'rgba(239,68,68,0.25)' },
  ASSIGNED:              { bg: 'rgba(99,102,241,0.1)',  color: '#6366f1', border: 'rgba(99,102,241,0.25)' },
  IN_PROGRESS:           { bg: 'rgba(245,158,11,0.1)',  color: '#d97706', border: 'rgba(245,158,11,0.25)' },
  RESOLVED:              { bg: 'rgba(59,130,246,0.1)',  color: '#2563eb', border: 'rgba(59,130,246,0.25)' },
  SUCCESSFULLY_RESOLVED: { bg: 'rgba(16,185,129,0.1)',  color: '#059669', border: 'rgba(16,185,129,0.25)' },
};

// ─── Print CSS injected at runtime ───────────────────────────────────────────
const PRINT_STYLE = `
@media print {
  body { background: white !important; color: #0f172a !important; }
  .no-print { display: none !important; }
  .report-root { background: white !important; padding: 0 !important; }
  .report-card {
    background: white !important;
    border: 1px solid #e2e8f0 !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
    break-inside: avoid;
  }
  .report-header-band {
    background: linear-gradient(135deg, #FFB100, #E09C00) !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .section-title { color: #0f172a !important; border-color: #e2e8f0 !important; }
  .data-value { color: #0f172a !important; }
  .data-label { color: #64748b !important; }
  .badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .timeline-dot { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .kpi-chip { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function ReportCard({ icon, title, children, accent = '#10b981', animDelay = '0ms' }) {
  return (
    <div className="report-card" style={{
      background: '#ffffff',
      border: '1px solid #f1f5f9',
      borderRadius: '18px',
      padding: '1.75rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
      animation: `fadeUp 0.4s ease both`,
      animationDelay: animDelay,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* subtle top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${accent}, ${accent}80)`, borderRadius: '18px 18px 0 0' }} />
      <h3 className="section-title" style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        fontSize: '0.95rem', fontWeight: '700',
        marginBottom: '1.25rem', marginTop: '0.25rem',
        paddingBottom: '0.85rem',
        borderBottom: '1px solid #f1f5f9',
        color: '#0f172a',
      }}>
        <span style={{ fontSize: '1.05rem' }}>{icon}</span>
        <span>{title}</span>
      </h3>
      {children}
    </div>
  );
}

function DataRow({ label, value, wrap }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <p className="data-label" style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: '0.2rem' }}>
        {label}
      </p>
      {typeof value === 'string' || typeof value === 'number' ? (
        <p className="data-value" style={{ fontSize: '0.9rem', color: '#1e293b', wordBreak: wrap ? 'break-word' : 'normal', fontWeight: '500', margin: 0 }}>
          {value || '—'}
        </p>
      ) : (
        <div className="data-value">{value || <span style={{ color: '#94a3b8' }}>—</span>}</div>
      )}
    </div>
  );
}

function InfoChip({ label, value, accent = '#6366f1' }) {
  return (
    <div className="kpi-chip" style={{
      background: `${accent}0D`,
      border: `1px solid ${accent}25`,
      borderRadius: '12px',
      padding: '0.9rem 1.15rem',
    }}>
      <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: '0.3rem' }}>{label}</div>
      <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a' }}>{value}</div>
    </div>
  );
}

// ─── Solar house illustration ────────────────────────────────────────────────
const HeroIllustration = () => (
  <svg width="190" height="130" viewBox="0 0 190 130" fill="none" style={{ flexShrink: 0 }}>
    <ellipse cx="95" cy="120" rx="80" ry="8" fill="rgba(255,177,0,0.15)" />
    {/* Ground */}
    <rect x="10" y="112" width="170" height="3" rx="1.5" fill="#fbbf24" opacity="0.4" />
    {/* House body */}
    <rect x="42" y="68" width="88" height="50" rx="5" fill="white" stroke="#e2e8f0" strokeWidth="1.5" />
    {/* Door */}
    <rect x="73" y="88" width="22" height="30" rx="3" fill="#FFB100" opacity="0.85" />
    <circle cx="92" cy="104" r="2" fill="white" />
    {/* Windows */}
    <rect x="48" y="75" width="18" height="16" rx="2" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1" />
    <line x1="57" y1="75" x2="57" y2="91" stroke="#93c5fd" strokeWidth="0.8" />
    <line x1="48" y1="83" x2="66" y2="83" stroke="#93c5fd" strokeWidth="0.8" />
    <rect x="104" y="75" width="18" height="16" rx="2" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1" />
    <line x1="113" y1="75" x2="113" y2="91" stroke="#93c5fd" strokeWidth="0.8" />
    <line x1="104" y1="83" x2="122" y2="83" stroke="#93c5fd" strokeWidth="0.8" />
    {/* Roof */}
    <polygon points="34,68 95,28 156,68" fill="#FFB100" opacity="0.95" />
    <polygon points="36,68 95,30 154,68" fill="#fcd34d" opacity="0.45" />
    {/* Chimney */}
    <rect x="122" y="40" width="12" height="20" rx="2" fill="#9ca3af" />
    <rect x="119" y="36" width="18" height="6" rx="2" fill="#9ca3af" />
    {/* Solar panels */}
    <rect x="55" y="50" width="28" height="14" rx="1.5" fill="#1e40af" stroke="#3b82f6" strokeWidth="1" opacity="0.9" />
    <line x1="55" y1="57" x2="83" y2="57" stroke="#60a5fa" strokeWidth="0.7" />
    <line x1="69" y1="50" x2="69" y2="64" stroke="#60a5fa" strokeWidth="0.7" />
    <rect x="86" y="45" width="28" height="14" rx="1.5" fill="#1e40af" stroke="#3b82f6" strokeWidth="1" opacity="0.9" />
    <line x1="86" y1="52" x2="114" y2="52" stroke="#60a5fa" strokeWidth="0.7" />
    <line x1="100" y1="45" x2="100" y2="59" stroke="#60a5fa" strokeWidth="0.7" />
    {/* Sun */}
    <circle cx="158" cy="25" r="14" fill="#fbbf24" />
    <circle cx="158" cy="25" r="10" fill="#fcd34d" />
    {['0,14', '0,-14', '14,0', '-14,0', '10,10', '-10,10', '10,-10', '-10,-10'].map((offset, i) => {
      const [dx, dy] = offset.split(',').map(Number);
      const angle = Math.atan2(dy, dx);
      return (
        <line key={i}
          x1={158 + Math.cos(angle) * 17} y1={25 + Math.sin(angle) * 17}
          x2={158 + Math.cos(angle) * 21} y2={25 + Math.sin(angle) * 21}
          stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
      );
    })}
    {/* Energy lines */}
    <path d="M80 50 Q72 38 68 28" stroke="#fbbf24" strokeWidth="1.2" strokeDasharray="3,3" opacity="0.5" />
    <path d="M100 45 Q108 32 118 22" stroke="#fbbf24" strokeWidth="1.2" strokeDasharray="3,3" opacity="0.5" />
    {/* Trees */}
    <rect x="16" y="95" width="7" height="17" rx="2" fill="#9ca3af" />
    <circle cx="19.5" cy="90" r="14" fill="#4ade80" opacity="0.8" />
    <circle cx="19.5" cy="90" r="9" fill="#16a34a" opacity="0.5" />
    <rect x="162" y="98" width="7" height="14" rx="2" fill="#9ca3af" />
    <circle cx="165.5" cy="93" r="12" fill="#4ade80" opacity="0.8" />
    {/* Lightning bolt for energy */}
    <polygon points="150,44 145,54 149,54 144,66 154,50 150,50" fill="#fbbf24" opacity="0.7" />
  </svg>
);

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProjectReport() {
  const { projectId } = useParams();
  const { api } = useContext(AuthContext);
  const navigate = useNavigate();
  const printRef = useRef();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = PRINT_STYLE;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get(`projects/${projectId}/report/`);
        setReport(res.data);
      } catch (err) {
        setError('Failed to load project report. The project may not be completed yet.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [api, projectId]);

  const handlePrint = () => window.print();

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', background: '#f8fafc' }}>
      <div style={{ width: '44px', height: '44px', border: '3px solid #e2e8f0', borderTopColor: '#FFB100', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>Generating report…</p>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem', padding: '2rem', textAlign: 'center', background: '#f8fafc' }}>
      <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>⚠️</div>
      <div>
        <h2 style={{ color: '#ef4444', marginBottom: '0.5rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Report Unavailable</h2>
        <p style={{ color: '#64748b', maxWidth: '420px', fontSize: '0.9rem' }}>{error}</p>
      </div>
      <button onClick={() => navigate('/dashboard')} style={{ padding: '10px 24px', background: '#FFB100', border: 'none', borderRadius: '10px', fontWeight: '700', color: '#111', cursor: 'pointer', fontSize: '0.9rem' }}>← Back to Dashboard</button>
    </div>
  );

  const { project, customer, lead, quotation, sales_executive, technician, invoice, tickets } = report;
  const generatedAt = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });
  const projectDate = project?.created_at ? new Date(project.created_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  const statusOrder = ['SCHEDULED', 'INSTALLATION_STARTED', 'WORK_IN_PROGRESS', 'HALFWAY_COMPLETED', 'INSTALLATION_COMPLETED'];
  const currentStatusIdx = statusOrder.indexOf(project?.status);

  const timelineSteps = [
    { key: 'SCHEDULED',             label: 'Scheduled',  shortLabel: 'Scheduled'   },
    { key: 'INSTALLATION_STARTED',  label: 'Started',    shortLabel: 'In Progress' },
    { key: 'WORK_IN_PROGRESS',      label: 'In Progress',shortLabel: 'In Progress' },
    { key: 'HALFWAY_COMPLETED',     label: 'Halfway',    shortLabel: 'Installed'   },
    { key: 'INSTALLATION_COMPLETED',label: 'Completed',  shortLabel: 'Completed'   },
  ];

  return (
    <div className="report-root" style={{ minHeight: '100vh', background: '#f1f5f9', padding: '2rem 1rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Action Bar (no-print) ── */}
      <div className="no-print" style={{ maxWidth: '920px', margin: '0 auto 1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '9px 18px', background: '#ffffff', border: '1px solid #e2e8f0',
            borderRadius: '10px', fontWeight: '600', color: '#475569', fontSize: '0.85rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
            transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#ffffff'; }}
        >
          ← Dashboard
        </button>
        <button
          onClick={handlePrint}
          style={{
            padding: '9px 20px', background: 'linear-gradient(135deg, #FFB100, #E09C00)',
            border: 'none', borderRadius: '10px', fontWeight: '700', color: '#111',
            fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center',
            gap: '0.45rem', boxShadow: '0 2px 8px rgba(255,177,0,0.3)', transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,177,0,0.45)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(255,177,0,0.3)'}
        >
          🖨️ Print / Save PDF
        </button>
        <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginLeft: 'auto', fontStyle: 'italic' }}>
          Generated: {generatedAt}
        </span>
      </div>

      {/* ── Report Document ── */}
      <div ref={printRef} style={{ maxWidth: '920px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── HEADER BANNER ── */}
        <div className="report-header-band" style={{
          background: 'linear-gradient(130deg, #FFB100 0%, #f59e0b 60%, #fcd34d 100%)',
          borderRadius: '20px',
          padding: '0',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(255,177,0,0.25)',
          position: 'relative',
        }}>
          {/* decorative circles */}
          <div style={{ position: 'absolute', right: '-60px', top: '-60px', width: '240px', height: '240px', background: 'rgba(255,255,255,0.12)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', right: '40px', top: '20px', width: '140px', height: '140px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', left: '0', bottom: '0', width: '120px', height: '60px', background: 'rgba(0,0,0,0.05)', borderRadius: '0 60px 0 20px' }} />

          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '2rem 2.5rem' }}>

            {/* Left: branding + title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
              <HeroIllustration />
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: '800', letterSpacing: '2.5px', color: 'rgba(0,0,0,0.55)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  SOLAR ERP SYSTEM
                </div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 0.3rem', color: '#111', fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.1 }}>
                  Project Completion Report
                </h1>
                <p style={{ fontSize: '0.9rem', color: 'rgba(0,0,0,0.6)', margin: 0, fontWeight: '500' }}>
                  Project ID: &nbsp;<strong style={{ color: '#111' }}>3</strong>
                  &nbsp;·&nbsp; {lead?.name || customer?.username}
                </p>
              </div>
            </div>

            {/* Right: status badge + date */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(4px)',
                borderRadius: '999px', padding: '7px 16px',
                fontSize: '0.8rem', fontWeight: '700', color: '#111',
                border: '1px solid rgba(0,0,0,0.1)',
              }}>
                ✅ INSTALLATION COMPLETED
              </div>
              <p style={{ fontSize: '0.8rem', color: 'rgba(0,0,0,0.55)', marginTop: '0.5rem', fontWeight: '500' }}>
                Initiated: {projectDate}
              </p>
            </div>
          </div>
        </div>

        {/* ── GRID: Customer + Lead ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>

          {/* Customer Details */}
          <ReportCard icon="👤" title="Customer Details" accent="#6366f1" animDelay="50ms">
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '1.1rem', flexShrink: 0 }}>
                {(customer?.first_name?.[0] || customer?.username?.[0] || 'C').toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.95rem', marginBottom: '0.1rem' }}>
                  {[customer?.first_name, customer?.last_name].filter(Boolean).join(' ') || customer?.username || '—'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{customer?.email}</div>
              </div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.85rem 1rem' }}>
              <DataRow label="Full Name" value={[customer?.first_name, customer?.last_name].filter(Boolean).join(' ') || customer?.username} />
              <DataRow label="Username" value={customer?.username} />
              <DataRow label="Email" value={customer?.email} />
            </div>
          </ReportCard>

          {/* Lead Information */}
          <ReportCard icon="📝" title="Lead Information" accent="#10b981" animDelay="100ms">
            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.85rem 1rem' }}>
              <DataRow label="Lead ID" value={`#${lead?.id}`} />
              <DataRow label="Name" value={lead?.name} />
              <DataRow label="Email" value={lead?.email} />
              <DataRow label="Phone" value={lead?.phone} />
              <DataRow label="Interest" value={lead?.interest_details} wrap />
              <DataRow label="Lead Status" value={
                <span className="badge" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700',
                  background: 'rgba(16,185,129,0.12)', color: '#059669',
                  border: '1px solid rgba(16,185,129,0.25)',
                }}>
                  ● {lead?.status}
                </span>
              } />
            </div>
          </ReportCard>
        </div>

        {/* ── GRID: Sales Exec + Technician ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>

          <ReportCard icon="💼" title="Sales Executive" accent="#f59e0b" animDelay="150ms">
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111', fontWeight: '700', fontSize: '1rem', flexShrink: 0 }}>
                {(sales_executive?.first_name?.[0] || sales_executive?.username?.[0] || 'S').toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.9rem', marginBottom: '0.1rem' }}>
                  {[sales_executive?.first_name, sales_executive?.last_name].filter(Boolean).join(' ') || sales_executive?.username}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Sales Executive</div>
              </div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.85rem 1rem' }}>
              <DataRow label="Username" value={sales_executive?.username} />
              <DataRow label="Email" value={sales_executive?.email} />
            </div>
          </ReportCard>

          <ReportCard icon="🔧" title="Assigned Technician" accent="#3b82f6" animDelay="200ms">
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '1rem', flexShrink: 0 }}>
                {(technician?.first_name?.[0] || technician?.username?.[0] || 'T').toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.9rem', marginBottom: '0.1rem' }}>
                  {[technician?.first_name, technician?.last_name].filter(Boolean).join(' ') || technician?.username}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Technician</div>
              </div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.85rem 1rem' }}>
              <DataRow label="Username" value={technician?.username} />
              <DataRow label="Email" value={technician?.email} />
            </div>
          </ReportCard>
        </div>

        {/* ── Quotation Details ── */}
        <ReportCard icon="📋" title="Quotation Details" accent="#f97316" animDelay="250ms">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem', marginBottom: '1rem' }}>
            <InfoChip label="Quotation ID" value={`#${quotation?.id}`} accent="#f97316" />
            <InfoChip label="Total Amount" value={`$${parseFloat(quotation?.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} accent="#10b981" />
            <InfoChip label="Status" value={
              <span className="badge" style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700',
                background: 'rgba(16,185,129,0.12)', color: '#059669',
                border: '1px solid rgba(16,185,129,0.25)',
              }}>
                ✓ {quotation?.status}
              </span>
            } accent="#6366f1" />
          </div>
          <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.9rem 1rem', border: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: '0.5rem' }}>
              System / Items Description
            </p>
            <p style={{ color: '#1e293b', whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '0.9rem', margin: 0 }}>
              {quotation?.items_description || '—'}
            </p>
          </div>
        </ReportCard>

        {/* ── Installation Timeline ── */}
        <ReportCard icon="📅" title="Installation Timeline" accent="#FFB100" animDelay="300ms">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
            <InfoChip label="Project Created" value={new Date(project?.created_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} accent="#FFB100" />
            <InfoChip label="Final Status" value={
              <span className="badge" style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700',
                background: 'rgba(16,185,129,0.12)', color: '#059669',
                border: '1px solid rgba(16,185,129,0.25)',
              }}>
                ✅ {PROJECT_STATUS_LABELS[project?.status] || project?.status}
              </span>
            } accent="#10b981" />
          </div>

          {/* Timeline Progress Bar */}
          <div style={{ padding: '1rem 0.5rem 0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
              {timelineSteps.map((step, i, arr) => {
                const stepIdx = statusOrder.indexOf(step.key);
                const done = stepIdx <= currentStatusIdx;
                const isCurrent = stepIdx === currentStatusIdx;

                return (
                  <React.Fragment key={step.key}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 0, minWidth: '64px', zIndex: 1 }}>
                      {/* Circle */}
                      <div className="timeline-dot" style={{
                        width: '38px', height: '38px', borderRadius: '50%',
                        background: done
                          ? 'linear-gradient(135deg, #FFB100, #E09C00)'
                          : '#f1f5f9',
                        border: done ? 'none' : '2px solid #e2e8f0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isCurrent ? '0 0 0 4px rgba(255,177,0,0.2)' : 'none',
                        transition: 'all 0.3s', flexShrink: 0,
                      }}>
                        {done ? (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M3 8l4 4 6-7" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#cbd5e1' }} />
                        )}
                      </div>
                      {/* Label */}
                      <span style={{
                        fontSize: '0.63rem', marginTop: '0.5rem', textAlign: 'center',
                        fontWeight: done ? '700' : '500',
                        color: done ? '#d97706' : '#94a3b8',
                        lineHeight: 1.2, maxWidth: '64px',
                      }}>
                        {step.shortLabel}
                      </span>
                    </div>
                    {/* Connector */}
                    {i < arr.length - 1 && (
                      <div style={{
                        flex: 1, height: '3px', borderRadius: '2px', marginBottom: '20px',
                        background: stepIdx < currentStatusIdx
                          ? 'linear-gradient(90deg, #FFB100, #E09C00)'
                          : '#e2e8f0',
                        margin: '17px 4px 0',
                        transition: 'background 0.3s',
                      }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </ReportCard>

        {/* ── Invoice Details ── */}
        <ReportCard icon="🧾" title="Invoice Details" accent="#0ea5e9" animDelay="350ms">
          {invoice ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem' }}>
              <InfoChip label="Invoice ID" value={`#${invoice.id}`} accent="#0ea5e9" />
              <InfoChip label="Amount" value={
                <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>
                  ${parseFloat(invoice.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              } accent="#10b981" />
              <InfoChip label="Payment Status" value={
                <span className="badge" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700',
                  background: invoice.status === 'PAID' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                  color: invoice.status === 'PAID' ? '#059669' : '#b45309',
                  border: `1px solid ${invoice.status === 'PAID' ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
                }}>
                  {invoice.status}
                </span>
              } accent="#6366f1" />
              <InfoChip label="Invoice Date" value={new Date(invoice.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} accent="#f97316" />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', background: 'rgba(245,158,11,0.06)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.15)' }}>
              <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>ℹ️</span>
              <p style={{ color: '#92400e', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
                No invoice generated yet. Invoice will be created once installation is marked as completed.
              </p>
            </div>
          )}
        </ReportCard>

        {/* ── Support Ticket History ── */}
        <ReportCard icon="🎫" title={`Support Ticket History (${tickets?.length || 0} ticket${tickets?.length !== 1 ? 's' : ''})`} accent="#a855f7" animDelay="400ms">
          {!tickets || tickets.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', background: 'rgba(245,158,11,0.06)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.15)' }}>
              <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>⭐</span>
              <p style={{ color: '#92400e', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
                No support tickets raised for this project. Excellent installation!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {tickets.map((t, idx) => {
                const sc = TICKET_STATUS_COLORS[t.status] || { bg: 'rgba(100,116,139,0.1)', color: '#64748b', border: 'rgba(100,116,139,0.25)' };
                return (
                  <div key={t.id} style={{
                    padding: '1.1rem 1.25rem',
                    borderRadius: '12px',
                    background: '#fafafa',
                    border: `1px solid ${sc.border}`,
                    position: 'relative',
                  }}>
                    {/* Colored left strip */}
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: sc.color, borderRadius: '12px 0 0 12px', opacity: 0.7 }} />
                    <div style={{ paddingLeft: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#0f172a', fontWeight: '600' }}>
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem', marginRight: '0.4rem' }}>#{idx + 1}</span>
                          {t.subject}
                        </h4>
                        <span className="badge" style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '2px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700',
                          background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                          whiteSpace: 'nowrap',
                        }}>
                          ● {TICKET_STATUS_LABELS[t.status] || t.status}
                        </span>
                      </div>
                      <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.6rem', lineHeight: 1.55 }}>{t.description}</p>
                      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.78rem', color: '#94a3b8' }}>
                        {t.assigned_technician && (
                          <span>🔧 <strong style={{ color: '#475569' }}>{t.assigned_technician}</strong></span>
                        )}
                        <span>📅 {new Date(t.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        <span>🔄 {new Date(t.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ReportCard>

        {/* ── Footer ── */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderRadius: '16px',
          background: '#ffffff',
          border: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              ✅
            </div>
            <div>
              <p style={{ fontSize: '0.82rem', color: '#475569', margin: 0, fontWeight: '500' }}>
                This report is auto-generated by the Solar ERP System.
              </p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.15rem 0 0' }}>
                For any discrepancies, please contact the support team.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.3rem' }}>☀️</span>
            <span style={{ fontWeight: '800', color: '#FFB100', letterSpacing: '1.5px', fontSize: '0.9rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              SOLAR ERP
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
