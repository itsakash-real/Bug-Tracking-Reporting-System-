import { useState } from 'react';
import { format } from 'date-fns';
import { Send, Trash2, MessageSquare } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

/**
 * CommentSection — displays comments for a bug and allows adding/deleting them.
 */
const CommentSection = ({ bugId, comments: initialComments, onUpdate }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState(initialComments || []);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/bugs/${bugId}/comments`, { text });
      setComments(res.data.comments);
      setText('');
      toast.success('Comment added');
      if (onUpdate) onUpdate(res.data.comments);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      const res = await api.delete(`/bugs/${bugId}/comments/${commentId}`);
      setComments(res.data.comments);
      toast.success('Comment deleted');
    } catch (err) {
      toast.error('Failed to delete comment');
    }
  };

  const getRoleColor = (role) => {
    if (role === 'Admin') return '#f59e0b';
    if (role === 'Developer') return '#6366f1';
    return '#22c55e';
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <MessageSquare size={18} color="#6366f1" />
        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
          Comments <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.875rem' }}>({comments.length})</span>
        </h3>
      </div>

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="empty-state" style={{ padding: '2rem' }}>
          <MessageSquare size={32} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
          <p style={{ fontSize: '0.875rem' }}>No comments yet. Be the first!</p>
        </div>
      ) : (
        <div style={{ marginBottom: '1.25rem' }}>
          {comments.map((comment) => (
            <div key={comment._id} style={{
              display: 'flex', gap: '0.75rem', padding: '0.875rem 0',
              borderBottom: '1px solid var(--border)',
            }}>
              <div
                className="user-avatar"
                style={{ width: 32, height: 32, fontSize: '0.75rem', flexShrink: 0 }}
              >
                {getInitials(comment.author?.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{comment.author?.name}</span>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 600,
                    color: getRoleColor(comment.author?.role),
                    background: 'rgba(99,102,241,0.08)',
                    padding: '1px 6px', borderRadius: 4,
                  }}>
                    {comment.author?.role}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {comment.createdAt && format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {comment.text}
                </p>
              </div>
              {/* Delete button — only for author or Admin */}
              {(user?._id === comment.author?._id || user?.role === 'Admin') && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleDelete(comment._id)}
                  style={{ color: '#ef4444', flexShrink: 0 }}
                  data-tooltip="Delete comment"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add comment form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.75rem', flexShrink: 0, marginTop: '2px' }}>
          {getInitials(user?.name)}
        </div>
        <div style={{ flex: 1 }}>
          <textarea
            id="comment-input"
            className="form-textarea"
            placeholder="Write a comment..."
            value={text}
            onChange={e => setText(e.target.value)}
            rows={2}
            style={{ marginBottom: '0.5rem' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={submitting || !text.trim()}
            >
              {submitting ? (
                <span className="spinner" style={{ width: 14, height: 14 }} />
              ) : (
                <Send size={14} />
              )}
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CommentSection;
