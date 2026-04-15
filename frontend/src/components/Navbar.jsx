import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLE_COLORS = {
  Admin: '#F59E0B',
  Developer: '#7C6BFF',
  Tester: '#22C55E',
};

/**
 * Top navigation bar.
 */
const Navbar = ({ onMenuToggle, pageTitle }) => {
  const { user } = useAuth();

  const getInitials = (name = '') =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <header className="topbar">
      {/* Left — hamburger + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <button
          id="mobile-menu-btn"
          className="btn btn-ghost btn-sm"
          onClick={onMenuToggle}
          aria-label="Open menu"
          style={{ padding: '0.375rem' }}
        >
          <Menu size={18} />
        </button>

        <div>
          <h1 style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}>
            {pageTitle || 'Dashboard'}
          </h1>
          <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '1px' }}>
            BugTracker Pro
          </p>
        </div>
      </div>

      {/* Right — bell + user */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          className="btn btn-ghost btn-sm"
          data-tooltip="Notifications"
          style={{ position: 'relative', padding: '0.4rem' }}
        >
          <Bell size={17} />
          {/* Unread dot */}
          <span style={{
            position: 'absolute', top: 5, right: 5,
            width: 7, height: 7, borderRadius: '50%',
            background: '#EF4444',
            border: '1.5px solid var(--bg-surface)',
          }} />
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.3125rem 0.625rem',
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
        }}>
          <div className="user-avatar user-avatar-lg">
            {getInitials(user?.name)}
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {user?.name}
            </div>
            <div style={{
              fontSize: '0.6rem',
              fontWeight: 700,
              color: ROLE_COLORS[user?.role] || 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              {user?.role}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
