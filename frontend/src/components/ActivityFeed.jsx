import { format } from 'date-fns';
import { Activity, User } from 'lucide-react';

/**
 * Maps activity action type to a human-readable label and color dot.
 */
const ACTION_MAP = {
  created: { label: 'Created', color: '#6366f1' },
  status_changed: { label: 'Status Changed', color: '#f59e0b' },
  field_updated: { label: 'Field Updated', color: '#3b82f6' },
  assigned: { label: 'Reassigned', color: '#8b5cf6' },
  comment_added: { label: 'Comment Added', color: '#22c55e' },
};

/**
 * ActivityFeed — shows a vertical timeline of bug activity log entries.
 */
const ActivityFeed = ({ activities = [] }) => {
  if (!activities.length) {
    return (
      <div className="empty-state" style={{ padding: '2rem' }}>
        <Activity size={28} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
        <p style={{ fontSize: '0.875rem' }}>No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div>
      {[...activities].reverse().map((activity, idx) => {
        const meta = ACTION_MAP[activity.action] || { label: activity.action, color: '#94a3b8' };
        return (
          <div key={idx} className="activity-item">
            <div
              className="activity-dot"
              style={{ background: meta.color }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.125rem' }}>
                <span style={{
                  fontSize: '0.72rem', fontWeight: 700,
                  color: meta.color,
                  background: `${meta.color}18`,
                  padding: '1px 8px', borderRadius: 4,
                }}>
                  {meta.label}
                </span>
                {activity.field && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    ({activity.field})
                  </span>
                )}
              </div>

              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {activity.description || `${meta.label} by ${activity.performedBy?.name}`}
              </p>

              {/* Old → New value */}
              {activity.oldValue && activity.newValue && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                  <span style={{ color: '#ef4444' }}>{activity.oldValue}</span>
                  {' → '}
                  <span style={{ color: '#22c55e' }}>{activity.newValue}</span>
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.25rem' }}>
                <User size={11} color="var(--text-muted)" />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {activity.performedBy?.name || 'Unknown'}
                  {' · '}
                  {activity.createdAt && format(new Date(activity.createdAt), 'MMM d, h:mm a')}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityFeed;
