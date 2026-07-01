import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPERS & VECTOR ICONS
// ─────────────────────────────────────────────────────────────────────────────

const getProjectStatusStyle = (status) => {
  switch (status) {
    case 'SCHEDULED':             return { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8', border: 'rgba(148,163,184,0.3)', label: 'Scheduled' };
    case 'INSTALLATION_STARTED':  return { bg: 'rgba(99,102,241,0.15)',  color: '#818cf8', border: 'rgba(99,102,241,0.3)',  label: 'Installation Started' };
    case 'WORK_IN_PROGRESS':      return { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa', border: 'rgba(59,130,246,0.3)',  label: 'Work In Progress' };
    case 'HALFWAY_COMPLETED':     return { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24', border: 'rgba(245,158,11,0.3)',  label: 'Halfway Completed' };
    case 'INSTALLATION_COMPLETED':return { bg: 'rgba(16,185,129,0.15)',  color: '#10b981', border: 'rgba(16,185,129,0.3)',  label: 'Installation Completed' };
    default:                      return { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: 'rgba(255,255,255,0.1)', label: status };
  }
};

const getTicketStatusStyle = (status) => {
  switch (status) {
    case 'OPEN':                  return { bg: 'rgba(239,68,68,0.15)',   color: '#f87171', border: 'rgba(239,68,68,0.3)',   label: 'Open' };
    case 'ASSIGNED':              return { bg: 'rgba(99,102,241,0.15)',  color: '#818cf8', border: 'rgba(99,102,241,0.3)',  label: 'Assigned' };
    case 'IN_PROGRESS':           return { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24', border: 'rgba(245,158,11,0.3)',  label: 'In Progress' };
    case 'RESOLVED':              return { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa', border: 'rgba(59,130,246,0.3)',  label: 'Resolved' };
    case 'SUCCESSFULLY_RESOLVED': return { bg: 'rgba(16,185,129,0.15)',  color: '#10b981', border: 'rgba(16,185,129,0.3)',  label: '✓ Successfully Resolved' };
    default:                      return { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: 'rgba(255,255,255,0.1)', label: status };
  }
};

const StatusBadge = ({ status, styleGetter }) => {
  const s = styleGetter(status);
  return (
    <span style={{
      padding: '3px 9px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '700',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap'
    }}>
      {s.label}
    </span>
  );
};

const Notification = ({ msg, type }) => msg ? (
  <div style={{
    padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem',
    background: type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
    color: type === 'success' ? 'var(--success)' : 'var(--danger)',
    border: `1px solid ${type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
  }}>{msg}</div>
) : null;

const SectionHeader = ({ icon, title }) => (
  <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', color: '#ffffff' }}>
    {icon} {title}
  </h2>
);

const EmptyState = ({ msg }) => (
  <div className="solar-table-panel" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
    {msg}
  </div>
);

// Sharp native SVGs for dashboard headers/sidebars
const SolarHouseIllustration = () => (
  <svg width="130" height="90" viewBox="0 0 120 90" fill="none" style={{ opacity: 0.9, flexShrink: 0 }}>
    <path d="M5 80h110" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    <circle cx="95" cy="20" r="8" fill="#ffb100" />
    <path d="M95 6v3M95 31v3M81 20h3M106 20h3" stroke="#ffb100" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="25" y="45" width="50" height="35" rx="4" fill="rgba(255,255,255,0.15)" stroke="#ffffff" strokeWidth="2" />
    <rect x="45" y="58" width="12" height="22" rx="2" fill="rgba(255,255,255,0.3)" stroke="#ffffff" strokeWidth="1.5" />
    <rect x="63" y="50" width="8" height="8" rx="1" fill="rgba(255,255,255,0.3)" stroke="#ffffff" strokeWidth="1.5" />
    <polygon points="20,45 50,20 80,45" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" />
    <polygon points="28,40 50,23 72,40" fill="rgba(255,255,255,0.25)" stroke="#ffffff" strokeWidth="1.5" />
    <line x1="50" y1="23" x2="50" y2="40" stroke="#ffffff" strokeWidth="1" />
    <line x1="38" y1="31" x2="62" y2="31" stroke="#ffffff" strokeWidth="1" />
  </svg>
);

const Sparkline = ({ strokeColor }) => (
  <svg width="100%" height="25" viewBox="0 0 160 25" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, pointerEvents: 'none', opacity: 0.7 }}>
    <path
      d="M0,20 C30,12 50,4 80,14 C110,24 130,8 160,6"
      fill="none"
      stroke={strokeColor}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const ProjectThumbnail = () => (
  <div style={{
    width: '70px', height: '50px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0,
    background: 'linear-gradient(135deg, #1e293b, #0f172a)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)', marginRight: '0.5rem'
  }}>
    <svg width="100%" height="100%" viewBox="0 0 70 50" fill="none">
      <rect x="8" y="8" width="54" height="34" rx="2" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.2" />
      <line x1="8" y1="25" x2="62" y2="25" stroke="#60a5fa" strokeWidth="0.8" />
      <line x1="26" y1="8" x2="26" y2="42" stroke="#60a5fa" strokeWidth="0.8" />
      <line x1="44" y1="8" x2="44" y2="42" stroke="#60a5fa" strokeWidth="0.8" />
      <path d="M10 10 L35 10 L10 35 Z" fill="rgba(255,255,255,0.06)" />
    </svg>
  </div>
);


// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE & LEAVE MANAGEMENT SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function EmployeeAttendanceLeavesTab({ api, user }) {
  const [attendances, setAttendances] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [form, setForm] = useState({ start_date: '', end_date: '', leave_type: 'CASUAL', reason: '' });
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');

  const flash = (text, type = 'success') => { setMsgType(type); setMsg(text); setTimeout(() => setMsg(''), 5000); };

  const fetchData = useCallback(async () => {
    try {
      const [attRes, leaveRes] = await Promise.all([
        api.get('auth/attendance/'),
        api.get('auth/leaves/')
      ]);
      setAttendances(attRes.data);
      setLeaves(leaveRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Check if user has checked in today (YYYY-MM-DD local format)
  const hasCheckedInToday = () => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    return attendances.some(att => att.date === todayStr);
  };

  const todayRecord = () => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    return attendances.find(att => att.date === todayStr);
  };

  const handleCheckIn = async () => {
    setBtnLoading(true);
    try {
      await api.post('auth/attendance/');
      flash('Attendance marked successfully!');
      fetchData();
    } catch (e) {
      const errorMsg = e.response?.data?.detail || e.response?.data?.[0] || 'Failed to mark attendance.';
      flash(errorMsg, 'error');
    } finally {
      setBtnLoading(false);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!form.start_date || !form.end_date || !form.reason) {
      flash('Please fill in all fields.', 'error');
      return;
    }
    setApplyLoading(true);
    try {
      await api.post('auth/leaves/', form);
      flash('Leave request submitted successfully!');
      setForm({ start_date: '', end_date: '', leave_type: 'CASUAL', reason: '' });
      fetchData();
    } catch {
      flash('Failed to submit leave request.', 'error');
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading attendance & leaves...</div>;
  }

  const checkedIn = hasCheckedInToday();
  const todayRec = todayRecord();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Notification msg={msg} type={msgType} />

      <div className="solar-db-panels-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Left Column: Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Check-In Card */}
          <div className="solar-table-panel" style={{ padding: '1.5rem', background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '18px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', color: '#0f172a', marginBottom: '1rem' }}>
              ⏱️ Attendance Check-In
            </h3>
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              {checkedIn ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '1.5rem' }}>
                    ✓
                  </div>
                  <h4 style={{ color: '#10b981', margin: '0.5rem 0 0 0' }}>Attendance Marked</h4>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                    Checked in today at {new Date(todayRec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>
                    You have not checked in today yet. Click below to record your attendance.
                  </p>
                  <button
                    onClick={handleCheckIn}
                    disabled={btnLoading}
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', padding: '10px 24px', borderRadius: '12px' }}
                  >
                    {btnLoading ? 'Checking in...' : '🕒 Mark Present'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Apply Leave Form */}
          <div className="solar-table-panel" style={{ padding: '1.5rem', background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '18px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', color: '#0f172a', marginBottom: '1rem' }}>
              ✉️ Apply for Leave
            </h3>
            <form onSubmit={handleApplyLeave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Start Date</label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={form.start_date}
                    onChange={e => setForm({ ...form, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>End Date</label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={form.end_date}
                    onChange={e => setForm({ ...form, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Leave Type</label>
                <select
                  className="input-field"
                  value={form.leave_type}
                  onChange={e => setForm({ ...form, leave_type: e.target.value })}
                >
                  <option value="SICK">Sick Leave</option>
                  <option value="CASUAL">Casual Leave</option>
                  <option value="ANNUAL">Annual Leave</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Reason</label>
                <textarea
                  required
                  rows="3"
                  className="input-field"
                  placeholder="Provide a reason for the leave request..."
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={applyLoading}
                className="btn btn-primary"
                style={{ padding: '10px', borderRadius: '12px', width: '100%' }}
              >
                {applyLoading ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Lists */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Leaves History */}
          <div className="solar-table-panel" style={{ padding: '1.5rem', background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '18px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', color: '#0f172a', marginBottom: '1rem' }}>
              📋 Leave Requests History
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#fafafa' }}>
                    <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#64748b' }}>Dates</th>
                    <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#64748b' }}>Type</th>
                    <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#64748b' }}>Status</th>
                    <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#64748b' }}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map(req => {
                    const statusStyle = req.status === 'APPROVED' ? { bg: 'rgba(16,185,129,0.1)', color: '#10b981' } : req.status === 'REJECTED' ? { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' } : { bg: 'rgba(245,158,11,0.1)', color: '#fbbf24' };
                    return (
                      <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#1e293b' }}>
                          {req.start_date} to {req.end_date}
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#1e293b', fontWeight: '600' }}>
                          {req.leave_type}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '700', ...statusStyle }}>
                            {req.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#64748b' }}>
                          {req.admin_remarks || '—'}
                        </td>
                      </tr>
                    );
                  })}
                  {leaves.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                        No leave requests applied yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Attendance Check-in Logs */}
          <div className="solar-table-panel" style={{ padding: '1.5rem', background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '18px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', color: '#0f172a', marginBottom: '1rem' }}>
              🕒 Attendance Check-in History
            </h3>
            <div style={{ overflowX: 'auto', maxHeight: '300px' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#fafafa' }}>
                    <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#64748b' }}>Date</th>
                    <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#64748b' }}>Check-in Time</th>
                  </tr>
                </thead>
                <tbody>
                  {attendances.map(att => (
                    <tr key={att.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#1e293b' }}>
                        {att.date}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#1e293b' }}>
                        {new Date(att.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                  {attendances.length === 0 && (
                    <tr>
                      <td colSpan="2" style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                        No attendance history found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

function AdminAttendanceLeavesTab({ api }) {
  const [attendances, setAttendances] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarksInput, setRemarksInput] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');

  const flash = (text, type = 'success') => { setMsgType(type); setMsg(text); setTimeout(() => setMsg(''), 5000); };

  const fetchData = useCallback(async () => {
    try {
      const [attRes, leaveRes] = await Promise.all([
        api.get('auth/attendance/'),
        api.get('auth/leaves/')
      ]);
      setAttendances(attRes.data);
      setLeaves(leaveRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleLeaveAction = async (requestId, status) => {
    const remarks = remarksInput[requestId] || '';
    setActionLoading(prev => ({ ...prev, [requestId]: true }));
    try {
      await api.patch(`auth/leaves/${requestId}/`, { status, admin_remarks: remarks });
      flash(`Leave request marked as ${status}!`);
      setRemarksInput(prev => ({ ...prev, [requestId]: '' }));
      fetchData();
    } catch {
      flash('Failed to update leave request.', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading management data...</div>;
  }

  const pendingRequests = leaves.filter(l => l.status === 'PENDING');
  const pastRequests    = leaves.filter(l => l.status !== 'PENDING');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Notification msg={msg} type={msgType} />

      {/* Title */}
      <div>
        <h2 style={{ margin: 0, color: '#0f172a' }}>📅 Attendance & Leaves Management</h2>
        <p style={{ color: '#94a3b8', marginTop: '0.25rem', fontSize: '0.9rem' }}>
          Approve leave requests, track check-ins, and view employee leave histories.
        </p>
      </div>

      {/* 1. Pending Leave Requests */}
      <div className="solar-table-panel" style={{ padding: '1.5rem', background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '18px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', color: '#0f172a', marginBottom: '1rem' }}>
          🔴 Pending Leave Requests ({pendingRequests.length})
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#fafafa' }}>
                <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>Employee</th>
                <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>Dates</th>
                <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>Type</th>
                <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>Reason</th>
                <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>Admin Remarks</th>
                <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#64748b', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map(req => (
                <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: '700', color: '#0f172a' }}>{req.user_details?.username}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{req.user_details?.role?.replace(/_/g, ' ')}</div>
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#1e293b', whiteSpace: 'nowrap' }}>
                    {req.start_date} to {req.end_date}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#1e293b', fontWeight: '600' }}>
                    {req.leave_type}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#64748b', maxWidth: '200px' }}>
                    {req.reason}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Add remarks..."
                      style={{ margin: 0, padding: '6px 12px', fontSize: '0.8rem' }}
                      value={remarksInput[req.id] || ''}
                      onChange={e => setRemarksInput({ ...remarksInput, [req.id]: e.target.value })}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleLeaveAction(req.id, 'APPROVED')}
                        disabled={actionLoading[req.id]}
                        className="btn"
                        style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px' }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleLeaveAction(req.id, 'REJECTED')}
                        disabled={actionLoading[req.id]}
                        className="btn"
                        style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px' }}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pendingRequests.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No pending leave requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Employee Attendance Records */}
      <div className="solar-table-panel" style={{ padding: '1.5rem', background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '18px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', color: '#0f172a', marginBottom: '1rem' }}>
          🕒 Employee Attendance Log
        </h3>
        <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#fafafa' }}>
                <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>Employee</th>
                <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>Role</th>
                <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>Date</th>
                <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>Check-in Time</th>
              </tr>
            </thead>
            <tbody>
              {attendances.map(att => (
                <tr key={att.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: '700', color: '#0f172a' }}>{att.user_details?.username}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{att.user_details?.email}</div>
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#1e293b' }}>
                    {att.user_details?.role?.replace(/_/g, ' ')}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#1e293b' }}>
                    {att.date}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#1e293b' }}>
                    {new Date(att.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                </tr>
              ))}
              {attendances.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No check-in logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Leave Request History */}
      <div className="solar-table-panel" style={{ padding: '1.5rem', background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '18px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', color: '#0f172a', marginBottom: '1rem' }}>
          📋 Leave History Log
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#fafafa' }}>
                <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>Employee</th>
                <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>Dates</th>
                <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>Type</th>
                <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>Reason</th>
                <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>Status</th>
                <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>Admin Remarks</th>
              </tr>
            </thead>
            <tbody>
              {pastRequests.map(req => {
                const statusStyle = req.status === 'APPROVED' ? { bg: 'rgba(16,185,129,0.1)', color: '#10b981' } : { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' };
                return (
                  <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>{req.user_details?.username}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{req.user_details?.role?.replace(/_/g, ' ')}</div>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#1e293b', whiteSpace: 'nowrap' }}>
                      {req.start_date} to {req.end_date}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#1e293b', fontWeight: '600' }}>
                      {req.leave_type}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#64748b', maxWidth: '200px' }}>
                      {req.reason}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '700', ...statusStyle }}>
                        {req.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#64748b' }}>
                      {req.admin_remarks || '—'}
                    </td>
                  </tr>
                );
              })}
              {pastRequests.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No completed requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD SHELL WITH SIDEBAR & HEADER
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  if (!user) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

  // Dynamically configure links based on user role to match target style
  const getNavLinks = () => {
    switch (user.role) {
      case 'ADMIN':
        return [
          { group: 'MAIN', items: [
            { label: 'Dashboard', id: 'dashboard', icon: '📊' },
            { label: 'Attendance & Leaves', id: 'attendance_leaves', icon: '📅' }
          ] },
          { group: 'REPORTS', items: [{ label: 'Completion Reports', id: 'reports', icon: '📄' }] }
        ];
      case 'SALES_EXECUTIVE':
        return [
          { group: 'MAIN', items: [
            { label: 'Dashboard', id: 'dashboard', icon: '📊' },
            { label: 'Attendance & Leaves', id: 'attendance_leaves', icon: '📅' }
          ] },
          { group: 'LEADS & QUOTES', items: [
            { label: 'Assigned Leads', id: 'leads', icon: '👤' },
            { label: 'Prepared Quotations', id: 'quotes', icon: '📋' }
          ] },
          { group: 'PROJECTS', items: [
            { label: 'Installation Projects', id: 'projects', icon: '🔧' },
            { label: 'Invoices', id: 'invoices', icon: '🧾' }
          ] },
          { group: 'SUPPORT', items: [{ label: 'Customer Support Tickets', id: 'tickets', icon: '🎫' }] }
        ];
      case 'TECHNICIAN':
        return [
          { group: 'MAIN', items: [
            { label: 'Dashboard', id: 'dashboard', icon: '📊' },
            { label: 'Attendance & Leaves', id: 'attendance_leaves', icon: '📅' }
          ] },
          { group: 'PROJECTS', items: [{ label: 'Installation Projects', id: 'projects', icon: '🔧' }] },
          { group: 'SUPPORT', items: [{ label: 'Assigned Support Tickets', id: 'tickets', icon: '🎫' }] }
        ];
      case 'CUSTOMER_CARE':
        return [
          { group: 'MAIN', items: [
            { label: 'Dashboard', id: 'dashboard', icon: '📊' },
            { label: 'Attendance & Leaves', id: 'attendance_leaves', icon: '📅' }
          ] },
          { group: 'SUPPORT', items: [{ label: 'Support Tickets', id: 'tickets', icon: '🎫' }] }
        ];
      case 'CUSTOMER':
        return [
          { group: 'MAIN', items: [{ label: 'Dashboard', id: 'dashboard', icon: '📊' }] },
          { group: 'QUOTES & INVOICES', items: [
            { label: 'My Quotations', id: 'quotes', icon: '📋' },
            { label: 'My Invoices', id: 'invoices', icon: '🧾' }
          ] },
          { group: 'PROJECTS', items: [{ label: 'My Projects', id: 'projects', icon: '☀️' }] },
          { group: 'SUPPORT', items: [{ label: 'Support Tickets', id: 'tickets', icon: '🎫' }] }
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();
  
  // Format as "01 July 2026" to match reference UI image
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleDateString('en-US', { month: 'long' });
  const year = d.getFullYear();
  const currentDate = `${day} ${month} ${year}`;
  
  const userInitials = user.username ? user.username.substring(0, 2).toUpperCase() : 'US';
  const displayRole = user.role ? user.role.replace('_', ' ').toLowerCase() : '';

  const themeClass = 'theme-light'; // All roles now use light theme

  return (
    <div className={`solar-db-wrapper ${themeClass} animate-fade-in`}>
      
      {/* ── Sidebar Navigation ── */}
      <aside className={`solar-db-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div>
          <div className="solar-db-sidebar-logo">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffb100" strokeWidth="2.5">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
              </svg>
              <div>
                <h2 style={{ margin: 0, lineHeight: 1.1 }}>Solar ERP</h2>
                {user.role === 'ADMIN' && (
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '500', marginTop: '0.1rem', letterSpacing: '0.3px' }}>Admin Workspace</div>
                )}
              </div>
            </div>
          </div>
          
          <nav className="solar-db-sidebar-menu">
            {navLinks.map((grp, gIdx) => (
              <div key={gIdx} className="solar-db-menu-group">
                <span className="solar-db-group-title">{grp.group}</span>
                {grp.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                    className={`solar-db-menu-item ${activeTab === item.id ? 'active' : ''}`}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar bottom widgets */}
        <div>
          <div className="solar-db-sidebar-help">
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem',
              color: '#10b981', fontSize: '1.1rem'
            }}>
              🎧
            </div>
            <h4>Need Help?</h4>
            <p>We're here to help you 24/7 with solar operations.</p>
            <button className="btn-help" onClick={() => alert('Support contact: support@solarerp.com')}>Contact Support</button>
          </div>
          
          <button className="solar-db-sidebar-logout-link" onClick={handleLogout}>
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* ── Main Workspace ── */}
      <div className="solar-db-main">
        
        {/* Top Header */}
        <header className="solar-db-header">
          <div className="solar-db-header-left">
            <button className="solar-db-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>☀️</span>
              <span style={{ fontWeight: '750', letterSpacing: '0.5px' }}>Solar Workspace</span>
            </div>
          </div>
          
          <div className="solar-db-header-right">
            {/* Notifications */}
            <button className="solar-db-noti-btn">
              🔔
              <span className="solar-db-noti-badge">3</span>
            </button>
            
            {/* User Profile */}
            <div className="solar-db-profile" style={{ cursor: 'pointer' }}>
              <div className="solar-db-avatar">{userInitials}</div>
              <div className="solar-db-profile-info">
                <span className="solar-db-profile-name">{user.username}</span>
                <span className="solar-db-profile-role" style={{ textTransform: 'capitalize' }}>{displayRole}</span>
              </div>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem', marginLeft: '0.25rem' }}>▼</span>
            </div>
          </div>
        </header>

        {/* Workspace Content */}
        <main className="solar-db-content">
          
          {/* Header Dashboard bar with Home & Date */}
          <div className="solar-db-title-bar">
            <div className="solar-db-welcome">
              <h1>Dashboard</h1>
              <p>Welcome back, {user.username} 👋</p>
            </div>
            
            <div className="solar-db-actions-group">
              <button className="solar-db-action-btn" onClick={() => setActiveTab('dashboard')}>
                🏠 Home
              </button>
              <div className="solar-db-date-widget">
                📅 {currentDate}
              </div>
            </div>
          </div>

          {/* Render target component with tab filters */}
          {user.role === 'ADMIN'          && <AdminDashboard activeTab={activeTab} setActiveTab={setActiveTab} />}
          {user.role === 'SALES_EXECUTIVE'&& <SalesExecutiveDashboard activeTab={activeTab} setActiveTab={setActiveTab} />}
          {user.role === 'TECHNICIAN'     && <TechnicianDashboard activeTab={activeTab} setActiveTab={setActiveTab} />}
          {user.role === 'CUSTOMER_CARE'  && <CustomerCareDashboard activeTab={activeTab} setActiveTab={setActiveTab} />}
          {user.role === 'CUSTOMER'       && <CustomerDashboard activeTab={activeTab} setActiveTab={setActiveTab} />}
          
        </main>
        
        {/* Footer */}
        <footer className="solar-db-footer">
          © 2026 Solar ERP. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function CustomerDashboard({ activeTab, setActiveTab }) {
  const { api } = useContext(AuthContext);
  const [quotes, setQuotes]   = useState([]);
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tickets, setTickets]  = useState([]);
  const [msg, setMsg] = useState(''); const [msgType, setMsgType] = useState('success');
  const [ticketForm, setTicketForm] = useState({ subject: '', description: '', project: '' });
  const [showTicketForm, setShowTicketForm] = useState(false);

  const flash = (text, type = 'success') => { setMsgType(type); setMsg(text); setTimeout(() => setMsg(''), 5000); };

  const fetchAll = useCallback(async () => {
    try {
      const [q, p, inv, t] = await Promise.all([
        api.get('quotations/'), api.get('projects/'),
        api.get('invoices/'),   api.get('tickets/')
      ]);
      setQuotes(q.data); setProjects(p.data);
      setInvoices(inv.data); setTickets(t.data);
    } catch (e) { console.error(e); }
  }, [api]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleUpdateQuote = async (id, status) => {
    try {
      await api.patch(`quotations/${id}/`, { status });
      flash(`Quotation ${status === 'ACCEPTED' ? 'approved' : 'rejected'}!`);
      fetchAll();
    } catch { flash('Failed to update quotation.', 'error'); }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      const payload = { subject: ticketForm.subject, description: ticketForm.description };
      if (ticketForm.project) payload.project = parseInt(ticketForm.project);
      await api.post('tickets/', payload);
      flash('Support ticket submitted successfully!');
      setTicketForm({ subject: '', description: '', project: '' });
      setShowTicketForm(false);
      fetchAll();
    } catch { flash('Failed to submit ticket.', 'error'); }
  };

  const completedProjects = projects.filter(p => p.status === 'INSTALLATION_COMPLETED');

  // Overview Tab Layout
  if (activeTab === 'dashboard') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Notification msg={msg} type={msgType} />
        
        {/* Banner */}
        <div className="solar-db-hero-banner">
          <div className="solar-db-banner-left">
            <SolarHouseIllustration />
            <div className="solar-db-banner-text">
              <h2>Powering a Sustainable Future</h2>
              <p>Manage your solar contracts, view live installation steps, and get customer care assistance in real-time.</p>
            </div>
          </div>
          <div className="solar-db-banner-stats">
            <div className="solar-db-banner-stat-item">
              <div className="solar-db-banner-stat-number">{projects.length}</div>
              <div className="solar-db-banner-stat-label">Active Projects</div>
            </div>
            <div className="solar-db-banner-stat-item">
              <div className="solar-db-banner-stat-number">{invoices.length}</div>
              <div className="solar-db-banner-stat-label">My Invoices</div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="solar-db-stats-grid">
          
          <div className="solar-db-stat-card green">
            <div className="solar-db-stat-card-header">
              <div className="solar-db-stat-card-icon">📋</div>
            </div>
            <div className="solar-db-stat-card-number">{quotes.length}</div>
            <div className="solar-db-stat-card-label">My Quotations</div>
            <button className="solar-db-stat-card-link" onClick={() => setActiveTab('quotes')}>View all &gt;</button>
            <Sparkline strokeColor="#10b981" />
          </div>

          <div className="solar-db-stat-card blue">
            <div className="solar-db-stat-card-header">
              <div className="solar-db-stat-card-icon">☀️</div>
            </div>
            <div className="solar-db-stat-card-number">{projects.length}</div>
            <div className="solar-db-stat-card-label">Installation Projects</div>
            <button className="solar-db-stat-card-link" onClick={() => setActiveTab('projects')}>View all &gt;</button>
            <Sparkline strokeColor="#3b82f6" />
          </div>

          <div className="solar-db-stat-card orange">
            <div className="solar-db-stat-card-header">
              <div className="solar-db-stat-card-icon">🧾</div>
            </div>
            <div className="solar-db-stat-card-number">{invoices.length}</div>
            <div className="solar-db-stat-card-label">Invoices Issued</div>
            <button className="solar-db-stat-card-link" onClick={() => setActiveTab('invoices')}>View all &gt;</button>
            <Sparkline strokeColor="#f97316" />
          </div>

          <div className="solar-db-stat-card purple">
            <div className="solar-db-stat-card-header">
              <div className="solar-db-stat-card-icon">🎫</div>
            </div>
            <div className="solar-db-stat-card-number">{tickets.length}</div>
            <div className="solar-db-stat-card-label">Support Tickets</div>
            <button className="solar-db-stat-card-link" onClick={() => setActiveTab('tickets')}>View all &gt;</button>
            <Sparkline strokeColor="#a855f7" />
          </div>

        </div>

        {/* Double row preview */}
        <div className="solar-db-panels-grid">
          <div className="solar-db-panel-card">
            <div className="solar-db-panel-header">
              <h3 className="solar-db-panel-title">Active Projects</h3>
              <button className="solar-db-panel-link" onClick={() => setActiveTab('projects')}>View All</button>
            </div>
            <div className="solar-db-leads-list">
              {projects.slice(0, 3).map(p => (
                <div key={p.id} className="solar-db-lead-row">
                  <div className="solar-db-lead-left">
                    <ProjectThumbnail />
                    <div className="solar-db-lead-details">
                      <h5>{p.lead_name}</h5>
                      <p>Technician: {p.technician_username || 'Assigning...'}</p>
                      {p.created_at && (
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          📅 {new Date(p.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="solar-db-lead-right">
                    <StatusBadge status={p.status} styleGetter={getProjectStatusStyle} />
                  </div>
                </div>
              ))}
              {projects.length === 0 && <p style={{ color: '#64748b', fontSize: '0.88rem', textAlign: 'center' }}>No active projects.</p>}
            </div>
          </div>

          <div className="solar-db-panel-card">
            <div className="solar-db-panel-header">
              <h3 className="solar-db-panel-title">Recent Tickets</h3>
              <button className="solar-db-panel-link" onClick={() => setActiveTab('tickets')}>View All</button>
            </div>
            <div className="solar-db-leads-list">
              {tickets.slice(0, 3).map(t => (
                <div key={t.id} className="solar-db-lead-row">
                  <div className="solar-db-lead-left">
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '1.1rem', flexShrink: 0
                    }}>
                      💬
                    </div>
                    <div className="solar-db-lead-details">
                      <h5>{t.subject}</h5>
                      <p>{t.description.substring(0, 45)}...</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        📅 {new Date(t.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} · {new Date(t.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="solar-db-lead-right">
                    <StatusBadge status={t.status} styleGetter={getTicketStatusStyle} />
                  </div>
                </div>
              ))}
              {tickets.length === 0 && <p style={{ color: '#64748b', fontSize: '0.88rem', textAlign: 'center' }}>No support tickets raised.</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Individual Full-view Tabs
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Notification msg={msg} type={msgType} />

      {activeTab === 'quotes' && (
        <section className="solar-table-panel animate-fade-in">
          <SectionHeader icon="📋" title="My Quotations" />
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            {quotes.length === 0 ? <EmptyState msg="No quotations received yet." /> :
              quotes.map(q => (
                <div key={q.id} className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', minHeight: '220px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Quote #{q.id}</span>
                    <StatusBadge status={q.status} styleGetter={(s) => ({
                      bg: s === 'PENDING' ? 'rgba(245,158,11,0.15)' : s === 'ACCEPTED' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      color: s === 'PENDING' ? '#fbbf24' : s === 'ACCEPTED' ? '#10b981' : '#f87171',
                      border: s === 'PENDING' ? 'rgba(245,158,11,0.3)' : s === 'ACCEPTED' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
                      label: s
                    })} />
                  </div>
                  <h3 style={{ fontSize: '1.4rem', color: '#ffb100', marginBottom: '0.5rem' }}>
                    ${parseFloat(q.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </h3>
                  <p style={{ color: '#ffffff', flex: 1, fontSize: '0.92rem' }}>{q.items_description}</p>
                  {q.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                      <button onClick={() => handleUpdateQuote(q.id, 'ACCEPTED')} className="btn btn-primary" style={{ flex: 1, padding: '10px' }}>Approve</button>
                      <button onClick={() => handleUpdateQuote(q.id, 'REJECTED')} className="btn btn-secondary" style={{ flex: 1, padding: '10px', borderColor: '#ef4444', color: '#ef4444' }}>Reject</button>
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        </section>
      )}

      {activeTab === 'projects' && (
        <section className="solar-table-panel animate-fade-in">
          <SectionHeader icon="☀️" title="My Installation Projects" />
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            {projects.length === 0 ? <EmptyState msg="No projects yet. Approve a quotation to get started." /> :
              projects.map(proj => (
                <div key={proj.id} className="glass-panel" style={{ padding: '1.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Project #{proj.id}</span>
                    <StatusBadge status={proj.status} styleGetter={getProjectStatusStyle} />
                  </div>
                  <h3 style={{ color: '#ffffff', marginBottom: '0.5rem', fontSize: '1.1rem' }}>{proj.lead_name}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                    <strong>Technician:</strong> {proj.technician_username || 'Assigning...'}
                  </p>
                  <p style={{ fontSize: '0.9rem', color: '#ffffff' }}>{proj.quotation_items}</p>
                </div>
              ))
            }
          </div>
        </section>
      )}

      {activeTab === 'invoices' && (
        <section className="solar-table-panel animate-fade-in">
          <SectionHeader icon="🧾" title="My Invoices" />
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            {invoices.length === 0 ? <EmptyState msg="No invoices yet. Invoice is generated once installation is completed." /> :
              invoices.map(inv => (
                <div key={inv.id} className="glass-panel" style={{ padding: '1.75rem', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Invoice #{inv.id}</span>
                    <StatusBadge status={inv.status} styleGetter={(s) => ({
                      bg: s === 'PAID' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                      color: s === 'PAID' ? '#10b981' : '#fbbf24',
                      border: s === 'PAID' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)',
                      label: s
                    })} />
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ffb100', marginBottom: '0.75rem' }}>
                    ${parseFloat(inv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem', color: '#ffffff' }}><strong>Project:</strong> {inv.project_lead_name}</p>
                  <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem', color: '#ffffff' }}><strong>System:</strong> {inv.project_quotation_items}</p>
                  <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}><strong>Technician:</strong> {inv.project_technician_username}</p>
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', color: '#94a3b8' }}>
                    Issued: {new Date(inv.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            }
          </div>
        </section>
      )}

      {activeTab === 'tickets' && (
        <section className="solar-table-panel animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <SectionHeader icon="🎫" title="Support Tickets" />
            {completedProjects.length > 0 && (
              <button onClick={() => setShowTicketForm(!showTicketForm)} className="btn btn-primary">
                {showTicketForm ? 'Cancel' : '+ Raise a Ticket'}
              </button>
            )}
          </div>

          {showTicketForm && (
            <div className="glass-panel animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid rgba(99,102,241,0.3)' }}>
              <h3 style={{ marginBottom: '1rem', color: '#ffffff' }}>Describe Your Issue</h3>
              <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <select required className="input-field" value={ticketForm.project} onChange={e => setTicketForm({ ...ticketForm, project: e.target.value })}>
                    <option value="">Select a completed project</option>
                    {completedProjects.map(p => <option key={p.id} value={p.id}>Project #{p.id} — {p.lead_name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <input required type="text" className="input-field" placeholder="Issue subject (e.g. Panel not generating power)" value={ticketForm.subject} onChange={e => setTicketForm({ ...ticketForm, subject: e.target.value })} />
                </div>
                <div className="input-group">
                  <textarea required className="input-field" rows="4" placeholder="Describe the issue in detail..." value={ticketForm.description} onChange={e => setTicketForm({ ...ticketForm, description: e.target.value })} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 2rem' }}>
                  Submit Ticket
                </button>
              </form>
            </div>
          )}

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            {tickets.length === 0 ? <EmptyState msg="No support tickets yet." /> :
              tickets.map(t => (
                <div key={t.id} className="glass-panel" style={{ padding: '1.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Ticket #{t.id}</span>
                    <StatusBadge status={t.status} styleGetter={getTicketStatusStyle} />
                  </div>
                  <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', color: '#ffffff' }}>{t.subject}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem' }}>{t.description}</p>
                  {t.project_lead_name && <p style={{ fontSize: '0.85rem', color: '#ffffff' }}><strong>Project:</strong> {t.project_lead_name}</p>}
                  {t.assigned_technician_username && <p style={{ fontSize: '0.85rem', color: '#ffffff' }}><strong>Technician:</strong> {t.assigned_technician_username}</p>}
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                    {new Date(t.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            }
          </div>
        </section>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SALES EXECUTIVE DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function SalesExecutiveDashboard({ activeTab, setActiveTab }) {
  const { user, api } = useContext(AuthContext);
  const [leads, setLeads]     = useState([]);
  const [quotes, setQuotes]   = useState([]);
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tickets, setTickets]  = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [quoteData, setQuoteData] = useState({ items_description: '', total_amount: '' });
  const [msg, setMsg] = useState(''); const [msgType, setMsgType] = useState('success');

  const flash = (text, type = 'success') => { setMsgType(type); setMsg(text); setTimeout(() => setMsg(''), 5000); };

  const fetchAll = useCallback(async () => {
    try {
      const [l, q, p, inv, t] = await Promise.all([
        api.get('leads/'), api.get('quotations/'), api.get('projects/'),
        api.get('invoices/'), api.get('tickets/')
      ]);
      setLeads(l.data); setQuotes(q.data); setProjects(p.data);
      setInvoices(inv.data); setTickets(t.data);
    } catch (e) { console.error(e); }
  }, [api]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleGenerateQuote = async (e) => {
    e.preventDefault();
    try {
      await api.post('quotations/', { lead: selectedLead.id, ...quoteData });
      flash('Quotation sent to customer!');
      setSelectedLead(null);
      setQuoteData({ items_description: '', total_amount: '' });
      fetchAll();
    } catch { flash('Error generating quotation.', 'error'); }
  };

  const myProjects = projects.filter(p => p.sales_exec_id === user.id);

  // Overview Tab Layout
  if (activeTab === 'dashboard') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Notification msg={msg} type={msgType} />

        {myProjects.filter(p => p.status === 'INSTALLATION_COMPLETED').length > 0 && (
          <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', color: '#10b981', fontSize: '0.9rem' }}>
            🎉 {myProjects.filter(p => p.status === 'INSTALLATION_COMPLETED').length} project(s) completed! Invoices have been auto-generated.
          </div>
        )}

        {/* Banner */}
        <div className="solar-db-hero-banner">
          <div className="solar-db-banner-left">
            <SolarHouseIllustration />
            <div className="solar-db-banner-text">
              <h2>Powering a Sustainable Future</h2>
              <p>Solar ERP helps you manage leads, quotations, projects, installations, invoices and customer support efficiently.</p>
            </div>
          </div>
          <div className="solar-db-banner-stats">
            <div className="solar-db-banner-stat-item">
              <div className="solar-db-banner-stat-number">500+</div>
              <div className="solar-db-banner-stat-label">Projects Completed</div>
            </div>
            <div className="solar-db-banner-stat-item">
              <div className="solar-db-banner-stat-number">300+</div>
              <div className="solar-db-banner-stat-label">Happy Customers</div>
            </div>
            <div className="solar-db-banner-stat-item">
              <div className="solar-db-banner-stat-number">25+</div>
              <div className="solar-db-banner-stat-label">Team Members</div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="solar-db-stats-grid">
          
          <div className="solar-db-stat-card green">
            <div className="solar-db-stat-card-header">
              <div className="solar-db-stat-card-icon">👥</div>
            </div>
            <div className="solar-db-stat-card-number">{leads.length}</div>
            <div className="solar-db-stat-card-label">Assigned Leads</div>
            <button className="solar-db-stat-card-link" onClick={() => setActiveTab('leads')}>View all &gt;</button>
            <Sparkline strokeColor="#10b981" />
          </div>

          <div className="solar-db-stat-card blue">
            <div className="solar-db-stat-card-header">
              <div className="solar-db-stat-card-icon">📄</div>
            </div>
            <div className="solar-db-stat-card-number">{quotes.length}</div>
            <div className="solar-db-stat-card-label">Prepared Quotations</div>
            <button className="solar-db-stat-card-link" onClick={() => setActiveTab('quotes')}>View all &gt;</button>
            <Sparkline strokeColor="#3b82f6" />
          </div>

          <div className="solar-db-stat-card orange">
            <div className="solar-db-stat-card-header">
              <div className="solar-db-stat-card-icon">🔧</div>
            </div>
            <div className="solar-db-stat-card-number">{myProjects.length}</div>
            <div className="solar-db-stat-card-label">Installation Projects</div>
            <button className="solar-db-stat-card-link" onClick={() => setActiveTab('projects')}>View all &gt;</button>
            <Sparkline strokeColor="#f97316" />
          </div>

          <div className="solar-db-stat-card purple">
            <div className="solar-db-stat-card-header">
              <div className="solar-db-stat-card-icon">🧾</div>
            </div>
            <div className="solar-db-stat-card-number">{invoices.length}</div>
            <div className="solar-db-stat-card-label">Invoices</div>
            <button className="solar-db-stat-card-link" onClick={() => setActiveTab('invoices')}>View all &gt;</button>
            <Sparkline strokeColor="#a855f7" />
          </div>

          <div className="solar-db-stat-card teal">
            <div className="solar-db-stat-card-header">
              <div className="solar-db-stat-card-icon">🎧</div>
            </div>
            <div className="solar-db-stat-card-number">{tickets.length}</div>
            <div className="solar-db-stat-card-label">Support Tickets</div>
            <button className="solar-db-stat-card-link" onClick={() => setActiveTab('tickets')}>View all &gt;</button>
            <Sparkline strokeColor="#2dd4bf" />
          </div>

        </div>

        {/* Panels Double Column */}
        <div className="solar-db-panels-grid">
          
          <div className="solar-db-panel-card">
            <div className="solar-db-panel-header">
              <h3 className="solar-db-panel-title">👤 Recent Leads</h3>
              <button className="solar-db-panel-link" onClick={() => setActiveTab('leads')}>View All Leads</button>
            </div>
            <div className="solar-db-leads-list">
              {leads.slice(0, 5).map(lead => (
                <div key={lead.id} className="solar-db-lead-row">
                  <div className="solar-db-lead-left">
                    <div className="solar-db-lead-avatar">👤</div>
                    <div className="solar-db-lead-details">
                      <h5>{lead.name}</h5>
                      <p>{lead.email} · {lead.phone}</p>
                    </div>
                  </div>
                  <div className="solar-db-lead-right">
                    <StatusBadge status={lead.status} styleGetter={(s) => ({
                      bg: s === 'PENDING' ? 'rgba(239,68,68,0.15)' : s === 'CONVERTED' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                      color: s === 'PENDING' ? '#f87171' : s === 'CONVERTED' ? '#10b981' : '#fbbf24',
                      border: s === 'PENDING' ? 'rgba(239,68,68,0.3)' : s === 'CONVERTED' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)',
                      label: s === 'PENDING' ? 'New' : s === 'CONVERTED' ? 'Qualified' : s
                    })} />
                  </div>
                </div>
              ))}
              {leads.length === 0 && <p style={{ color: '#64748b', fontSize: '0.88rem', textAlign: 'center' }}>No leads assigned.</p>}
            </div>
          </div>

          <div className="solar-db-panel-card">
            <div className="solar-db-panel-header">
              <h3 className="solar-db-panel-title">📈 Recent Activities</h3>
              <button className="solar-db-panel-link" onClick={() => setActiveTab('projects')}>View All Activities</button>
            </div>
            <div className="solar-db-timeline">
              {leads.slice(0, 2).map((l, idx) => (
                <div key={l.id} className="solar-db-timeline-item green">
                  <div className="solar-db-timeline-marker"></div>
                  <div className="solar-db-timeline-content">
                    <h5>New lead {l.name} has been assigned to you.</h5>
                    <p>Contact Details: {l.phone}</p>
                  </div>
                </div>
              ))}
              {quotes.slice(0, 2).map((q, idx) => (
                <div key={q.id} className="solar-db-timeline-item blue">
                  <div className="solar-db-timeline-marker"></div>
                  <div className="solar-db-timeline-content">
                    <h5>Quotation prepared for {q.lead_details?.name || 'Customer'}.</h5>
                    <p>Amount: ${parseFloat(q.total_amount).toLocaleString()} · Status: {q.status}</p>
                  </div>
                </div>
              ))}
              {myProjects.slice(0, 1).map((p, idx) => (
                <div key={p.id} className="solar-db-timeline-item orange">
                  <div className="solar-db-timeline-marker"></div>
                  <div className="solar-db-timeline-content">
                    <h5>Installation project #{p.id} active.</h5>
                    <p>Status: {p.status.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Sidebar link clicks (full lists)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Notification msg={msg} type={msgType} />

      {activeTab === 'leads' && (
        <section className="solar-table-panel animate-fade-in">
          <SectionHeader icon="📂" title="Assigned Leads" />
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            {leads.length === 0 ? <EmptyState msg="No leads assigned yet." /> :
              leads.map(lead => (
                <div key={lead.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#ffb100' }}>{lead.name}</h3>
                    <StatusBadge status={lead.status} styleGetter={(s) => ({
                      bg: s === 'PENDING' ? 'rgba(239,68,68,0.15)' : s === 'CONVERTED' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                      color: s === 'PENDING' ? '#f87171' : s === 'CONVERTED' ? '#10b981' : '#fbbf24',
                      border: s === 'PENDING' ? 'rgba(239,68,68,0.3)' : s === 'CONVERTED' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)',
                      label: s
                    })} />
                  </div>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>{lead.email} · {lead.phone}</p>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#ffffff', lineHeight: 1.5 }}>{lead.interest_details}</p>

                  {selectedLead?.id === lead.id ? (
                    <form onSubmit={handleGenerateQuote} style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#ffffff' }}>Prepare Quotation</h4>
                      <div className="input-group">
                        <textarea required className="input-field" rows="2" placeholder="System Description" value={quoteData.items_description} onChange={e => setQuoteData({ ...quoteData, items_description: e.target.value })} style={{ marginBottom: '0.5rem' }} />
                      </div>
                      <div className="input-group">
                        <input required type="number" step="0.01" className="input-field" placeholder="Total Amount ($)" value={quoteData.total_amount} onChange={e => setQuoteData({ ...quoteData, total_amount: e.target.value })} style={{ marginBottom: '0.75rem' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Send</button>
                        <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setSelectedLead(null)}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    lead.status !== 'CONVERTED' && (
                      <button onClick={() => setSelectedLead(lead)} className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '8px 16px', borderRadius: '8px' }}>
                        Prepare Quotation
                      </button>
                    )
                  )}
                </div>
              ))
            }
          </div>
        </section>
      )}

      {activeTab === 'quotes' && (
        <section className="solar-table-panel animate-fade-in">
          <SectionHeader icon="📋" title="Prepared Quotations" />
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            {quotes.length === 0 ? <EmptyState msg="No quotations yet." /> :
              quotes.map(q => (
                <div key={q.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#ffffff' }}>Quote #{q.id}</h4>
                    <StatusBadge status={q.status} styleGetter={(s) => ({
                      bg: s === 'PENDING' ? 'rgba(245,158,11,0.15)' : s === 'ACCEPTED' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      color: s === 'PENDING' ? '#fbbf24' : s === 'ACCEPTED' ? '#10b981' : '#f87171',
                      border: s === 'PENDING' ? 'rgba(245,158,11,0.3)' : s === 'ACCEPTED' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
                      label: s
                    })} />
                  </div>
                  <p style={{ fontSize: '0.85rem', marginBottom: '0.25rem', color: '#94a3b8' }}><strong>Lead:</strong> {q.lead_details?.name || '—'}</p>
                  <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: '#ffffff' }}>{q.items_description}</p>
                  <p style={{ fontSize: '1.1rem', color: '#ffb100', fontWeight: '750', margin: 0 }}>${parseFloat(q.total_amount).toLocaleString()}</p>
                  {q.status === 'REJECTED' && (
                    <button onClick={() => { setSelectedLead(q.lead_details); setQuoteData({ items_description: q.items_description, total_amount: q.total_amount }); }}
                      className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px', marginTop: '0.75rem', borderColor: '#ffb100', color: '#ffb100', borderRadius: '8px' }}>
                      Revise
                    </button>
                  )}
                </div>
              ))
            }
          </div>
        </section>
      )}

      {activeTab === 'projects' && (
        <section className="solar-table-panel animate-fade-in">
          <SectionHeader icon="🔧" title="Installation Projects" />
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            {myProjects.length === 0 ? <EmptyState msg="No projects yet." /> :
              myProjects.map(proj => (
                <div key={proj.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ margin: 0, color: '#ffffff', fontSize: '1rem' }}>Project #{proj.id}</h4>
                    <StatusBadge status={proj.status} styleGetter={getProjectStatusStyle} />
                  </div>
                  <p style={{ fontSize: '0.85rem', marginBottom: '0.25rem', color: '#ffffff' }}><strong>Customer:</strong> {proj.customer_username}</p>
                  <p style={{ fontSize: '0.85rem', marginBottom: '0.25rem', color: '#ffffff' }}><strong>Technician:</strong> {proj.technician_username || 'Unassigned'}</p>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>{proj.quotation_items}</p>
                </div>
              ))
            }
          </div>
        </section>
      )}

      {activeTab === 'invoices' && (
        <section className="solar-table-panel animate-fade-in">
          <SectionHeader icon="🧾" title="Invoices" />
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            {invoices.length === 0 ? <EmptyState msg="No invoices generated yet." /> :
              invoices.map(inv => (
                <div key={inv.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, color: '#ffffff' }}>Invoice #{inv.id}</h4>
                    <StatusBadge status={inv.status} styleGetter={(s) => ({
                      bg: s === 'PAID' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                      color: s === 'PAID' ? '#10b981' : '#fbbf24',
                      border: s === 'PAID' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)',
                      label: s
                    })} />
                  </div>
                  <p style={{ fontSize: '1.3rem', fontWeight: '750', color: '#ffb100', marginBottom: '0.5rem' }}>
                    ${parseFloat(inv.amount).toLocaleString()}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#ffffff', margin: '0 0 0.25rem' }}><strong>Customer:</strong> {inv.customer_username}</p>
                  <p style={{ fontSize: '0.85rem', color: '#ffffff', margin: '0 0 0.5rem' }}><strong>Project:</strong> {inv.project_lead_name}</p>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{new Date(inv.created_at).toLocaleDateString()}</p>
                </div>
              ))
            }
          </div>
        </section>
      )}

      {activeTab === 'attendance_leaves' && (
        <EmployeeAttendanceLeavesTab api={api} user={user} />
      )}

      {activeTab === 'tickets' && (
        <section className="solar-table-panel animate-fade-in">
          <SectionHeader icon="🎫" title="Customer Support Tickets" />
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            {tickets.length === 0 ? <EmptyState msg="No support tickets yet." /> :
              tickets.map(t => (
                <div key={t.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#ffffff' }}>Ticket #{t.id}</h4>
                    <StatusBadge status={t.status} styleGetter={getTicketStatusStyle} />
                  </div>
                  <p style={{ fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.25rem', color: '#ffffff' }}>{t.subject}</p>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 0.25rem' }}><strong>Customer:</strong> {t.customer_username}</p>
                  {t.assigned_technician_username && (
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}><strong>Tech Assigned:</strong> {t.assigned_technician_username}</p>
                  )}
                </div>
              ))
            }
          </div>
        </section>
      )}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TECHNICIAN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function TechnicianDashboard({ activeTab, setActiveTab }) {
  const { user, api } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [tickets, setTickets]   = useState([]);
  const [msg, setMsg] = useState(''); const [msgType, setMsgType] = useState('success');

  const flash = (text, type = 'success') => { setMsgType(type); setMsg(text); setTimeout(() => setMsg(''), 5000); };

  const fetchAll = useCallback(async () => {
    try {
      const [p, t] = await Promise.all([api.get('projects/'), api.get('tickets/')]);
      setProjects(p.data); setTickets(t.data);
    } catch (e) { console.error(e); }
  }, [api]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleProjectStatus = async (id, status) => {
    try {
      await api.patch(`projects/${id}/`, { status });
      flash(`Status updated to: ${status.replace(/_/g, ' ')}`);
      fetchAll();
    } catch { flash('Failed to update.', 'error'); }
  };

  const handleTicketStatus = async (id, status) => {
    try {
      await api.patch(`tickets/${id}/`, { status });
      flash(`Ticket marked as: ${status.replace(/_/g, ' ')}`);
      fetchAll();
    } catch { flash('Failed to update ticket.', 'error'); }
  };

  // Overview Tab Layout
  if (activeTab === 'dashboard') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Notification msg={msg} type={msgType} />
        
        {/* Banner */}
        <div className="solar-db-hero-banner">
          <div className="solar-db-banner-left">
            <SolarHouseIllustration />
            <div className="solar-db-banner-text">
              <h2>Powering a Sustainable Future</h2>
              <p>Manage solar project execution stages and resolve assigned customer support requests directly in real-time.</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="solar-db-stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          
          <div className="solar-db-stat-card green">
            <div className="solar-db-stat-card-header">
              <div className="solar-db-stat-card-icon">🔧</div>
            </div>
            <div className="solar-db-stat-card-number">{projects.length}</div>
            <div className="solar-db-stat-card-label">Installation Projects</div>
            <button className="solar-db-stat-card-link" onClick={() => setActiveTab('projects')}>View all &gt;</button>
            <Sparkline strokeColor="#10b981" />
          </div>

          <div className="solar-db-stat-card blue">
            <div className="solar-db-stat-card-header">
              <div className="solar-db-stat-card-icon">🎫</div>
            </div>
            <div className="solar-db-stat-card-number">{tickets.length}</div>
            <div className="solar-db-stat-card-label">Support Tickets</div>
            <button className="solar-db-stat-card-link" onClick={() => setActiveTab('tickets')}>View all &gt;</button>
            <Sparkline strokeColor="#3b82f6" />
          </div>

        </div>

        {/* Double column lists */}
        <div className="solar-db-panels-grid">
          
          <div className="solar-db-panel-card">
            <div className="solar-db-panel-header">
              <h3 className="solar-db-panel-title">🔧 Assigned Projects</h3>
              <button className="solar-db-panel-link" onClick={() => setActiveTab('projects')}>View All</button>
            </div>
            <div className="solar-db-leads-list">
              {projects.slice(0, 3).map(proj => (
                <div key={proj.id} className="solar-db-lead-row">
                  <div className="solar-db-lead-left">
                    <ProjectThumbnail />
                    <div className="solar-db-lead-details">
                      <h5>{proj.lead_name}</h5>
                      <p>Customer: {proj.customer_username}</p>
                      {proj.created_at && (
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          📅 {new Date(proj.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="solar-db-lead-right">
                    <StatusBadge status={proj.status} styleGetter={getProjectStatusStyle} />
                  </div>
                </div>
              ))}
              {projects.length === 0 && <p style={{ color: '#64748b', fontSize: '0.88rem', textAlign: 'center' }}>No projects assigned.</p>}
            </div>
          </div>

          <div className="solar-db-panel-card">
            <div className="solar-db-panel-header">
              <h3 className="solar-db-panel-title">🎫 Support Tickets</h3>
              <button className="solar-db-panel-link" onClick={() => setActiveTab('tickets')}>View All</button>
            </div>
            <div className="solar-db-leads-list">
              {tickets.slice(0, 3).map(t => (
                <div key={t.id} className="solar-db-lead-row">
                  <div className="solar-db-lead-left">
                    <div className="solar-db-lead-avatar">🎫</div>
                    <div className="solar-db-lead-details">
                      <h5>{t.subject}</h5>
                      <p>Customer: {t.customer_username}</p>
                    </div>
                  </div>
                  <div className="solar-db-lead-right">
                    <StatusBadge status={t.status} styleGetter={getTicketStatusStyle} />
                  </div>
                </div>
              ))}
              {tickets.length === 0 && <p style={{ color: '#64748b', fontSize: '0.88rem', textAlign: 'center' }}>No support tickets assigned.</p>}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Sidebar link clicks (full technician pages)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Notification msg={msg} type={msgType} />

      {activeTab === 'attendance_leaves' && (
        <EmployeeAttendanceLeavesTab api={api} user={user} />
      )}

      {activeTab === 'projects' && (
        <section className="solar-table-panel animate-fade-in">
          <SectionHeader icon="🔧" title="My Installation Projects" />
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            {projects.length === 0 ? <EmptyState msg="No installation projects assigned to you." /> :
              projects.map(proj => (
                <div key={proj.id} className="glass-panel animate-fade-in" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', minHeight: '280px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Project #{proj.id}</span>
                    <StatusBadge status={proj.status} styleGetter={getProjectStatusStyle} />
                  </div>
                  <h3 style={{ color: '#ffb100', marginBottom: '0.5rem' }}>{proj.lead_name}</h3>
                  <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem', color: '#ffffff' }}><strong>Customer:</strong> {proj.customer_username}</p>
                  <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem', color: '#ffffff' }}><strong>Amount:</strong> ${parseFloat(proj.quotation_amount).toLocaleString()}</p>
                  <p style={{ fontSize: '0.9rem', color: '#94a3b8', flex: 1 }}>{proj.quotation_items}</p>
                  <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {proj.status === 'SCHEDULED'           && <button onClick={() => handleProjectStatus(proj.id, 'INSTALLATION_STARTED')} className="btn btn-primary" style={{ width: '100%' }}>⚡ Accept &amp; Start Installation</button>}
                    {proj.status === 'INSTALLATION_STARTED'&& <button onClick={() => handleProjectStatus(proj.id, 'WORK_IN_PROGRESS')} className="btn btn-primary" style={{ width: '100%', background: '#3b82f6', borderColor: '#3b82f6' }}>⚙️ Mark as Work in Progress</button>}
                    {proj.status === 'WORK_IN_PROGRESS'    && <button onClick={() => handleProjectStatus(proj.id, 'HALFWAY_COMPLETED')} className="btn btn-primary" style={{ width: '100%', background: '#f59e0b', borderColor: '#f59e0b' }}>🌗 Mark as Halfway Completed</button>}
                    {proj.status === 'HALFWAY_COMPLETED'   && <button onClick={() => handleProjectStatus(proj.id, 'INSTALLATION_COMPLETED')} className="btn btn-primary" style={{ width: '100%', background: '#10b981', borderColor: '#10b981' }}>✅ Mark as Installation Completed</button>}
                    {proj.status === 'INSTALLATION_COMPLETED' && (
                      <button disabled className="btn" style={{ width: '100%', opacity: 0.6, cursor: 'not-allowed' }}>✓ Installation Finished — Report available in Admin</button>
                    )}
                  </div>
                </div>
              ))
            }
          </div>
        </section>
      )}

      {activeTab === 'tickets' && (
        <section className="solar-table-panel animate-fade-in">
          <SectionHeader icon="🎫" title="Assigned Support Tickets" />
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            {tickets.length === 0 ? <EmptyState msg="No support tickets assigned to you." /> :
              tickets.map(t => (
                <div key={t.id} className="glass-panel animate-fade-in" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', minHeight: '200px', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Ticket #{t.id}</span>
                    <StatusBadge status={t.status} styleGetter={getTicketStatusStyle} />
                  </div>
                  <h3 style={{ color: '#ffffff', marginBottom: '0.5rem', fontSize: '1rem' }}>{t.subject}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#94a3b8', flex: 1 }}>{t.description}</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: '#ffffff' }}><strong>Customer:</strong> {t.customer_username}</p>
                  {t.project_lead_name && <p style={{ fontSize: '0.85rem', color: '#ffffff' }}><strong>Project:</strong> {t.project_lead_name}</p>}
                  <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                    {t.status === 'ASSIGNED' && (
                      <button onClick={() => handleTicketStatus(t.id, 'IN_PROGRESS')} className="btn btn-primary" style={{ flex: 1, background: '#f59e0b', borderColor: '#f59e0b' }}>
                        ▶ Mark In Progress
                      </button>
                    )}
                    {t.status === 'IN_PROGRESS' && (
                      <button onClick={() => handleTicketStatus(t.id, 'RESOLVED')} className="btn btn-primary" style={{ flex: 1, background: '#3b82f6', borderColor: '#3b82f6' }}>
                        ✔ Mark as Resolved
                      </button>
                    )}
                    {(t.status === 'RESOLVED' || t.status === 'SUCCESSFULLY_RESOLVED') && (
                      <button disabled className="btn" style={{ flex: 1, opacity: 0.6, cursor: 'not-allowed' }}>
                        {t.status === 'SUCCESSFULLY_RESOLVED' ? '✓ Successfully Resolved' : '⏳ Awaiting Customer Care'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            }
          </div>
        </section>
      )}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER CARE DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function CustomerCareDashboard({ activeTab, setActiveTab }) {
  const { user, api } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [msg, setMsg] = useState(''); const [msgType, setMsgType] = useState('success');

  const flash = (text, type = 'success') => { setMsgType(type); setMsg(text); setTimeout(() => setMsg(''), 5000); };

  const fetchTickets = useCallback(async () => {
    try {
      const res = await api.get('tickets/');
      setTickets(res.data);
    } catch (e) { console.error(e); }
  }, [api]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleAssignTechnician = async (ticketId, technicianId) => {
    if (!technicianId) return;
    try {
      await api.patch(`tickets/${ticketId}/`, { assigned_technician: technicianId, status: 'ASSIGNED' });
      flash('Ticket assigned to technician!');
      fetchTickets();
    } catch { flash('Failed to assign technician.', 'error'); }
  };

  const handleCloseTicket = async (ticketId) => {
    try {
      await api.patch(`tickets/${ticketId}/`, { status: 'SUCCESSFULLY_RESOLVED' });
      flash('Ticket closed as Successfully Resolved!');
      fetchTickets();
    } catch { flash('Failed to close ticket.', 'error'); }
  };

  const open    = tickets.filter(t => ['OPEN'].includes(t.status));
  const active  = tickets.filter(t => ['ASSIGNED', 'IN_PROGRESS'].includes(t.status));
  const resolved= tickets.filter(t => ['RESOLVED', 'SUCCESSFULLY_RESOLVED'].includes(t.status));

  const TicketCard = ({ t }) => (
    <div className="glass-panel animate-fade-in" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Ticket #{t.id}</span>
        <StatusBadge status={t.status} styleGetter={getTicketStatusStyle} />
      </div>
      <h3 style={{ fontSize: '1rem', color: '#ffffff', margin: 0 }}>{t.subject}</h3>
      <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0 }}>{t.description}</p>

      <div style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <p style={{ fontSize: '0.85rem', margin: 0, color: '#ffffff' }}><strong>👤 Customer:</strong> {t.customer_username} ({t.customer_email})</p>
        {t.project_lead_name && <p style={{ fontSize: '0.85rem', margin: 0, color: '#ffffff' }}><strong>🏗 Project:</strong> {t.project_lead_name}</p>}
        {t.project_quotation_items && <p style={{ fontSize: '0.85rem', margin: 0, color: '#94a3b8' }}><strong>System:</strong> {t.project_quotation_items}</p>}
        {t.project_technician_username && <p style={{ fontSize: '0.85rem', margin: 0, color: '#ffffff' }}><strong>🔧 Installer:</strong> {t.project_technician_username}</p>}
        {t.assigned_technician_username && <p style={{ fontSize: '0.85rem', margin: 0, color: '#ffffff' }}><strong>📌 Assigned To:</strong> {t.assigned_technician_username}</p>}
      </div>

      {/* Assign to technician */}
      {t.status === 'OPEN' && t.project_technician_id && (
        <button
          onClick={() => handleAssignTechnician(t.id, t.project_technician_id)}
          className="btn btn-primary"
          style={{ alignSelf: 'flex-start', padding: '8px 16px', fontSize: '0.9rem', marginTop: '0.5rem' }}
        >
          📌 Assign to {t.project_technician_username}
        </button>
      )}

      {/* Close ticket */}
      {t.status === 'RESOLVED' && (
        <button
          onClick={() => handleCloseTicket(t.id)}
          className="btn btn-primary"
          style={{ alignSelf: 'flex-start', padding: '8px 16px', fontSize: '0.9rem', background: '#10b981', borderColor: '#10b981', marginTop: '0.5rem' }}
        >
          ✅ Close as Successfully Resolved
        </button>
      )}

      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.5rem 0 0 0' }}>
        {new Date(t.created_at).toLocaleString()}
      </p>
    </div>
  );

  // Overview Tab Layout
  if (activeTab === 'dashboard') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Notification msg={msg} type={msgType} />
        
        {/* Banner */}
        <div className="solar-db-hero-banner">
          <div className="solar-db-banner-left">
            <SolarHouseIllustration />
            <div className="solar-db-banner-text">
              <h2>Powering a Sustainable Future</h2>
              <p>Manage customer support tickets lifecycle, assign resolution tasks to site technicians, and review issues resolution status.</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="solar-db-stats-grid">
          
          <div className="solar-db-stat-card green">
            <div className="solar-db-stat-card-header">
              <div className="solar-db-stat-card-icon">🔴</div>
            </div>
            <div className="solar-db-stat-card-number">{open.length}</div>
            <div className="solar-db-stat-card-label">Open Tickets</div>
            <button className="solar-db-stat-card-link" onClick={() => setActiveTab('tickets')}>View all &gt;</button>
            <Sparkline strokeColor="#ef4444" />
          </div>

          <div className="solar-db-stat-card blue">
            <div className="solar-db-stat-card-header">
              <div className="solar-db-stat-card-icon">🟡</div>
            </div>
            <div className="solar-db-stat-card-number">{active.length}</div>
            <div className="solar-db-stat-card-label">Active Tickets</div>
            <button className="solar-db-stat-card-link" onClick={() => setActiveTab('tickets')}>View all &gt;</button>
            <Sparkline strokeColor="#fbbf24" />
          </div>

          <div className="solar-db-stat-card orange">
            <div className="solar-db-stat-card-header">
              <div className="solar-db-stat-card-icon">🟢</div>
            </div>
            <div className="solar-db-stat-card-number">{resolved.length}</div>
            <div className="solar-db-stat-card-label">Resolved Tickets</div>
            <button className="solar-db-stat-card-link" onClick={() => setActiveTab('tickets')}>View all &gt;</button>
            <Sparkline strokeColor="#10b981" />
          </div>

          <div className="solar-db-stat-card purple">
            <div className="solar-db-stat-card-header">
              <div className="solar-db-stat-card-icon">🎫</div>
            </div>
            <div className="solar-db-stat-card-number">{tickets.length}</div>
            <div className="solar-db-stat-card-label">Total Tickets</div>
            <button className="solar-db-stat-card-link" onClick={() => setActiveTab('tickets')}>View all &gt;</button>
            <Sparkline strokeColor="#a855f7" />
          </div>

        </div>

        {/* Double column lists */}
        <div className="solar-db-panels-grid">
          
          <div className="solar-db-panel-card">
            <div className="solar-db-panel-header">
              <h3 className="solar-db-panel-title">🔴 Urgent Open Tickets</h3>
              <button className="solar-db-panel-link" onClick={() => setActiveTab('tickets')}>View All</button>
            </div>
            <div className="solar-db-leads-list">
              {open.slice(0, 3).map(t => (
                <div key={t.id} className="solar-db-lead-row">
                  <div className="solar-db-lead-left">
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '1.1rem', flexShrink: 0
                    }}>
                      💬
                    </div>
                    <div className="solar-db-lead-details">
                      <h5>{t.subject}</h5>
                      <p>Customer: {t.customer_username}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        📅 {new Date(t.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="solar-db-lead-right">
                    <StatusBadge status={t.status} styleGetter={getTicketStatusStyle} />
                  </div>
                </div>
              ))}
              {open.length === 0 && <p style={{ color: '#64748b', fontSize: '0.88rem', textAlign: 'center' }}>No open tickets.</p>}
            </div>
          </div>

          <div className="solar-db-panel-card">
            <div className="solar-db-panel-header">
              <h3 className="solar-db-panel-title">🟢 Recent Resolved</h3>
              <button className="solar-db-panel-link" onClick={() => setActiveTab('tickets')}>View All</button>
            </div>
            <div className="solar-db-leads-list">
              {resolved.slice(0, 3).map(t => (
                <div key={t.id} className="solar-db-lead-row">
                  <div className="solar-db-lead-left">
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '1.1rem', flexShrink: 0
                    }}>
                      💬
                    </div>
                    <div className="solar-db-lead-details">
                      <h5>{t.subject}</h5>
                      <p>Customer: {t.customer_username}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        📅 {new Date(t.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="solar-db-lead-right">
                    <StatusBadge status={t.status} styleGetter={getTicketStatusStyle} />
                  </div>
                </div>
              ))}
              {resolved.length === 0 && <p style={{ color: '#64748b', fontSize: '0.88rem', textAlign: 'center' }}>No resolved tickets.</p>}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Sidebar link clicks (full Customer Care page)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <Notification msg={msg} type={msgType} />

      {activeTab === 'attendance_leaves' && (
        <EmployeeAttendanceLeavesTab api={api} user={user} />
      )}

      {activeTab === 'tickets' && (
        <>
          {/* Open tickets */}
          <section className="solar-table-panel animate-fade-in">
            <SectionHeader icon="🔴" title={`Open Tickets (${open.length})`} />
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
              {open.length === 0 ? <EmptyState msg="No open tickets." /> : open.map(t => <TicketCard key={t.id} t={t} />)}
            </div>
          </section>

          {/* Active tickets */}
          <section className="solar-table-panel animate-fade-in">
            <SectionHeader icon="🟡" title={`Active Tickets (${active.length})`} />
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
              {active.length === 0 ? <EmptyState msg="No active tickets." /> : active.map(t => <TicketCard key={t.id} t={t} />)}
            </div>
          </section>

          {/* Resolved tickets */}
          <section className="solar-table-panel animate-fade-in">
            <SectionHeader icon="🟢" title={`Resolved Tickets (${resolved.length})`} />
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
              {resolved.length === 0 ? <EmptyState msg="No resolved tickets." /> : resolved.map(t => <TicketCard key={t.id} t={t} />)}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function AdminDashboard({ activeTab, setActiveTab }) {
  const { api } = useContext(AuthContext);
  const navigate = useNavigate();

  const [stats, setStats]       = useState({ leads: 0, quotations: 0, projects: 0, tickets: 0, invoices: 0 });
  const [leads, setLeads]       = useState([]);
  const [projects, setProjects] = useState([]);

  // Reports tab state
  const [searchQuery, setSearchQuery]     = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo]     = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lr, qr, pr, tr, ir] = await Promise.all([
          api.get('leads/'), api.get('quotations/'), api.get('projects/'),
          api.get('tickets/'), api.get('invoices/')
        ]);
        setStats({ leads: lr.data.length, quotations: qr.data.length, projects: pr.data.length, tickets: tr.data.length, invoices: ir.data.length });
        setLeads(lr.data);
        setProjects(pr.data);
      } catch (e) { console.error(e); }
    };
    fetchData();
  }, [api]);

  const completedProjects = projects.filter(p => p.status === 'INSTALLATION_COMPLETED');
  const filteredReports   = completedProjects.filter(proj => {
    const q           = searchQuery.toLowerCase();
    const matchSearch = !q ||
      proj.lead_name?.toLowerCase().includes(q) ||
      proj.customer_username?.toLowerCase().includes(q) ||
      proj.technician_username?.toLowerCase().includes(q) ||
      String(proj.id).includes(q);
    const created   = new Date(proj.created_at);
    const matchFrom = !filterDateFrom || created >= new Date(filterDateFrom);
    const matchTo   = !filterDateTo   || created <= new Date(filterDateTo + 'T23:59:59');
    return matchSearch && matchFrom && matchTo;
  });

  // Overview Tab Layout - Premium Admin Dashboard
  const [leadsPage, setLeadsPage] = React.useState(1);
  const leadsPerPage = 6;
  const totalLeadsPages = Math.ceil(leads.length / leadsPerPage);
  const paginatedLeads = leads.slice((leadsPage - 1) * leadsPerPage, leadsPage * leadsPerPage);

  if (activeTab === 'dashboard') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* Premium Hero Banner */}
        <div className="admin-hero-banner">
          <div className="admin-hero-left">
            <div className="admin-hero-illustration">
              <svg width="110" height="80" viewBox="0 0 110 80" fill="none">
                <ellipse cx="55" cy="72" rx="48" ry="6" fill="rgba(16,185,129,0.12)" />
                {/* Ground */}
                <rect x="10" y="64" width="90" height="2" rx="1" fill="#4ade80" opacity="0.5" />
                {/* House body */}
                <rect x="28" y="42" width="44" height="28" rx="3" fill="white" stroke="#e2e8f0" strokeWidth="1.5" />
                {/* Door */}
                <rect x="43" y="56" width="14" height="14" rx="2" fill="#10b981" opacity="0.8" />
                {/* Window */}
                <rect x="32" y="47" width="10" height="9" rx="1" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1" />
                <line x1="37" y1="47" x2="37" y2="56" stroke="#93c5fd" strokeWidth="0.8" />
                <line x1="32" y1="51.5" x2="42" y2="51.5" stroke="#93c5fd" strokeWidth="0.8" />
                {/* Window right */}
                <rect x="58" y="47" width="10" height="9" rx="1" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1" />
                <line x1="63" y1="47" x2="63" y2="56" stroke="#93c5fd" strokeWidth="0.8" />
                <line x1="58" y1="51.5" x2="68" y2="51.5" stroke="#93c5fd" strokeWidth="0.8" />
                {/* Roof */}
                <polygon points="22,42 55,18 88,42" fill="#10b981" opacity="0.9" />
                <polygon points="24,42 55,20 86,42" fill="#34d399" opacity="0.5" />
                {/* Chimney */}
                <rect x="65" y="22" width="7" height="12" rx="1" fill="#6b7280" />
                {/* Solar panels on roof */}
                <rect x="35" y="30" width="16" height="9" rx="1" fill="#1e40af" opacity="0.85" stroke="#3b82f6" strokeWidth="0.8" />
                <line x1="35" y1="34.5" x2="51" y2="34.5" stroke="#60a5fa" strokeWidth="0.6" />
                <line x1="43" y1="30" x2="43" y2="39" stroke="#60a5fa" strokeWidth="0.6" />
                <rect x="53" y="27" width="16" height="9" rx="1" fill="#1e40af" opacity="0.85" stroke="#3b82f6" strokeWidth="0.8" />
                <line x1="53" y1="31.5" x2="69" y2="31.5" stroke="#60a5fa" strokeWidth="0.6" />
                <line x1="61" y1="27" x2="61" y2="36" stroke="#60a5fa" strokeWidth="0.6" />
                {/* Sun */}
                <circle cx="88" cy="16" r="8" fill="#fbbf24" />
                <line x1="88" y1="4" x2="88" y2="7" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="88" y1="25" x2="88" y2="28" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="76" y1="16" x2="79" y2="16" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="97" y1="16" x2="100" y2="16" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="80" y1="8" x2="82" y2="10" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="94" y1="22" x2="96" y2="24" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
                {/* Trees */}
                <rect x="14" y="54" width="4" height="10" rx="1" fill="#6b7280" />
                <circle cx="16" cy="52" r="8" fill="#4ade80" opacity="0.8" />
                <circle cx="16" cy="52" r="5" fill="#16a34a" opacity="0.5" />
                <rect x="93" y="56" width="4" height="8" rx="1" fill="#6b7280" />
                <circle cx="95" cy="54" r="7" fill="#4ade80" opacity="0.8" />
                {/* Energy rays */}
                <path d="M51 28 Q45 20 42 14" stroke="#fbbf24" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
                <path d="M61 25 Q70 15 78 10" stroke="#fbbf24" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
              </svg>
            </div>
            <div className="admin-hero-text">
              <h2>Powering a <span style={{ color: '#10b981' }}>Sustainable</span> Future</h2>
              <p>Solar ERP Admin Dashboard helps you review solar project execution summaries, track invoices, and analyze completion reports.</p>
            </div>
          </div>
          <div className="admin-hero-stats">
            <div className="admin-hero-stat">
              <div className="admin-hero-stat-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>⚡</div>
              <div>
                <div className="admin-hero-stat-num">{projects.length}</div>
                <div className="admin-hero-stat-lbl">Active Projects</div>
              </div>
            </div>
            <div className="admin-hero-stat">
              <div className="admin-hero-stat-icon" style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316' }}>👥</div>
              <div>
                <div className="admin-hero-stat-num">{leads.length}</div>
                <div className="admin-hero-stat-lbl">Total Leads</div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium KPI Stats Grid */}
        <div className="admin-kpi-grid">
          
          <div className="admin-kpi-card" style={{ '--kpi-accent': '#6366f1', '--kpi-bg': 'rgba(99,102,241,0.08)' }}>
            <div className="admin-kpi-top">
              <div className="admin-kpi-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>👥</div>
            </div>
            <div className="admin-kpi-number">{stats.leads}</div>
            <div className="admin-kpi-label">Total Leads</div>
            <div className="admin-kpi-trend up">
              <span className="admin-kpi-arrow">↑</span> 18%
              <span className="admin-kpi-sub">vs last month</span>
            </div>
            <svg className="admin-kpi-sparkline" viewBox="0 0 120 30" preserveAspectRatio="none">
              <path d="M0,22 C20,18 35,8 60,14 C85,20 100,10 120,8" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>

          <div className="admin-kpi-card" style={{ '--kpi-accent': '#3b82f6', '--kpi-bg': 'rgba(59,130,246,0.08)' }}>
            <div className="admin-kpi-top">
              <div className="admin-kpi-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>📄</div>
            </div>
            <div className="admin-kpi-number">{stats.quotations}</div>
            <div className="admin-kpi-label">Quotations</div>
            <div className="admin-kpi-trend up">
              <span className="admin-kpi-arrow">↑</span> 12%
              <span className="admin-kpi-sub">vs last month</span>
            </div>
            <svg className="admin-kpi-sparkline" viewBox="0 0 120 30" preserveAspectRatio="none">
              <path d="M0,24 C15,20 30,12 55,16 C80,20 100,12 120,10" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>

          <div className="admin-kpi-card" style={{ '--kpi-accent': '#10b981', '--kpi-bg': 'rgba(16,185,129,0.08)' }}>
            <div className="admin-kpi-top">
              <div className="admin-kpi-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>☀️</div>
            </div>
            <div className="admin-kpi-number">{stats.projects}</div>
            <div className="admin-kpi-label">Projects</div>
            <div className="admin-kpi-trend up">
              <span className="admin-kpi-arrow">↑</span> 9%
              <span className="admin-kpi-sub">vs last month</span>
            </div>
            <svg className="admin-kpi-sparkline" viewBox="0 0 120 30" preserveAspectRatio="none">
              <path d="M0,20 C25,16 40,8 65,14 C90,20 105,14 120,12" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>

          <div className="admin-kpi-card" style={{ '--kpi-accent': '#f97316', '--kpi-bg': 'rgba(249,115,22,0.08)' }}>
            <div className="admin-kpi-top">
              <div className="admin-kpi-icon" style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316' }}>🎧</div>
            </div>
            <div className="admin-kpi-number">{stats.tickets}</div>
            <div className="admin-kpi-label">Support Tickets</div>
            <div className="admin-kpi-trend down">
              <span className="admin-kpi-arrow">↓</span> 5%
              <span className="admin-kpi-sub">vs last month</span>
            </div>
            <svg className="admin-kpi-sparkline" viewBox="0 0 120 30" preserveAspectRatio="none">
              <path d="M0,12 C20,14 40,18 65,16 C90,14 105,18 120,22" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>

          <div className="admin-kpi-card" style={{ '--kpi-accent': '#ef4444', '--kpi-bg': 'rgba(239,68,68,0.08)' }}>
            <div className="admin-kpi-top">
              <div className="admin-kpi-icon" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>🧾</div>
            </div>
            <div className="admin-kpi-number">{stats.invoices}</div>
            <div className="admin-kpi-label">Invoices</div>
            <div className="admin-kpi-trend up">
              <span className="admin-kpi-arrow">↑</span> 7%
              <span className="admin-kpi-sub">vs last month</span>
            </div>
            <svg className="admin-kpi-sparkline" viewBox="0 0 120 30" preserveAspectRatio="none">
              <path d="M0,22 C20,16 40,20 65,14 C90,8 105,12 120,10" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>

        </div>

        {/* Recent Leads Premium Table */}
        <div className="admin-table-card">
          <div className="admin-table-header">
            <div className="admin-table-title">
              <span className="admin-table-icon">👥</span>
              <span>Recent Leads</span>
            </div>
            <button className="admin-view-all-btn" onClick={() => setActiveTab('reports')}>
              View All Leads →
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-leads-table">
              <thead>
                <tr>
                  {['#', 'Name', 'Email', 'Status', 'Assigned To', 'Created On'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedLeads.map((lead, idx) => (
                  <tr key={lead.id}>
                    <td className="admin-lead-num">#{(leadsPage - 1) * leadsPerPage + idx + 1}</td>
                    <td className="admin-lead-name">{lead.name}</td>
                    <td className="admin-lead-email">{lead.email}</td>
                    <td>
                      <span className="admin-lead-badge pending">{lead.status || 'PENDING'}</span>
                    </td>
                    <td className="admin-lead-assign">{lead.assigned_sales_exec || lead.assigned_to_id || '—'}</td>
                    <td className="admin-lead-date">
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {leads.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.9rem' }}>No leads found.</div>
          )}
          {leads.length > 0 && (
            <div className="admin-pagination">
              <span className="admin-pagination-info">
                Showing {Math.min((leadsPage - 1) * leadsPerPage + 1, leads.length)}–{Math.min(leadsPage * leadsPerPage, leads.length)} of {leads.length} leads
              </span>
              <div className="admin-pagination-btns">
                <button
                  className={`admin-pg-btn ${leadsPage === 1 ? 'disabled' : ''}`}
                  onClick={() => setLeadsPage(p => Math.max(1, p - 1))}
                  disabled={leadsPage === 1}
                >‹</button>
                {Array.from({ length: totalLeadsPages }, (_, i) => i + 1).map(pg => (
                  <button
                    key={pg}
                    className={`admin-pg-btn ${leadsPage === pg ? 'active' : ''}`}
                    onClick={() => setLeadsPage(pg)}
                  >{pg}</button>
                ))}
                <button
                  className={`admin-pg-btn ${leadsPage === totalLeadsPages ? 'disabled' : ''}`}
                  onClick={() => setLeadsPage(p => Math.min(totalLeadsPages, p + 1))}
                  disabled={leadsPage === totalLeadsPages}
                >›</button>
              </div>
            </div>
          )}
        </div>

      </div>
    );
  }

  // Completed Reports tab
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      {activeTab === 'attendance_leaves' && (
        <AdminAttendanceLeavesTab api={api} />
      )}

      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#0f172a' }}>📄 Project Completion Reports</h2>
              <p style={{ color: '#94a3b8', marginTop: '0.25rem', fontSize: '0.9rem' }}>
                View and download detailed reports for all completed installation projects.
              </p>
            </div>
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '12px', padding: '0.75rem 1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#10b981' }}>{completedProjects.length}</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Completed Projects</div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="solar-table-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 240px' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>🔍 Search</label>
                <input type="text" className="input-field" placeholder="Search by project ID, customer, technician, or lead..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ margin: 0 }} />
              </div>
              <div style={{ flex: '0 1 180px' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>📅 From Date</label>
                <input type="date" className="input-field" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} style={{ margin: 0 }} />
              </div>
              <div style={{ flex: '0 1 180px' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>📅 To Date</label>
                <input type="date" className="input-field" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} style={{ margin: 0 }} />
              </div>
              {(searchQuery || filterDateFrom || filterDateTo) && (
                <button onClick={() => { setSearchQuery(''); setFilterDateFrom(''); setFilterDateTo(''); }}
                  className="btn btn-secondary" style={{ padding: '10px 16px', fontSize: '0.85rem', alignSelf: 'flex-end', borderRadius: '12px' }}>
                  ✕ Clear Filters
                </button>
              )}
            </div>
            <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#94a3b8' }}>
              Showing <strong style={{ color: '#0f172a' }}>{filteredReports.length}</strong> of {completedProjects.length} completed project{completedProjects.length !== 1 ? 's' : ''}
            </p>
          </div>

          {completedProjects.length === 0 ? (
            <div className="solar-table-panel" style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
              <h3 style={{ color: '#94a3b8' }}>No completed projects yet</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Reports appear here once a technician marks an installation as completed.</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="solar-table-panel" style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔎</div>
              <h3 style={{ color: '#94a3b8' }}>No results found</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Try adjusting your search or date filter.</p>
            </div>
          ) : (
            <div className="solar-table-panel" style={{ padding: '0', overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#fafafa' }}>
                    {['Project', 'Customer', 'Lead / System', 'Technician', 'Invoice Amount', 'Completed On', 'Report'].map(h => (
                      <th key={h} style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map(proj => (
                    <tr key={proj.id}
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: '700', color: '#f59e0b', fontSize: '1rem' }}>#{proj.id}</div>
                        <StatusBadge status={proj.status} styleGetter={getProjectStatusStyle} />
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: '600', color: '#0f172a' }}>{proj.customer_username}</td>
                      <td style={{ padding: '1rem 1.25rem', maxWidth: '220px' }}>
                        <div style={{ fontWeight: '600', marginBottom: '0.15rem', color: '#0f172a' }}>{proj.lead_name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{proj.quotation_items}</div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: '600', color: '#0f172a' }}>
                        {proj.technician_username || <span style={{ color: '#94a3b8' }}>—</span>}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: '700', color: '#10b981', fontSize: '1rem' }}>
                          ${parseFloat(proj.quotation_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {new Date(proj.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <button onClick={() => navigate(`/report/${proj.id}`)} className="btn btn-primary"
                          style={{ padding: '8px 18px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', borderRadius: '8px' }}>
                          📄 View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
