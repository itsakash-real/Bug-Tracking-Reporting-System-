import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  Bug,
  Kanban,
  Users,
  LogOut,
  Sun,
  Moon,
  Settings,
  FolderKanban,
  Brain,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'All Bugs', icon: Bug, to: '/bugs' },
  { label: 'Kanban Board', icon: Kanban, to: '/kanban' },
  { label: 'AI Insights', icon: Brain, to: '/ai-insights' },
];

const ADMIN_ITEMS = [
  { label: 'User Management', icon: Users, to: '/users' },
  { label: 'Project Settings', icon: Settings, to: '/project/settings' },
];

const ROLE_COLORS = {
  Admin: '#F59E0B',
  Developer: '#7C6BFF',
  Tester: '#22C55E',
};

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose?.();
  };

  const getInitials = (name = '') =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 39,
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* ── Logo ── */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Bug size={16} color="white" />
          </div>
          <div>
            <div className="sidebar-logo-text">BugTracker</div>
            <div className="sidebar-logo-sub">Pro Edition</div>
          </div>
        </div>

        {/* ── Nav ── */}
        <nav className="sidebar-nav">
          <p className="sidebar-section-label">Navigation</p>

          {NAV_ITEMS.map(({ label, icon: Icon, to }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <Icon className="nav-icon" />
              <span>{label}</span>
            </NavLink>
          ))}

          {/* Admin-only */}
          {user?.role === 'Admin' && (
            <>
              <p className="sidebar-section-label" style={{ marginTop: '0.875rem' }}>Admin</p>
              {ADMIN_ITEMS.map(({ label, icon: Icon, to }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                >
                  <Icon className="nav-icon" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </>
          )}

          {/* Non-admin: project info link */}
          {user?.role !== 'Admin' && (
            <>
              <p className="sidebar-section-label" style={{ marginTop: '0.875rem' }}>Project</p>
              <NavLink
                to="/project/settings"
                onClick={onClose}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              >
                <FolderKanban className="nav-icon" />
                <span>My Project</span>
              </NavLink>
            </>
          )}

          <p className="sidebar-section-label" style={{ marginTop: '0.875rem' }}>Preferences</p>

          <button className="sidebar-link" onClick={toggleTheme}>
            {isDark ? (
              <Sun className="nav-icon" style={{ color: '#FCD34D' }} />
            ) : (
              <Moon className="nav-icon" style={{ color: '#A89FFF' }} />
            )}
            <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
          </button>
        </nav>

        {/* ── Footer ── */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">{getInitials(user?.name)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {user?.name}
              </div>
              <div style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: ROLE_COLORS[user?.role] || 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                {user?.role}
              </div>
            </div>
          </div>

          <button
            className="sidebar-link"
            onClick={handleLogout}
            style={{ marginTop: '0.375rem', color: '#F87171' }}
          >
            <LogOut className="nav-icon" style={{ color: '#F87171' }} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;