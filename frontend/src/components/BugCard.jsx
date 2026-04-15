import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { MessageSquare, User } from 'lucide-react';

/**
 * Utility: map severity/status/priority to badge CSS classes
 */
export const getSeverityClass = (severity) => {
  const map = { Critical: 'badge-critical', High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' };
  return map[severity] || 'badge-medium';
};

export const getStatusClass = (status) => {
  const map = { Open: 'badge-open', 'In Progress': 'badge-inprogress', Closed: 'badge-closed' };
  return map[status] || 'badge-open';
};

export const getPriorityClass = (priority) => {
  const map = { P1: 'badge-p1', P2: 'badge-p2', P3: 'badge-p3', P4: 'badge-p4' };
  return map[priority] || 'badge-p3';
};

/**
 * BugCard — displayed in both the Kanban board and the bug list.
 * Shows title, severity/priority badges, assigned user, and comment count.
 */
const BugCard = ({ bug, compact = false }) => {
  const navigate = useNavigate();

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div
      className="bug-card animate-fade-in"
      onClick={() => navigate(`/bugs/${bug._id}`)}
      style={{ cursor: 'pointer' }}
    >
      {/* Priority dot indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span className={`badge ${getPriorityClass(bug.priority)}`}>{bug.priority}</span>
        <span className={`badge ${getSeverityClass(bug.severity)}`}>{bug.severity}</span>
      </div>

      {/* Title */}
      <h4 style={{
        fontSize: '0.875rem',
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: '0.625rem',
        lineHeight: 1.3,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {bug.title}
      </h4>

      {!compact && (
        <p style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginBottom: '0.75rem',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: 1.5,
        }}>
          {bug.description}
        </p>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.625rem' }}>
        {/* Assigned user avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {bug.assignedTo ? (
            <div
              className="user-avatar"
              style={{ width: 26, height: 26, fontSize: '0.65rem' }}
              data-tooltip={bug.assignedTo.name}
            >
              {getInitials(bug.assignedTo.name)}
            </div>
          ) : (
            <div
              style={{
                width: 26, height: 26, borderRadius: '50%',
                border: '2px dashed var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              data-tooltip="Unassigned"
            >
              <User size={12} color="var(--text-muted)" />
            </div>
          )}
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {bug.assignedTo?.name || 'Unassigned'}
          </span>
        </div>

        {/* Comment count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
          <MessageSquare size={12} />
          <span>{bug.comments?.length || 0}</span>
        </div>
      </div>

      {/* Date */}
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
        {bug.createdAt && format(new Date(bug.createdAt), 'MMM d, yyyy')}
      </div>
    </div>
  );
};

export default BugCard;
