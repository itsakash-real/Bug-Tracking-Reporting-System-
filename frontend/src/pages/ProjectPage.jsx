import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FolderPlus, KeyRound, Users, Copy, Check, RefreshCw,
  Loader2, ArrowRight, Bug, Shield, UserMinus, Crown,
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const ROLE_COLORS = { Admin: '#F59E0B', Developer: '#7C6BFF', Tester: '#22C55E' };

/**
 * ProjectPage — handles 3 states:
 *   1. No project → Create or Join
 *   2. Has project → View project details + invite code
 */
const ProjectPage = () => {
  const { user, refreshUser, hasProject } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('join'); // 'create' or 'join'
  const [copied, setCopied] = useState(false);

  // Form state
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hasProject) {
      api.get('/projects/mine')
        .then(res => setProject(res.data.project))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [hasProject]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) return toast.error('Project name is required');
    setSubmitting(true);
    try {
      const res = await api.post('/projects', { name: projectName, description: projectDesc });
      setProject(res.data.project);
      await refreshUser();
      toast.success('Project created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinProject = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return toast.error('Enter an invite code');
    setSubmitting(true);
    try {
      const res = await api.post('/projects/join', { inviteCode });
      setProject(res.data.project);
      await refreshUser();
      toast.success(res.data.message || 'Joined project!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(project?.inviteCode || '');
    setCopied(true);
    toast.success('Invite code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenInvite = async () => {
    try {
      const res = await api.put('/projects/regenerate-invite');
      setProject(prev => ({ ...prev, inviteCode: res.data.inviteCode }));
      toast.success('Invite code regenerated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to regenerate');
    }
  };

  const handleRemoveMember = async (userId, userName) => {
    if (!confirm(`Remove ${userName} from the project?`)) return;
    try {
      await api.delete(`/projects/members/${userId}`);
      setProject(prev => ({
        ...prev,
        members: prev.members.filter(m => m._id !== userId),
      }));
      toast.success(`${userName} removed`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const getInitials = (name = '') =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  // ── STATE 1: User has a project — show project dashboard ──
  if (project) {
    const isOwner = project.createdBy?._id === user?._id;
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <h2 className="page-title">Project Settings</h2>
            <p className="page-subtitle">Manage your project and team members</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            <ArrowRight size={16} /> Go to Dashboard
          </button>
        </div>

        {/* Project Info Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, flexShrink: 0,
              background: 'rgba(99,102,241,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bug size={24} color="#6366f1" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                {project.name}
              </h3>
              {project.description && (
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {project.description}
                </p>
              )}
            </div>
          </div>

          {/* Invite Code Section */}
          <div style={{
            background: 'var(--bg-elevated)', borderRadius: 12, padding: '1rem 1.25rem',
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <p style={{
                fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.1em',
              }}>
                <KeyRound size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Invite Code
              </p>
              {isOwner && (
                <button className="btn btn-ghost btn-sm" onClick={handleRegenInvite} style={{ fontSize: '0.7rem' }}>
                  <RefreshCw size={12} /> Regenerate
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <code style={{
                fontSize: '1.5rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace',
                color: '#6366f1', letterSpacing: '0.15em',
              }}>
                {project.inviteCode}
              </code>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleCopyInvite}
                style={{ fontSize: '0.7rem' }}
              >
                {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
              </button>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Share this code with team members so they can join the project during sign-up or from the Project page.
            </p>
          </div>
        </div>

        {/* Members List */}
        <div className="card">
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={16} color="#6366f1" />
            Team Members ({project.members?.length || 0})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(project.members || []).map(member => (
              <div key={member._id} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.625rem 0.875rem', borderRadius: 10,
                border: '1px solid var(--border)',
              }}>
                <div className="user-avatar" style={{ width: 36, height: 36 }}>
                  {getInitials(member.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{member.name}</span>
                    {member._id === project.createdBy?._id && (
                      <Crown size={13} color="#F59E0B" title="Project Owner" />
                    )}
                    {member._id === user?._id && (
                      <span style={{
                        fontSize: '0.62rem', background: 'rgba(99,102,241,0.12)', color: '#6366f1',
                        padding: '1px 6px', borderRadius: 4, fontWeight: 600,
                      }}>You</span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{member.email}</span>
                </div>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700, color: ROLE_COLORS[member.role],
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  {member.role}
                </span>
                {isOwner && member._id !== user?._id && member._id !== project.createdBy?._id && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleRemoveMember(member._id, member.name)}
                    style={{ color: '#ef4444', padding: '0.25rem' }}
                    title="Remove member"
                  >
                    <UserMinus size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── STATE 2: No project — show Create / Join tabs ──
  return (
    <div className="auth-root" style={{ minHeight: '100vh' }}>
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
            fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)',
            letterSpacing: '-0.04em', lineHeight: 1.2, marginBottom: '0.875rem',
          }}>
            One more step.<br />Join your team.
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: '300px' }}>
            Every team gets an isolated workspace with its own bugs, members, and Kanban board.
            Create a new project or join an existing one with an invite code.
          </p>

          <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { icon: '🔒', text: 'Data isolation — teams see only their own bugs' },
              { icon: '🎫', text: 'Join via simple invite codes' },
              { icon: '👥', text: 'Role-based access control (Admin / Dev / Tester)' },
              { icon: '📊', text: 'Per-project analytics and Kanban boards' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <span style={{ fontSize: '0.875rem' }}>{item.icon}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-panel-right">
        <div className="auth-form-wrap animate-fade-in">
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{
              fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)',
              letterSpacing: '-0.03em', marginBottom: '0.25rem',
            }}>
              Setup your workspace
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {user?.role === 'Admin'
                ? 'Create a new project or join an existing one.'
                : 'Enter an invite code from your admin to join a project.'}
            </p>
          </div>

          {/* Tabs — only show create tab for Admins */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: 'var(--bg-elevated)', borderRadius: 10, padding: 3 }}>
            <button
              onClick={() => setTab('join')}
              style={{
                flex: 1, padding: '0.5rem', border: 'none', borderRadius: 8,
                background: tab === 'join' ? 'var(--bg-surface)' : 'transparent',
                color: tab === 'join' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                boxShadow: tab === 'join' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <KeyRound size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Join Project
            </button>
            {user?.role === 'Admin' && (
              <button
                onClick={() => setTab('create')}
                style={{
                  flex: 1, padding: '0.5rem', border: 'none', borderRadius: 8,
                  background: tab === 'create' ? 'var(--bg-surface)' : 'transparent',
                  color: tab === 'create' ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                  boxShadow: tab === 'create' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                <FolderPlus size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Create Project
              </button>
            )}
          </div>

          {/* Join Form */}
          {tab === 'join' && (
            <form onSubmit={handleJoinProject}>
              <div className="form-group" style={{ marginBottom: '1.375rem' }}>
                <label className="form-label">Invite Code</label>
                <input
                  id="invite-code"
                  type="text"
                  className="form-input"
                  placeholder="e.g. DEMO2026"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  style={{
                    textTransform: 'uppercase', letterSpacing: '0.15em',
                    fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                    fontSize: '1.1rem', textAlign: 'center',
                  }}
                  required
                  autoFocus
                />
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
                  Ask your project admin for the invite code
                </p>
              </div>
              <button
                type="submit" className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.6875rem' }}
                disabled={submitting}
              >
                {submitting
                  ? <><Loader2 size={14} style={{ animation: 'spin 0.6s linear infinite' }} /> Joining…</>
                  : <>Join Project <ArrowRight size={14} /></>
                }
              </button>
            </form>
          )}

          {/* Create Form (Admin only) */}
          {tab === 'create' && (
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input
                  id="project-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Acme Corp Bug Tracker"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.375rem' }}>
                <label className="form-label">Description (optional)</label>
                <textarea
                  id="project-desc"
                  className="form-textarea"
                  placeholder="Brief description of the project..."
                  value={projectDesc}
                  onChange={e => setProjectDesc(e.target.value)}
                  rows={3}
                />
              </div>
              <button
                type="submit" className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.6875rem' }}
                disabled={submitting}
              >
                {submitting
                  ? <><Loader2 size={14} style={{ animation: 'spin 0.6s linear infinite' }} /> Creating…</>
                  : <>Create Project <ArrowRight size={14} /></>
                }
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectPage;
