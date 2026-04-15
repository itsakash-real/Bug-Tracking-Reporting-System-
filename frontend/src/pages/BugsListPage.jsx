import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Bug, ChevronLeft, ChevronRight, Trash2, Edit } from 'lucide-react';
import api from '../api/axios';
import BugModal from '../components/BugModal';
import FilterBar from '../components/FilterBar';
import { getSeverityClass, getStatusClass, getPriorityClass } from '../components/BugCard';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

/**
 * BugsListPage — paginated, filterable table view of all bugs.
 * Supports creating, editing, and deleting bugs inline.
 */
const BugsListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, currentPage: 1 });
  const [filters, setFilters] = useState({ search: '', status: '', severity: '', priority: '', assignedTo: '' });
  const [showModal, setShowModal] = useState(searchParams.get('new') === 'true');
  const [editingBug, setEditingBug] = useState(null);
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  const fetchBugs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT, ...filters };
      // Remove empty strings
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
      const res = await api.get('/bugs', { params });
      setBugs(res.data.bugs);
      setPagination({
        total: res.data.total,
        totalPages: res.data.totalPages,
        currentPage: res.data.currentPage,
      });
    } catch {
      toast.error('Failed to load bugs');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchBugs();
  }, [fetchBugs]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleDelete = async (bugId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this bug?')) return;
    try {
      await api.delete(`/bugs/${bugId}`);
      toast.success('Bug deleted');
      fetchBugs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete bug');
    }
  };

  const handleSave = () => {
    setShowModal(false);
    setEditingBug(null);
    fetchBugs();
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">All Bugs</h2>
          <p className="page-subtitle">
            {pagination.total} bug{pagination.total !== 1 ? 's' : ''} found
          </p>
        </div>
        <button id="create-bug-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Bug
        </button>
      </div>

      {/* Filters */}
      <FilterBar onFilterChange={handleFilterChange} />

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ width: 36, height: 36 }} />
        </div>
      ) : bugs.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Bug size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No bugs found</h3>
            <p style={{ fontSize: '0.875rem' }}>Try adjusting your filters or create a new bug</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowModal(true)}>
              <Plus size={16} /> Create Bug
            </button>
          </div>
        </div>
      ) : (
        <div className="table-container" style={{ background: 'var(--bg-surface)' }}>
          <table>
            <thead>
              <tr>
                <th>Bug</th>
                <th>Status</th>
                <th>Severity</th>
                <th>Priority</th>
                <th>Assigned To</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bugs.map(bug => (
                <tr
                  key={bug._id}
                  onClick={() => navigate(`/bugs/${bug._id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ maxWidth: 300 }}>
                    <div>
                      <p style={{
                        fontWeight: 600, fontSize: '0.875rem',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        maxWidth: 280,
                      }}>
                        {bug.title}
                      </p>
                      {bug.environment && (
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {bug.environment}
                        </p>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getStatusClass(bug.status)}`}>{bug.status}</span>
                  </td>
                  <td>
                    <span className={`badge ${getSeverityClass(bug.severity)}`}>{bug.severity}</span>
                  </td>
                  <td>
                    <span className={`badge ${getPriorityClass(bug.priority)}`}>{bug.priority}</span>
                  </td>
                  <td>
                    {bug.assignedTo ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="user-avatar" style={{ width: 26, height: 26, fontSize: '0.65rem' }}>
                          {getInitials(bug.assignedTo.name)}
                        </div>
                        <span style={{ fontSize: '0.8rem' }}>{bug.assignedTo.name}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {bug.createdAt && format(new Date(bug.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }} onClick={e => e.stopPropagation()}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => { setEditingBug(bug); setShowModal(true); }}
                        data-tooltip="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      {(user?.role === 'Admin' || bug.createdBy?._id === user?._id) && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={(e) => handleDelete(bug._id, e)}
                          style={{ color: '#ef4444' }}
                          data-tooltip="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: '1rem', padding: '0.75rem',
        }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, pagination.total)} of {pagination.total}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: 'var(--text-muted)', padding: '0 0.5rem' }}>
              Page {page} of {pagination.totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <BugModal
          bug={editingBug}
          onClose={() => { setShowModal(false); setEditingBug(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default BugsListPage;
