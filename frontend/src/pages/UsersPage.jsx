import { useState, useEffect } from 'react';
import { Users, ShieldCheck, Code, TestTube, UserX, UserCheck } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ROLE_ICONS = { Admin: ShieldCheck, Developer: Code, Tester: TestTube };
const ROLE_COLORS = { Admin: '#f59e0b', Developer: '#6366f1', Tester: '#22c55e' };

/**
 * UsersPage — Admin-only page to view, manage roles, and toggle user active status.
 */
const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.users);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await api.put(`/users/${userId}`, { role: newRole });
      setUsers(prev => prev.map(u => u._id === userId ? res.data.user : u));
      toast.success(`Role updated to ${newRole}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      const res = await api.put(`/users/${userId}`, { isActive: !currentStatus });
      setUsers(prev => prev.map(u => u._id === userId ? res.data.user : u));
      toast.success(currentStatus ? 'User deactivated' : 'User activated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure? This cannot be undone.')) return;
    try {
      await api.delete(`/users/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
      toast.success('User deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">User Management</h2>
          <p className="page-subtitle">{users.length} registered users</p>
        </div>
      </div>

      {/* Role Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
        {['Admin', 'Developer', 'Tester'].map(role => {
          const Icon = ROLE_ICONS[role];
          return (
            <div key={role} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: `${ROLE_COLORS[role]}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={20} color={ROLE_COLORS[role]} />
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{role}s</p>
                <p style={{ fontSize: '1.75rem', fontWeight: 800, color: ROLE_COLORS[role] }}>{roleCounts[role] || 0}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Users Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ width: 36, height: 36 }} />
        </div>
      ) : (
        <div className="table-container" style={{ background: 'var(--bg-surface)' }}>
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const RoleIcon = ROLE_ICONS[u.role];
                const isSelf = u._id === currentUser?._id;

                return (
                  <tr key={u._id} style={{ opacity: u.isActive ? 1 : 0.6 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="user-avatar" style={{ width: 36, height: 36 }}>
                          {getInitials(u.name)}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {u.name}
                            {isSelf && <span style={{ marginLeft: 6, fontSize: '0.68rem', background: 'rgba(99,102,241,0.1)', color: '#6366f1', padding: '1px 6px', borderRadius: 4 }}>You</span>}
                          </p>
                          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      {isSelf ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: ROLE_COLORS[u.role] }}>
                          <RoleIcon size={14} /> {u.role}
                        </span>
                      ) : (
                        <select
                          className="form-select"
                          value={u.role}
                          onChange={e => handleRoleChange(u._id, e.target.value)}
                          style={{ width: 'auto', fontSize: '0.8rem', padding: '0.35rem 0.6rem', color: ROLE_COLORS[u.role] }}
                        >
                          <option value="Admin">Admin</option>
                          <option value="Developer">Developer</option>
                          <option value="Tester">Tester</option>
                        </select>
                      )}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        fontSize: '0.75rem', fontWeight: 600,
                        color: u.isActive ? '#22c55e' : '#ef4444',
                        background: u.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        padding: '2px 10px', borderRadius: 99,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {u.createdAt && format(new Date(u.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td>
                      {!isSelf && (
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            className={`btn btn-sm ${u.isActive ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={() => handleToggleActive(u._id, u.isActive)}
                            style={{ fontSize: '0.72rem' }}
                          >
                            {u.isActive ? <><UserX size={12} /> Deactivate</> : <><UserCheck size={12} /> Activate</>}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
