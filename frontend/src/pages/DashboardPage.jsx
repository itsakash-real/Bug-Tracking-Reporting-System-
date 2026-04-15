import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  Tooltip, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { Bug, CheckCircle, Clock, AlertCircle, TrendingUp, Plus } from 'lucide-react';
import api from '../api/axios';
import StatsCard from '../components/StatsCard';
import { format } from 'date-fns';
import { getSeverityClass, getStatusClass, getPriorityClass } from '../components/BugCard';

const SEVERITY_COLORS = { Critical: '#ef4444', High: '#f59e0b', Medium: '#3b82f6', Low: '#22c55e' };
const STATUS_COLORS   = { Open: '#6366f1', 'In Progress': '#f59e0b', Closed: '#22c55e' };

/**
 * DashboardPage — shows summary metrics, charts, and recent bugs.
 */
const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/bugs/stats')
      .then(res => setStats(res.data.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  // Format severity data for charts
  const severityChartData = (stats?.severityStats || []).map(s => ({
    name: s._id, value: s.count, fill: SEVERITY_COLORS[s._id] || '#94a3b8',
  }));

  const priorityChartData = (stats?.priorityStats || []).map(p => ({
    name: p._id, value: p.count,
  }));

  const statusChartData = [
    { name: 'Open', value: stats?.open || 0, fill: STATUS_COLORS.Open },
    { name: 'In Progress', value: stats?.inProgress || 0, fill: STATUS_COLORS['In Progress'] },
    { name: 'Closed', value: stats?.closed || 0, fill: STATUS_COLORS.Closed },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '0.625rem 0.875rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          fontSize: '0.8125rem',
        }}>
          <p style={{ fontWeight: 600 }}>{label || payload[0].name}</p>
          <p style={{ color: '#6366f1' }}>{payload[0].value} bugs</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Overview of your bug tracking activity</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/bugs?new=true')}>
          <Plus size={16} /> New Bug
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <StatsCard
          title="Total Bugs"
          value={stats?.total}
          color="blue"
          icon={Bug}
          iconBg="rgba(59,130,246,0.12)"
          subtitle="All time"
        />
        <StatsCard
          title="Open"
          value={stats?.open}
          color="red"
          icon={AlertCircle}
          iconBg="rgba(239,68,68,0.12)"
          subtitle="Needs attention"
        />
        <StatsCard
          title="In Progress"
          value={stats?.inProgress}
          color="amber"
          icon={Clock}
          iconBg="rgba(245,158,11,0.12)"
          subtitle="Being worked on"
        />
        <StatsCard
          title="Closed"
          value={stats?.closed}
          color="green"
          icon={CheckCircle}
          iconBg="rgba(34,197,94,0.12)"
          subtitle="Resolved"
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.75rem' }}>
        {/* Bug Status Pie Chart */}
        <div className="card">
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} color="#6366f1" />
            Bug Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {statusChartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.8rem' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Severity Bar Chart */}
        <div className="card">
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} color="#ef4444" />
            Bugs by Severity
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={severityChartData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {severityChartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Priority Bar Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bug size={16} color="#8b5cf6" />
            Bugs by Priority
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priorityChartData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Bugs */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Recent Bugs</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/bugs')} style={{ color: '#6366f1', fontSize: '0.8rem' }}>
              View all →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {(stats?.recentBugs || []).map(bug => (
              <div
                key={bug._id}
                onClick={() => navigate(`/bugs/${bug._id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.625rem', borderRadius: 10,
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {bug.title}
                  </p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {bug.createdAt && format(new Date(bug.createdAt), 'MMM d')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                  <span className={`badge ${getSeverityClass(bug.severity)}`}>{bug.severity}</span>
                  <span className={`badge ${getStatusClass(bug.status)}`}>{bug.status}</span>
                </div>
              </div>
            ))}
            {!stats?.recentBugs?.length && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
                No bugs yet. Create your first one!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
