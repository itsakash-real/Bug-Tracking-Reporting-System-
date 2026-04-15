import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader2, Bug, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const DEMO_ROLES = [
  {
    role: 'Admin',
    email: 'admin@bugtracker.com',
    password: 'password123',
    icon: '👑',
    color: '#F59E0B',
    desc: 'Full access — users, reports, all bugs',
  },
  {
    role: 'Developer',
    email: 'bob@bugtracker.com',
    password: 'password123',
    icon: '💻',
    color: '#7C6BFF',
    desc: 'Fix bugs, update status, add comments',
  },
  {
    role: 'Tester',
    email: 'dave@bugtracker.com',
    password: 'password123',
    icon: '🔍',
    color: '#22C55E',
    desc: 'Report bugs, track progress',
  },
];

const LoginPage = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData.email, formData.password);
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      toast.error(result.message || 'Login failed');
    }
  };

  /** One-click demo login — auto-submits credentials for the selected role */
  const handleDemoLogin = async (demo) => {
    setDemoLoading(demo.role);
    const result = await login(demo.email, demo.password);
    setDemoLoading(null);
    if (result.success) {
      toast.success(`Logged in as ${demo.role}`);
      navigate('/dashboard');
    } else {
      toast.error(result.message || 'Demo login failed. Make sure the backend is running.');
    }
  };

  return (
    <div className="auth-root">
      {/* ── Left branding panel ── */}
      <div className="auth-panel-left">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '3rem' }}>
          <div className="sidebar-logo-icon">
            <Bug size={16} color="white" />
          </div>
          <div>
            <div className="sidebar-logo-text">BugTracker</div>
            <div className="sidebar-logo-sub">Pro Edition</div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.04em',
            lineHeight: 1.2,
            marginBottom: '0.875rem',
          }}>
            Ship software.<br />Crush bugs.
          </h1>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            maxWidth: '300px',
          }}>
            A full-stack bug tracking system with role-based access, real-time Kanban, 
            and analytics — built for serious engineering teams.
          </p>

          <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { icon: '⚡', text: 'Role-based access control (Admin / Dev / Tester)' },
              { icon: '🎯', text: 'Drag-and-drop Kanban board' },
              { icon: '📊', text: 'Live analytics dashboard with charts' },
              { icon: '🔐', text: 'JWT authentication, no cookies' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <span style={{ fontSize: '0.875rem' }}>{item.icon}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tech stack pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', paddingTop: '2rem' }}>
          {['React', 'Node.js', 'Express', 'MongoDB', 'JWT', 'Recharts'].map((tech) => (
            <span key={tech} style={{
              padding: '0.2rem 0.625rem',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '999px',
              fontSize: '0.65rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.02em',
            }}>
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-panel-right">
        <div className="auth-form-wrap animate-fade-in">

          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{
              fontSize: '1.375rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
              marginBottom: '0.25rem',
            }}>
              Sign in
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Use a demo account or enter your credentials.
            </p>
          </div>

          {/* ── Demo role tiles ── */}
          <div style={{ marginBottom: '0.5rem' }}>
            <p style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '0.625rem',
            }}>
              Quick Demo Access
            </p>
            <div className="demo-roles">
              {DEMO_ROLES.map((demo) => (
                <button
                  key={demo.role}
                  className="demo-role-btn"
                  onClick={() => handleDemoLogin(demo)}
                  disabled={!!demoLoading || loading}
                  style={{ borderColor: demoLoading === demo.role ? demo.color : undefined }}
                >
                  {demoLoading === demo.role ? (
                    <div className="spinner" style={{ width: 18, height: 18, margin: '0 auto 0.25rem' }} />
                  ) : (
                    <span className="demo-role-icon">{demo.icon}</span>
                  )}
                  <span className="demo-role-name" style={{ color: demo.color }}>{demo.role}</span>
                  <span className="demo-role-email">{demo.email}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="auth-divider" style={{ margin: '1.25rem 0' }}>
            <div className="auth-divider-line" />
            <span className="auth-divider-text">or sign in manually</span>
            <div className="auth-divider-line" />
          </div>

          {/* ── Manual login form ── */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                id="login-email"
                name="email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.375rem' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                  style={{ paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%',
                    transform: 'translateY(-50%)', border: 'none', background: 'none',
                    cursor: 'pointer', color: 'var(--text-muted)', padding: '0',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.6875rem' }}
              disabled={loading || !!demoLoading}
            >
              {loading ? (
                <><Loader2 size={14} style={{ animation: 'spin 0.6s linear infinite' }} /> Signing in…</>
              ) : (
                <>Sign in <ArrowRight size={14} /></>
              )}
            </button>
          </form>

          <p style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
          }}>
            No account?{' '}
            <Link to="/register" style={{
              color: 'var(--accent)',
              textDecoration: 'none',
              fontWeight: 600,
            }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
