import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:8000/api';

// Inline SVGs matching the professional design reference
const Icons = {
  SolarPanel: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffb100" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <line x1="12" y1="3" x2="12" y2="17" />
    </svg>
  ),
  Sun: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ffb100" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  Secure: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Live: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 12a11 11 0 1 1-22 0 11 11 0 0 1 22 0z" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Reliable: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Support: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Mail: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  Lock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Phone: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
};

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Step: 'register' | 'interest' | 'done'
  const [step, setStep] = useState(location.state?.step || 'register');

  // Register form state
  const [regData, setRegData] = useState({ username: '', email: '', password: '', role: 'CUSTOMER' });
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Interest / lead form state
  const [leadData, setLeadData] = useState({ name: '', email: location.state?.email || '', phone: '', interest_details: '' });
  const [leadError, setLeadError] = useState('');
  const [leadLoading, setLeadLoading] = useState(false);

  // ── Step 1: Register directly via API ──
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegLoading(true);
    try {
      await axios.post(`${API}/auth/register/`, regData);
      if (regData.role === 'CUSTOMER') {
        setLeadData((prev) => ({ ...prev, email: regData.email }));
        setStep('interest');
      } else {
        navigate('/login', { state: { successMessage: 'Registration successful! Please login.' } });
      }
    } catch (err) {
      const detail =
        err?.response?.data?.username?.[0] ||
        err?.response?.data?.email?.[0] ||
        err?.response?.data?.detail ||
        'Registration failed. Please check your details.';
      setRegError(detail);
    } finally {
      setRegLoading(false);
    }
  };

  // ── Step 2: Submit lead / interest ──
  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    setLeadError('');
    setLeadLoading(true);
    try {
      await axios.post(`${API}/leads/`, leadData);
      setStep('done');
    } catch (err) {
      setLeadError('Failed to submit. Please try again.');
    } finally {
      setLeadLoading(false);
    }
  };

  return (
    <div className="solar-auth-page animate-fade-in">
      
      {/* ── Top Bar ── */}
      <header className="solar-top-bar">
        <div className="solar-logo">
          <Icons.Sun />
          <div>
            <h1>Solar ERP</h1>
            <span>Smart Solutions. Bright Future.</span>
          </div>
        </div>
        
        <div className="solar-top-badges">
          <div className="solar-top-badge">
            <Icons.Secure />
            <span>Secure Role-based access</span>
          </div>
          <div className="solar-top-badge">
            <Icons.Live />
            <span>Real-time Live tracking</span>
          </div>
          <div className="solar-top-badge">
            <Icons.Reliable />
            <span>Reliable 99.9% uptime</span>
          </div>
          <div className="solar-top-badge">
            <Icons.Support />
            <span>Support 24/7 assistance</span>
          </div>
        </div>
      </header>

      {/* ── Main Split Screen Container ── */}
      <div className="solar-split-container">
        
        {/* Left Column: Hero & Features */}
        <section className="solar-left-panel">
          <div>
            <div className="solar-hero-badge">Welcome to Solar ERP</div>
            <h2 className="solar-hero-title">
              Powering a<br />
              <span className="accent-green">Sustainable</span><br />
              <span className="accent-orange">Future</span>
            </h2>
            <p className="solar-hero-subtitle">
              Manage your solar business efficiently – from leads to installation and beyond. Join our ecosystem to track and scale your green projects.
            </p>
            
            {/* Feature Cards Grid */}
            <div className="solar-features-grid">
              
              <div className="solar-feature-card green">
                <div className="solar-feature-icon">👤</div>
                <div className="solar-feature-info">
                  <h4>Lead to Project</h4>
                  <p>Manage leads, quotations, and projects seamlessly.</p>
                </div>
              </div>
              
              <div className="solar-feature-card blue">
                <div className="solar-feature-icon">📋</div>
                <div className="solar-feature-info">
                  <h4>Installation Tracking</h4>
                  <p>Track installation progress in real-time.</p>
                </div>
              </div>
              
              <div className="solar-feature-card orange">
                <div className="solar-feature-icon">🎧</div>
                <div className="solar-feature-info">
                  <h4>Support Management</h4>
                  <p>Raise tickets and get quick customer support.</p>
                </div>
              </div>
              
              <div className="solar-feature-card purple">
                <div className="solar-feature-icon">📊</div>
                <div className="solar-feature-info">
                  <h4>Reports &amp; Insights</h4>
                  <p>Get detailed reports and grow your business.</p>
                </div>
              </div>
              
              <div className="solar-feature-card teal">
                <div className="solar-feature-icon">🛡️</div>
                <div className="solar-feature-info">
                  <h4>Secure &amp; Reliable</h4>
                  <p>Role-based access and data security ensured.</p>
                </div>
              </div>
              
              <div className="solar-feature-card lightgreen">
                <div className="solar-feature-icon">🌿</div>
                <div className="solar-feature-info">
                  <h4>Go Green</h4>
                  <p>Contribute to a cleaner and greener tomorrow.</p>
                </div>
              </div>
              
            </div>
          </div>

          {/* Statistics Bar at the bottom */}
          <div className="solar-stats-banner">
            <div className="solar-stat-item">
              <div className="solar-stat-number">500+</div>
              <div className="solar-stat-label">Projects Completed</div>
            </div>
            <div className="solar-stat-item">
              <div className="solar-stat-number">300+</div>
              <div className="solar-stat-label">Happy Customers</div>
            </div>
            <div className="solar-stat-item">
              <div className="solar-stat-number">25+</div>
              <div className="solar-stat-label">Expert Employees</div>
            </div>
            <div className="solar-stat-item">
              <div className="solar-stat-number">100%</div>
              <div className="solar-stat-label">Clean Energy Focus</div>
            </div>
          </div>
        </section>

        {/* Right Column: Auth/Registration Forms */}
        <section className="solar-right-panel">
          <div className="solar-form-card animate-fade-in">
            
            {/* Step Indicator */}
            {regData.role === 'CUSTOMER' && step !== 'done' && (
              <div className="solar-steps-indicator">
                <div className="solar-step-item">
                  <div className="solar-step-number" style={{
                    background: (step === 'register') ? 'rgba(255, 177, 0, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: (step === 'register') ? '#ffb100' : '#10b981',
                    border: `2px solid ${(step === 'register') ? '#ffb100' : '#10b981'}`
                  }}>
                    {step === 'register' ? '1' : '✓'}
                  </div>
                  <span style={{ color: step === 'register' ? '#0f172a' : '#64748b' }}>Register</span>
                </div>
                <div className="solar-step-line" style={{
                  background: step === 'interest' ? '#10b981' : '#e2e8f0'
                }} />
                <div className="solar-step-item">
                  <div className="solar-step-number" style={{
                    background: step === 'interest' ? 'rgba(255, 177, 0, 0.15)' : '#f1f5f9',
                    color: step === 'interest' ? '#ffb100' : '#94a3b8',
                    border: `2px solid ${step === 'interest' ? '#ffb100' : '#cbd5e1'}`
                  }}>
                    2
                  </div>
                  <span style={{ color: step === 'interest' ? '#0f172a' : '#94a3b8' }}>Interest Form</span>
                </div>
              </div>
            )}

            {/* ── STEP 1: Registration Form ── */}
            {step === 'register' && (
              <>
                <h2>Welcome to <span className="accent-green">Solar ERP</span></h2>
                <p className="solar-form-subtitle">Create your account to start managing your solar operations.</p>
                
                {regError && (
                  <div style={{
                    color: 'var(--danger)', marginBottom: '1.25rem', textAlign: 'center',
                    padding: '0.75rem', background: 'rgba(239,68,68,0.1)',
                    borderRadius: '12px', fontSize: '0.85rem', fontWeight: '500',
                    border: '1px solid rgba(239,68,68,0.2)'
                  }}>
                    {regError}
                  </div>
                )}

                <form onSubmit={handleRegister}>
                  <div className="solar-input-container">
                    <label className="solar-input-label">Username</label>
                    <div className="solar-input-wrapper">
                      <span className="solar-input-icon"><Icons.User /></span>
                      <input
                        required type="text" className="solar-input-field"
                        placeholder="Choose a username"
                        value={regData.username}
                        onChange={e => setRegData({ ...regData, username: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="solar-input-container">
                    <label className="solar-input-label">Email Address</label>
                    <div className="solar-input-wrapper">
                      <span className="solar-input-icon"><Icons.Mail /></span>
                      <input
                        required type="email" className="solar-input-field"
                        placeholder="john@example.com"
                        value={regData.email}
                        onChange={e => setRegData({ ...regData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="solar-input-container">
                    <label className="solar-input-label">Password</label>
                    <div className="solar-input-wrapper">
                      <span className="solar-input-icon"><Icons.Lock /></span>
                      <input
                        required type="password" className="solar-input-field"
                        placeholder="Choose a password"
                        minLength={6}
                        value={regData.password}
                        onChange={e => setRegData({ ...regData, password: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="solar-input-container">
                    <label className="solar-input-label">Role</label>
                    <div className="solar-input-wrapper">
                      <span className="solar-input-icon">⚙️</span>
                      <select
                        className="solar-input-field"
                        value={regData.role}
                        onChange={e => setRegData({ ...regData, role: e.target.value })}
                        style={{ paddingLeft: '42px', appearance: 'none', background: '#f8fafc' }}
                      >
                        <option value="CUSTOMER">Customer</option>
                        <option value="SALES_EXECUTIVE">Sales Executive</option>
                        <option value="TECHNICIAN">Technician</option>
                        <option value="CUSTOMER_CARE">Customer Care</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <span style={{ position: 'absolute', right: '16px', color: '#94a3b8', pointerEvents: 'none' }}>▼</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="solar-btn-submit"
                    disabled={regLoading}
                  >
                    {regLoading ? 'Creating Account…' : 'Register & Continue'}
                    <Icons.ChevronRight />
                  </button>
                </form>

                <div className="solar-divider">OR</div>

                <div className="solar-form-footer">
                  Already have an account?{' '}
                  <Link to="/login">Login here</Link>
                </div>
              </>
            )}

            {/* ── STEP 2: Show Interest Form ── */}
            {step === 'interest' && (
              <>
                <h2>Submit <span className="accent-green">Inquiry</span></h2>
                <p className="solar-form-subtitle">Let us know your requirements. Our Sales Executive will follow up with a quotation.</p>

                {leadError && (
                  <div style={{
                    color: 'var(--danger)', marginBottom: '1.25rem', textAlign: 'center',
                    padding: '0.75rem', background: 'rgba(239,68,68,0.1)',
                    borderRadius: '12px', fontSize: '0.85rem', fontWeight: '500',
                    border: '1px solid rgba(239,68,68,0.2)'
                  }}>
                    {leadError}
                  </div>
                )}

                <form onSubmit={handleLeadSubmit}>
                  <div className="solar-input-container">
                    <label className="solar-input-label">Full Name</label>
                    <div className="solar-input-wrapper">
                      <span className="solar-input-icon"><Icons.User /></span>
                      <input
                        required type="text" className="solar-input-field"
                        placeholder="John Doe"
                        value={leadData.name}
                        onChange={e => setLeadData({ ...leadData, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="solar-input-container">
                    <label className="solar-input-label">Email Address</label>
                    <div className="solar-input-wrapper">
                      <span className="solar-input-icon"><Icons.Mail /></span>
                      <input
                        required type="email" className="solar-input-field"
                        placeholder="john@example.com"
                        value={leadData.email}
                        onChange={e => setLeadData({ ...leadData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="solar-input-container">
                    <label className="solar-input-label">Phone Number</label>
                    <div className="solar-input-wrapper">
                      <span className="solar-input-icon"><Icons.Phone /></span>
                      <input
                        required type="tel" className="solar-input-field"
                        placeholder="Phone Number"
                        value={leadData.phone}
                        onChange={e => setLeadData({ ...leadData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="solar-input-container">
                    <label className="solar-input-label">Solar Project Details</label>
                    <div className="solar-input-wrapper">
                      <span className="solar-input-icon" style={{ top: '14px', alignSelf: 'flex-start' }}>☀️</span>
                      <textarea
                        required className="solar-input-field" rows="4"
                        placeholder="Describe your requirements (e.g. 5kW system for residential roof)..."
                        value={leadData.interest_details}
                        onChange={e => setLeadData({ ...leadData, interest_details: e.target.value })}
                        style={{ paddingLeft: '42px', paddingTop: '12px', resize: 'vertical' }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="solar-btn-submit"
                    disabled={leadLoading}
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)' }}
                  >
                    {leadLoading ? 'Submitting…' : 'Submit Inquiry'}
                    <Icons.ChevronRight />
                  </button>
                  
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ width: '100%', marginTop: '0.75rem', borderRadius: '12px', padding: '12px' }}
                    onClick={() => navigate('/login')}
                  >
                    Skip — Go to Login
                  </button>
                </form>
              </>
            )}

            {/* ── DONE SUCCESS SCREEN ── */}
            {step === 'done' && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🎉</div>
                <h2 style={{ marginBottom: '1rem' }}>Inquiry Submitted!</h2>
                <p style={{ color: '#64748b', marginBottom: '2.5rem', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  Your solar system inquiry has been logged successfully. Our Sales Executives will prepare a customized quotation for you shortly.
                </p>
                <button
                  className="solar-btn-submit"
                  onClick={() => navigate('/login')}
                >
                  Continue to Login
                  <Icons.ChevronRight />
                </button>
              </div>
            )}

          </div>
        </section>
      </div>

      {/* ── Bottom Features ── */}
      <footer className="solar-bottom-features">
        <div className="solar-bottom-feature">
          <span className="solar-bottom-feature-icon">✔</span>
          <div className="solar-bottom-feature-info">
            <h5>Easy to Use</h5>
            <p>Simple and intuitive interface for quick navigation.</p>
          </div>
        </div>
        <div className="solar-bottom-feature">
          <span className="solar-bottom-feature-icon">✔</span>
          <div className="solar-bottom-feature-info">
            <h5>Smart Workflow</h5>
            <p>Automate and manage processes efficiently.</p>
          </div>
        </div>
        <div className="solar-bottom-feature">
          <span className="solar-bottom-feature-icon">✔</span>
          <div className="solar-bottom-feature-info">
            <h5>Data Insights</h5>
            <p>Make smarter decisions with real-time solar data.</p>
          </div>
        </div>
        <div className="solar-bottom-feature">
          <span className="solar-bottom-feature-icon">✔</span>
          <div className="solar-bottom-feature-info">
            <h5>Scalable Solution</h5>
            <p>Grow your business operations without limits.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
