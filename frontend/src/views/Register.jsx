import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

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
  ChevronRight: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
};

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'CUSTOMER' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register/`, formData);
      if (formData.role === 'CUSTOMER') {
        // Customers go to the interest form on the landing page
        navigate('/', { state: { step: 'interest', email: formData.email } });
      } else {
        // Other roles go to the login page
        navigate('/login', { state: { successMessage: 'Registration successful! Please login.' } });
      }
    } catch (err) {
      const detail =
        err?.response?.data?.username?.[0] ||
        err?.response?.data?.email?.[0] ||
        err?.response?.data?.detail ||
        'Registration failed. Please check your details.';
      setError(detail);
    } finally {
      setLoading(false);
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

        {/* Right Column: Registration Card */}
        <section className="solar-right-panel">
          <div className="solar-form-card animate-fade-in">

            <h2>Welcome to <span className="accent-green">Solar ERP</span></h2>
            <p className="solar-form-subtitle">Create your account to start managing your solar operations.</p>

            {error && (
              <div style={{
                color: 'var(--danger)',
                marginBottom: '1.25rem',
                textAlign: 'center',
                padding: '0.75rem',
                background: 'rgba(239,68,68,0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(239,68,68,0.2)',
                fontSize: '0.85rem',
                fontWeight: '500'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="solar-input-container">
                <label className="solar-input-label">Username</label>
                <div className="solar-input-wrapper">
                  <span className="solar-input-icon"><Icons.User /></span>
                  <input
                    required
                    type="text"
                    className="solar-input-field"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
              </div>

              <div className="solar-input-container">
                <label className="solar-input-label">Email Address</label>
                <div className="solar-input-wrapper">
                  <span className="solar-input-icon"><Icons.Mail /></span>
                  <input
                    required
                    type="email"
                    className="solar-input-field"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="solar-input-container">
                <label className="solar-input-label">Password</label>
                <div className="solar-input-wrapper">
                  <span className="solar-input-icon"><Icons.Lock /></span>
                  <input
                    required
                    type="password"
                    className="solar-input-field"
                    placeholder="Choose a password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="solar-input-container">
                <label className="solar-input-label">Role</label>
                <div className="solar-input-wrapper">
                  <span className="solar-input-icon">⚙️</span>
                  <select
                    className="solar-input-field"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
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

              <button type="submit" className="solar-btn-submit" disabled={loading}>
                <span>{loading ? 'Creating Account…' : 'Register'}</span>
                <Icons.ChevronRight />
              </button>
            </form>

            <div className="solar-divider">OR</div>

            <div className="solar-form-footer">
              Already have an account?{' '}
              <Link to="/login">Login here</Link>
            </div>

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
