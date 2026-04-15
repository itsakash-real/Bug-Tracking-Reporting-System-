import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Kanban, RefreshCw } from 'lucide-react';
import api from '../api/axios';
import BugCard from '../components/BugCard';
import BugModal from '../components/BugModal';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const COLUMNS = [
  { id: 'Open',        label: 'Open',        color: '#6366f1', bgColor: 'rgba(99,102,241,0.08)' },
  { id: 'In Progress', label: 'In Progress',  color: '#f59e0b', bgColor: 'rgba(245,158,11,0.08)' },
  { id: 'Closed',      label: 'Closed',       color: '#22c55e', bgColor: 'rgba(34,197,94,0.08)' },
];

/**
 * KanbanPage — drag-and-drop board grouped by status.
 * Drag enforces the valid workflow (Open → In Progress → Closed).
 * Admin can drag freely across any column.
 */
const KanbanPage = () => {
  const { user } = useAuth();
  const [columns, setColumns] = useState({ Open: [], 'In Progress': [], Closed: [] });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const VALID_TRANSITIONS = {
    Open: ['In Progress'],
    'In Progress': ['Closed', 'Open'],
    Closed: ['Open'],
  };

  const fetchBugs = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all bugs without pagination for Kanban
      const res = await api.get('/bugs', { params: { limit: 200 } });
      const bugList = res.data.bugs || [];

      const grouped = { Open: [], 'In Progress': [], Closed: [] };
      bugList.forEach(bug => {
        if (grouped[bug.status]) grouped[bug.status].push(bug);
      });
      setColumns(grouped);
    } catch {
      toast.error('Failed to load Kanban board');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBugs();
  }, [fetchBugs]);

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const fromStatus = source.droppableId;
    const toStatus = destination.droppableId;

    if (fromStatus === toStatus) return; // No reordering within column

    const isAdmin = user?.role === 'Admin';
    const allowed = isAdmin || VALID_TRANSITIONS[fromStatus]?.includes(toStatus);

    if (!allowed) {
      toast.error(`Cannot move: "${fromStatus}" → "${toStatus}" is not a valid transition`);
      return;
    }

    // Check if user is the assigned developer
    const movingBug = columns[fromStatus].find(b => b._id === draggableId);
    if (!isAdmin && movingBug?.assignedTo?._id !== user?._id) {
      toast.error('Only the assigned developer or an Admin can change bug status');
      return;
    }

    // Optimistic update
    const newColumns = { ...columns };
    const [movedBug] = newColumns[fromStatus].splice(source.index, 1);
    movedBug.status = toStatus;
    newColumns[toStatus].splice(destination.index, 0, movedBug);
    setColumns(newColumns);

    try {
      await api.put(`/bugs/${draggableId}`, { status: toStatus });
      toast.success(`Moved to "${toStatus}"`);
    } catch (err) {
      // Revert on failure
      toast.error(err.response?.data?.message || 'Status update failed');
      fetchBugs();
    }
  };

  const handleSave = () => {
    setShowModal(false);
    fetchBugs();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ width: 36, height: 36 }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Kanban Board</h2>
          <p className="page-subtitle">Drag bugs across columns to update their status</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setRefreshing(true); fetchBugs(); }}
            title="Refresh"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> New Bug
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          {COLUMNS.map(col => (
            <div key={col.id}>
              <div className="kanban-column">
                {/* Column Header */}
                <div className="kanban-column-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', background: col.color,
                      boxShadow: `0 0 8px ${col.color}`,
                    }} />
                    <span style={{ color: col.color }}>{col.label}</span>
                  </div>
                  <span style={{
                    background: col.bgColor, color: col.color,
                    padding: '2px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700,
                  }}>
                    {columns[col.id]?.length || 0}
                  </span>
                </div>

                {/* Droppable area */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="kanban-column-body"
                      style={{
                        minHeight: 200,
                        background: snapshot.isDraggingOver ? col.bgColor : undefined,
                        transition: 'background 0.2s ease',
                        borderRadius: '0 0 16px 16px',
                      }}
                    >
                      {(columns[col.id] || []).length === 0 && !snapshot.isDraggingOver && (
                        <div style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          justifyContent: 'center', height: 120,
                          color: 'var(--text-muted)', fontSize: '0.8125rem',
                          border: '2px dashed var(--border)',
                          borderRadius: 10,
                        }}>
                          <Kanban size={24} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
                          No bugs here
                        </div>
                      )}

                      {(columns[col.id] || []).map((bug, index) => (
                        <Draggable key={bug._id} draggableId={bug._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.85 : 1,
                                transform: snapshot.isDragging
                                  ? `${provided.draggableProps.style?.transform} rotate(1.5deg)`
                                  : provided.draggableProps.style?.transform,
                              }}
                            >
                              <BugCard bug={bug} compact />
                            </div>
                          )}
                        </Draggable>
                      ))}

                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          ))}
        </div>
      </DragDropContext>

      {showModal && (
        <BugModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default KanbanPage;
