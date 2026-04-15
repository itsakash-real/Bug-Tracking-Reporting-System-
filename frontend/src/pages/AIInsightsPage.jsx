import { useState, useEffect } from 'react';
import {
  Brain, TrendingUp, Target, CheckCircle, XCircle, AlertTriangle,
  BarChart3, PieChart as PieChartIcon, Activity, RefreshCw, Sparkles,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  Tooltip, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line,
} from 'recharts';
import api from '../api/axios';
import StatsCard from '../components/StatsCard';

const CATEGORY_COLORS = {
  UI: '#6366f1',
  Backend: '#f59e0b',
  Performance: '#ef4444',
  Security: '#dc2626',
  Database: '#8b5cf6',
  Network: '#3b82f6',
  Other: '#94a3b8',
};

const ACCURACY_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];

/**
 * AIInsightsPage — Dashboard showing AI performance metrics, trends, and accuracy.
 *
 * Displays:
 *   - Overall AI accuracy rate
 *   - Accuracy breakdown by prediction type
 *   - Most common bug categories (AI-classified)
 *   - Total bugs analyzed by AI
 *   - Recent user feedback
 */
const AIInsightsPage = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data } = await api.get('/ai/insights');
      setInsights(data.insights);
    } catch (err) {
      console.error('Failed to fetch AI insights:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  const accuracyData = (insights?.accuracyByType || []).map((item, i) => ({
    name: item._id?.charAt(0).toUpperCase() + item._id?.slice(1),
    accuracy: Math.round(item.accuracy),
    total: item.total,
    correct: item.correct,
    fill: ACCURACY_COLORS[i % ACCURACY_COLORS.length],
  }));

  const categoryData = (insights?.categoryDistribution || []).map(item => ({
    name: item._id || 'Unknown',
    value: item.count,
    fill: CATEGORY_COLORS[item._id] || '#94a3b8',
  }));

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
          <p style={{ color: '#6366f1' }}>{payload[0].value}{typeof payload[0].value === 'number' && payload[0].value <= 100 ? '%' : ''}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Brain size={18} color="white" />
            </div>
            AI Insights
          </h2>
          <p className="page-subtitle">
            Monitor AI performance, accuracy trends, and prediction analytics
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => fetchInsights(true)}
          disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
        >
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem', marginBottom: '1.75rem',
      }}>
        <StatsCard
          title="AI Accuracy"
          value={insights?.overallAccuracy != null ? `${insights.overallAccuracy}%` : '—'}
          color="green"
          icon={Target}
          iconBg="rgba(34,197,94,0.12)"
          subtitle={`${insights?.correctFeedback || 0} / ${insights?.totalFeedback || 0} correct`}
        />
        <StatsCard
          title="Bugs Analyzed"
          value={insights?.totalBugsWithAI || 0}
          color="blue"
          icon={Brain}
          iconBg="rgba(99,102,241,0.12)"
          subtitle="AI-powered insights"
        />
        <StatsCard
          title="Duplicates Detected"
          value={insights?.duplicatesDetected || 0}
          color="amber"
          icon={AlertTriangle}
          iconBg="rgba(245,158,11,0.12)"
          subtitle="Potential duplicates found"
        />
        <StatsCard
          title="User Feedback"
          value={insights?.totalFeedback || 0}
          color="purple"
          icon={Activity}
          iconBg="rgba(139,92,246,0.12)"
          subtitle="Corrections & confirmations"
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.75rem' }}>
        {/* Accuracy by Type */}
        <div className="card">
          <h3 style={{
            fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1.25rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <BarChart3 size={16} color="#22c55e" />
            Accuracy by Prediction Type
          </h3>
          {accuracyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={accuracyData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => `${v}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                  {accuracyData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: 220, color: 'var(--text-muted)',
            }}>
              <Sparkles size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.8125rem' }}>No feedback data yet</p>
              <p style={{ fontSize: '0.75rem' }}>Use AI features and provide feedback to see accuracy</p>
            </div>
          )}
        </div>

        {/* Bug Category Distribution */}
        <div className="card">
          <h3 style={{
            fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1.25rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <PieChartIcon size={16} color="#6366f1" />
            AI-Classified Bug Categories
          </h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.8rem' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: 220, color: 'var(--text-muted)',
            }}>
              <Brain size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.8125rem' }}>No AI classifications yet</p>
              <p style={{ fontSize: '0.75rem' }}>Create bugs and run AI analysis to see categories</p>
            </div>
          )}
        </div>
      </div>

      {/* Severity Prediction Accuracy + Recent Feedback */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Severity Match Rate */}
        <div className="card">
          <h3 style={{
            fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1.25rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <TrendingUp size={16} color="#f59e0b" />
            Severity Prediction Match Rate
          </h3>
          {insights?.severityDistribution ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                width: 120, height: 120, borderRadius: '50%', margin: '0 auto 1rem',
                background: `conic-gradient(
                  #22c55e ${(insights.severityDistribution.matched / Math.max(insights.severityDistribution.totalPredicted, 1)) * 360}deg,
                  rgba(148,163,184,0.2) 0deg
                )`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 88, height: 88, borderRadius: '50%',
                  background: 'var(--bg-elevated)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column',
                }}>
                  <span style={{ fontWeight: 800, fontSize: '1.5rem', color: '#22c55e' }}>
                    {Math.round((insights.severityDistribution.matched / Math.max(insights.severityDistribution.totalPredicted, 1)) * 100)}%
                  </span>
                  <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>match rate</span>
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {insights.severityDistribution.matched} of {insights.severityDistribution.totalPredicted} severity predictions matched final value
              </p>
            </div>
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: 180, color: 'var(--text-muted)',
            }}>
              <Target size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.8125rem' }}>No severity predictions yet</p>
            </div>
          )}
        </div>

        {/* Recent Feedback */}
        <div className="card">
          <h3 style={{
            fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <Activity size={16} color="#8b5cf6" />
            Recent Feedback
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(insights?.recentFeedback || []).length > 0 ? (
              insights.recentFeedback.slice(0, 6).map((fb, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '0.625rem',
                  padding: '0.5rem', borderRadius: 8,
                  border: '1px solid var(--border)',
                  fontSize: '0.75rem',
                }}>
                  {fb.isCorrect ? (
                    <CheckCircle size={14} color="#22c55e" style={{ flexShrink: 0 }} />
                  ) : (
                    <XCircle size={14} color="#ef4444" style={{ flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontWeight: 600, margin: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {fb.bugId?.title || 'Bug'}
                    </p>
                    <p style={{ color: 'var(--text-muted)', margin: '2px 0 0', fontSize: '0.6875rem' }}>
                      {fb.predictionType} — AI: {fb.aiPrediction}
                      {!fb.isCorrect && <> → Corrected: {fb.userCorrection}</>}
                    </p>
                  </div>
                  <span style={{
                    fontSize: '0.625rem', color: 'var(--text-muted)', flexShrink: 0,
                  }}>
                    {fb.userId?.name}
                  </span>
                </div>
              ))
            ) : (
              <div style={{
                textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)',
              }}>
                <p style={{ fontSize: '0.8125rem' }}>No feedback yet</p>
                <p style={{ fontSize: '0.75rem' }}>
                  Use 👍/👎 buttons on AI predictions to provide feedback
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsPage;
