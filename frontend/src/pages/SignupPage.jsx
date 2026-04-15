import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader2, Bug, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'Tester', label: '🔍 Tester', desc: 'Report & track bugs' },
  { value: 'Developer', label: '💻 Developer', desc: 'Fix & resolve bugs' },
  { value: 'Admin', label: '👑 Admin', desc: 'Full system access' },
];

const SignupPage = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Tester',
    inviteCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState([]);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();

    const result = await register(
      fullName,
      formData.email,
      formData.password,
      formData.role,
      formData.inviteCode || undefined,
    );
    if (result.success) {
      toast.success('Account created! Welcome aboard!');
      // If they signed up with an invite code, they have a project → dashboard
      // Otherwise, redirect to /project to create or join one
      navigate(formData.inviteCode ? '/dashboard' : '/project');
    } else {
      if (result.errors?.length) {
        setErrors(result.errors);
      } else {
        toast.error(result.message || 'Registration failed');
      }
    }
  };

  return (
    <div className="auth-root">
      {/* ── Left panel ── */}
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
            Join your team.<br />Start tracking.
          </h1>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            maxWidth: '300px',
          }}>
            Create your account and get access to the full bug tracking workspace
            with role-based permissions and project isolation.
          </p>

          {/* Role cards */}
          <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <p style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '0.25rem',
            }}>
              Available roles
            </p>
            {ROLES.map((r) => (
              <div key={r.value} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 0.875rem',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: '0.875rem' }}>{r.label.split(' ')[0]}</span>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {r.value}
                  </div>
                  <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)' }}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
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
              Create account
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Fill in your details to get started.
            </p>
          </div>

          {/* Validation errors */}
          {errors.length > 0 && (
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--radius)',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
            }}>
              {errors.map((err, i) => (
                <p key={i} style={{ color: '#F87171', fontSize: '0.775rem', lineHeight: 1.6 }}>
                  • {err.message || err}
                </p>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Name row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.125rem' }}>
              <div>
                <label className="form-label">First name</label>
                <input
                  id="signup-firstname"
                  name="firstName"
                  type="text"
                  className="form-input"
                  placeholder="Alice"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="form-label">Last name</label>
                <input
                  id="signup-lastname"
                  name="lastName"
                  type="text"
                  className="form-input"
                  placeholder="Smith"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                id="signup-email"
                name="email"
                type="email"
                className="form-input"
                placeholder="alice@company.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="signup-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                  minLength={6}
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

            {/* Role & Invite Code row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.375rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Role</label>
                <select
                  id="signup-role"
                  name="role"
                  className="form-select"
                  value={formData.role}
                  onChange={handleChange}
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Invite Code
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginLeft: 4 }}>(optional)</span>
                </label>
                <input
                  id="signup-invitecode"
                  name="inviteCode"
                  type="text"
                  className="form-input"
                  placeholder="e.g. DEMO2026"
                  value={formData.inviteCode}
                  onChange={handleChange}
                  style={{
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 600,
                  }}
                />
              </div>
            </div>

            <button
              id="signup-submit"
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.6875rem' }}
              disabled={loading}
            >
              {loading ? (
                <><Loader2 size={14} style={{ animation: 'spin 0.6s linear infinite' }} /> Creating account…</>
              ) : (
                <>Create account <ArrowRight size={14} /></>
              )}
            </button>
          </form>

          <p style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
          }}>
            Already have an account?{' '}
            <Link to="/login" style={{
              color: 'var(--accent)',
              textDecoration: 'none',
              fontWeight: 600,
            }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
