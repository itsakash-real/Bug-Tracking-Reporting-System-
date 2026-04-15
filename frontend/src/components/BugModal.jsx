import { useState, useEffect } from 'react';
import { X, Bug } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

/**
 * BugModal — create or edit a bug.
 * Loads the list of available users for the assignee dropdown.
 */
const BugModal = ({ bug, onClose, onSave }) => {
  const isEditing = !!bug;

  const [formData, setFormData] = useState({
    title: bug?.title || '',
    description: bug?.description || '',
    severity: bug?.severity || 'Medium',
    priority: bug?.priority || 'P3',
    status: bug?.status || 'Open',
    assignedTo: bug?.assignedTo?._id || '',
    environment: bug?.environment || '',
    stepsToReproduce: bug?.stepsToReproduce || '',
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    // Load users for the assignee dropdown
    api.get('/users?role=Developer').then(res => {
      setUsers(res.data.users || []);
    }).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    const payload = {
      ...formData,
      assignedTo: formData.assignedTo || null,
    };

    try {
      let res;
      if (isEditing) {
        res = await api.put(`/bugs/${bug._id}`, payload);
      } else {
        res = await api.post('/bugs', payload);
      }
      toast.success(isEditing ? 'Bug updated successfully!' : 'Bug created successfully!');
      onSave(res.data.bug);
      onClose();
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors?.length) {
        setErrors(apiErrors);
      } else {
        toast.error(err.response?.data?.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Bug size={20} color="#6366f1" />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
              {isEditing ? 'Edit Bug' : 'Create New Bug'}
            </h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Validation errors */}
            {errors.length > 0 && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 10, padding: '0.75rem', marginBottom: '1rem',
              }}>
                {errors.map((err, i) => (
                  <p key={i} style={{ color: '#ef4444', fontSize: '0.8rem' }}>• {err.message}</p>
                ))}
              </div>
            )}

            {/* Title */}
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                id="bug-title"
                name="title"
                type="text"
                className="form-input"
                placeholder="Brief, descriptive bug title..."
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea
                id="bug-description"
                name="description"
                className="form-textarea"
                placeholder="Describe the bug in detail..."
                value={formData.description}
                onChange={handleChange}
                rows={4}
                required
              />
            </div>

            {/* Severity & Priority row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Severity *</label>
                <select id="bug-severity" name="severity" className="form-select" value={formData.severity} onChange={handleChange}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority *</label>
                <select id="bug-priority" name="priority" className="form-select" value={formData.priority} onChange={handleChange}>
                  <option value="P1">P1 — Critical</option>
                  <option value="P2">P2 — High</option>
                  <option value="P3">P3 — Medium</option>
                  <option value="P4">P4 — Low</option>
                </select>
              </div>
            </div>

            {/* Status & Assigned To row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {isEditing && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select id="bug-status" name="status" className="form-select" value={formData.status} onChange={handleChange}>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select id="bug-assignedTo" name="assignedTo" className="form-select" value={formData.assignedTo} onChange={handleChange}>
                  <option value="">— Unassigned —</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Environment */}
            <div className="form-group">
              <label className="form-label">Environment</label>
              <input
                id="bug-environment"
                name="environment"
                type="text"
                className="form-input"
                placeholder="e.g. Windows 11, Chrome 120"
                value={formData.environment}
                onChange={handleChange}
              />
            </div>

            {/* Steps to reproduce */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Steps to Reproduce</label>
              <textarea
                id="bug-steps"
                name="stepsToReproduce"
                className="form-textarea"
                placeholder="1. Go to...\n2. Click...\n3. Expected: ...\n4. Actual: ..."
                value={formData.stepsToReproduce}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <><span className="spinner" style={{ width: 16, height: 16 }} /> Saving...</>
              ) : (
                isEditing ? 'Save Changes' : 'Create Bug'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BugModal;
