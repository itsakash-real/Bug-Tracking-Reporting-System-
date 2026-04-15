import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Activity, Info, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import CommentSection from '../components/CommentSection';
import ActivityFeed from '../components/ActivityFeed';
import BugModal from '../components/BugModal';
import { getSeverityClass, getStatusClass, getPriorityClass } from '../components/BugCard';
import toast from 'react-hot-toast';

/**
 * BugDetailPage — full single-bug view with comments, activity log,
 * status change controls, and meta information.
 */
const BugDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [bug, setBug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    fetchBug();
  }, [id]);

  const fetchBug = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/bugs/${id}`);
      setBug(res.data.bug);
    } catch {
      toast.error('Failed to load bug');
      navigate('/bugs');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!bug) return;
    setStatusLoading(true);
    try {
      const res = await api.put(`/bugs/${bug._id}`, { status: newStatus });
      setBug(res.data.bug);
      toast.success(`Status updated to "${newStatus}"`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this bug?')) return;
    try {
      await api.delete(`/bugs/${bug._id}`);
      toast.success('Bug deleted');
      navigate('/bugs');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete bug');
    }
  };

  const handleSave = (updatedBug) => {
    setBug(updatedBug);
    setShowEditModal(false);
    toast.success('Bug updated');
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const isAssignedDev = bug?.assignedTo?._id === user?._id;
  const isAdmin = user?.role === 'Admin';
  const canChangeStatus = isAdmin || isAssignedDev;

  // Determine next allowed statuses
  const TRANSITIONS = { Open: ['In Progress'], 'In Progress': ['Closed', 'Open'], Closed: ['Open'] };
  const allowedNext = isAdmin
    ? ['Open', 'In Progress', 'Closed'].filter(s => s !== bug?.status)
    : (TRANSITIONS[bug?.status] || []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ width: 36, height: 36 }} />
      </div>
    );
  }

  if (!bug) return null;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.75rem' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate(-1)}
          style={{ flexShrink: 0, marginTop: '4px' }}
        >
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <span className={`badge ${getStatusClass(bug.status)}`}>{bug.status}</span>
            <span className={`badge ${getSeverityClass(bug.severity)}`}>{bug.severity}</span>
            <span className={`badge ${getPriorityClass(bug.priority)}`}>{bug.priority}</span>
          </div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            {bug.title}
          </h2>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowEditModal(true)}>
            <Edit size={14} /> Edit
          </button>
          {(isAdmin || bug.createdBy?._id === user?._id) && (
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem', alignItems: 'start' }}>
        {/* Main Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Description */}
          <div className="card">
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Info size={16} color="#6366f1" /> Description
            </h3>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
              {bug.description}
            </p>

            {bug.environment && (
              <>
                <div className="divider" />
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Environment</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{bug.environment}</p>
                </div>
              </>
            )}

            {bug.stepsToReproduce && (
              <>
                <div className="divider" />
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Steps to Reproduce</p>
                  <pre style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'inherit', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {bug.stepsToReproduce}
                  </pre>
                </div>
              </>
            )}
          </div>

          {/* Comments */}
          <CommentSection
            bugId={bug._id}
            comments={bug.comments}
            onUpdate={(comments) => setBug(prev => ({ ...prev, comments }))}
          />

          {/* Activity Log */}
          <div className="card">
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Activity size={16} color="#6366f1" />
              Activity Log
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                ({bug.activityLog?.length || 0} events)
              </span>
            </h3>
            <ActivityFeed activities={bug.activityLog || []} />
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Status Workflow */}
          {canChangeStatus && allowedNext.length > 0 && (
            <div className="card">
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                Change Status
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {allowedNext.map(status => (
                  <button
                    key={status}
                    className={`btn ${status === 'Closed' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleStatusChange(status)}
                    disabled={statusLoading}
                    style={{ justifyContent: 'center' }}
                  >
                    {statusLoading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : null}
                    Move to "{status}"
                  </button>
                ))}
              </div>
              {!isAdmin && isAssignedDev && (
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  You can change status because this bug is assigned to you.
                </p>
              )}
              {isAdmin && (
                <p style={{ fontSize: '0.72rem', color: '#f59e0b', marginTop: '0.5rem' }}>
                  ⚡ Admin override — all transitions allowed
                </p>
              )}
            </div>
          )}

          {/* Details */}
          <div className="card">
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
              Details
            </h4>

            {[
              { label: 'Status', value: <span className={`badge ${getStatusClass(bug.status)}`}>{bug.status}</span> },
              { label: 'Severity', value: <span className={`badge ${getSeverityClass(bug.severity)}`}>{bug.severity}</span> },
              { label: 'Priority', value: <span className={`badge ${getPriorityClass(bug.priority)}`}>{bug.priority}</span> },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</span>
                {value}
              </div>
            ))}

            {/* Assigned To */}
            <div style={{ padding: '0.625rem 0', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Assigned To</p>
              {bug.assignedTo ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="user-avatar" style={{ width: 26, height: 26, fontSize: '0.65rem' }}>
                    {getInitials(bug.assignedTo.name)}
                  </div>
                  <div>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{bug.assignedTo.name}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{bug.assignedTo.role}</p>
                  </div>
                </div>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Unassigned</span>
              )}
            </div>

            {/* Created By */}
            <div style={{ padding: '0.625rem 0', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Reported By</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="user-avatar" style={{ width: 26, height: 26, fontSize: '0.65rem' }}>
                  {getInitials(bug.createdBy?.name)}
                </div>
                <div>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{bug.createdBy?.name}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{bug.createdBy?.role}</p>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div style={{ padding: '0.5rem 0 0' }}>
              <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                <Calendar size={12} color="var(--text-muted)" />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Created: {bug.createdAt && format(new Date(bug.createdAt), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                <Calendar size={12} color="var(--text-muted)" />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Updated: {bug.updatedAt && format(new Date(bug.updatedAt), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <BugModal
          bug={bug}
          onClose={() => setShowEditModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default BugDetailPage;
