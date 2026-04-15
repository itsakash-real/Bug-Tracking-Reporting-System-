import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import api from '../api/axios';

/**
 * FilterBar — provides search + multi-filter controls for the bug list.
 * Calls onFilterChange whenever any filter changes.
 */
const FilterBar = ({ onFilterChange, initialFilters = {} }) => {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    severity: '',
    priority: '',
    assignedTo: '',
    ...initialFilters,
  });

  useEffect(() => {
    api.get('/users').then(res => setUsers(res.data.users || [])).catch(() => {});
  }, []);

  const handleChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const cleared = { search: '', status: '', severity: '', priority: '', assignedTo: '' };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
      <div className="filter-bar">
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '320px' }}>
          <Search size={15} style={{
            position: 'absolute', left: '0.75rem', top: '50%',
            transform: 'translateY(-50%)', color: 'var(--text-muted)',
          }} />
          <input
            id="filter-search"
            type="text"
            className="form-input"
            placeholder="Search bugs..."
            value={filters.search}
            onChange={e => handleChange('search', e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>

        {/* Status */}
        <select
          id="filter-status"
          className="form-select"
          value={filters.status}
          onChange={e => handleChange('status', e.target.value)}
          style={{ minWidth: '140px' }}
        >
          <option value="">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Closed">Closed</option>
        </select>

        {/* Severity */}
        <select
          id="filter-severity"
          className="form-select"
          value={filters.severity}
          onChange={e => handleChange('severity', e.target.value)}
          style={{ minWidth: '140px' }}
        >
          <option value="">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        {/* Priority */}
        <select
          id="filter-priority"
          className="form-select"
          value={filters.priority}
          onChange={e => handleChange('priority', e.target.value)}
          style={{ minWidth: '120px' }}
        >
          <option value="">All Priorities</option>
          <option value="P1">P1 — Critical</option>
          <option value="P2">P2 — High</option>
          <option value="P3">P3 — Medium</option>
          <option value="P4">P4 — Low</option>
        </select>

        {/* Assigned To */}
        <select
          id="filter-assignedTo"
          className="form-select"
          value={filters.assignedTo}
          onChange={e => handleChange('assignedTo', e.target.value)}
          style={{ minWidth: '150px' }}
        >
          <option value="">All Assignees</option>
          {users.map(u => (
            <option key={u._id} value={u._id}>{u.name}</option>
          ))}
        </select>

        {/* Clear button */}
        {hasActiveFilters && (
          <button
            id="filter-clear"
            className="btn btn-ghost btn-sm"
            onClick={clearFilters}
            style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
