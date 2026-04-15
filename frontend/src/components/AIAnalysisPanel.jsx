import { useState } from 'react';
import {
  Brain, Sparkles, AlertTriangle, Copy, Users, FileText,
  ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Loader2,
  Shield, Monitor, Zap, Database, Globe, Server, HelpCircle,
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

/**
 * Category icon mapping for visual feedback
 */
const CATEGORY_ICONS = {
  UI: Monitor,
  Backend: Server,
  Performance: Zap,
  Security: Shield,
  Database: Database,
  Network: Globe,
  Other: HelpCircle,
};

const CATEGORY_COLORS = {
  UI: '#6366f1',
  Backend: '#f59e0b',
  Performance: '#ef4444',
  Security: '#dc2626',
  Database: '#8b5cf6',
  Network: '#3b82f6',
  Other: '#94a3b8',
};

const SEVERITY_COLORS = {
  Critical: '#ef4444',
  High: '#f59e0b',
  Medium: '#3b82f6',
  Low: '#22c55e',
};

/**
 * AIAnalysisPanel — Real-time AI insights during bug creation/editing.
 *
 * Shows:
 *   - Bug classification (category)
 *   - Priority/severity prediction with explainable factors
 *   - AI-generated summary
 *   - Duplicate detection warnings
 *   - Auto-assignment suggestion
 *   - Feedback buttons (thumbs up/down)
 */
const AIAnalysisPanel = ({ title, description, stepsToReproduce, environment, bugId, onApplyPriority, onApplyAssignee }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({
    classification: true,
    priority: true,
    summary: false,
    duplicates: true,
    assignment: false,
  });

  const canAnalyze = title?.trim().length >= 5 && description?.trim().length >= 10;

  const runAnalysis = async () => {
    if (!canAnalyze) {
      toast.error('Please enter at least a title (5+ chars) and description (10+ chars)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post('/ai/analyze', {
        title: title.trim(),
        description: description.trim(),
        stepsToReproduce: stepsToReproduce?.trim() || '',
        environment: environment?.trim() || '',
      });

      setAnalysis(data);
    } catch (err) {
      const msg = err.response?.data?.message || 'AI analysis failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sendFeedback = async (predictionType, aiPrediction, isCorrect) => {
    try {
      await api.post('/ai/feedback', {
        bugId: bugId || 'pending',
        predictionType,
        aiPrediction,
        userCorrection: isCorrect ? aiPrediction : 'corrected_by_user',
      });
      toast.success('Feedback recorded! Thanks for improving our AI.');
    } catch {
      // Silent fail for feedback — non-critical
    }
  };

  const ConfidenceBadge = ({ value }) => {
    const pct = Math.round((value || 0) * 100);
    const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';
    return (
      <span style={{
        fontSize: '0.6875rem',
        fontWeight: 700,
        color,
        background: `${color}15`,
        padding: '2px 8px',
        borderRadius: 6,
      }}>
        {pct}% confident
      </span>
    );
  };

  const SectionHeader = ({ icon: Icon, title, sectionKey, iconColor = '#6366f1' }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
        padding: '0.5rem 0', color: 'var(--text-primary)', fontSize: '0.8125rem',
        fontWeight: 700,
      }}
    >
      <Icon size={14} color={iconColor} />
      <span style={{ flex: 1, textAlign: 'left' }}>{title}</span>
      {expanded[sectionKey] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    </button>
  );

  const FeedbackButtons = ({ type, prediction }) => (
    <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.375rem' }}>
      <button
        onClick={() => sendFeedback(type, prediction, true)}
        title="AI got it right"
        style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
          fontSize: '0.6875rem', color: '#22c55e',
        }}
      >
        <ThumbsUp size={10} /> Correct
      </button>
      <button
        onClick={() => sendFeedback(type, prediction, false)}
        title="AI got it wrong"
        style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
          fontSize: '0.6875rem', color: '#ef4444',
        }}
      >
        <ThumbsDown size={10} /> Wrong
      </button>
    </div>
  );

  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '1rem',
      marginTop: '0.75rem',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Brain size={14} color="white" />
          </div>
          <div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              AI Analysis
            </span>
            <span style={{
              fontSize: '0.625rem', color: 'var(--text-muted)',
              display: 'block', marginTop: -2,
            }}>
              Powered by Gemini
            </span>
          </div>
        </div>

        <button
          onClick={runAnalysis}
          disabled={loading || !canAnalyze}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.375rem 0.875rem',
            background: canAnalyze
              ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
              : 'var(--bg-muted)',
            color: canAnalyze ? 'white' : 'var(--text-muted)',
            border: 'none', borderRadius: 8,
            fontSize: '0.75rem', fontWeight: 600,
            cursor: canAnalyze && !loading ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</>
          ) : (
            <><Sparkles size={12} /> Analyze</>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 8, padding: '0.5rem 0.75rem', marginBottom: '0.75rem',
          fontSize: '0.75rem', color: '#ef4444',
        }}>
          {error}
        </div>
      )}

      {/* No analysis yet */}
      {!analysis && !loading && !error && (
        <p style={{
          fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center',
          padding: '0.5rem 0',
        }}>
          Click "Analyze" to get AI-powered insights for this bug
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <Loader2 size={24} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Running AI analysis pipeline...
          </p>
        </div>
      )}

      {/* Results */}
      {analysis && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>

          {/* ── Classification ── */}
          {analysis.classification && (
            <div>
              <SectionHeader icon={Brain} title="Bug Classification" sectionKey="classification" />
              {expanded.classification && (
                <div style={{
                  background: 'var(--bg-surface, rgba(99,102,241,0.05))',
                  borderRadius: 8, padding: '0.625rem', marginBottom: '0.375rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                    {(() => {
                      const CatIcon = CATEGORY_ICONS[analysis.classification.category] || HelpCircle;
                      const catColor = CATEGORY_COLORS[analysis.classification.category] || '#94a3b8';
                      return (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          background: `${catColor}20`, border: `1px solid ${catColor}40`,
                          borderRadius: 8, padding: '4px 10px',
                          fontSize: '0.8125rem', fontWeight: 700, color: catColor,
                        }}>
                          <CatIcon size={14} /> {analysis.classification.category}
                        </span>
                      );
                    })()}
                    <ConfidenceBadge value={analysis.classification.confidence} />
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    💡 {analysis.classification.reasoning}
                  </p>
                  {analysis.classification.keywords?.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.375rem' }}>
                      {analysis.classification.keywords.map((kw, i) => (
                        <span key={i} style={{
                          fontSize: '0.625rem', background: 'var(--bg-muted)',
                          padding: '2px 6px', borderRadius: 4, color: 'var(--text-muted)',
                        }}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                  <FeedbackButtons type="classification" prediction={analysis.classification.category} />
                </div>
              )}
            </div>
          )}

          {/* ── Priority/Severity Prediction ── */}
          {analysis.priority && (
            <div>
              <SectionHeader icon={AlertTriangle} title="Priority Prediction" sectionKey="priority" iconColor="#f59e0b" />
              {expanded.priority && (
                <div style={{
                  background: 'var(--bg-surface, rgba(245,158,11,0.05))',
                  borderRadius: 8, padding: '0.625rem', marginBottom: '0.375rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: 8, fontWeight: 700, fontSize: '0.75rem',
                      background: `${SEVERITY_COLORS[analysis.priority.severity] || '#94a3b8'}20`,
                      color: SEVERITY_COLORS[analysis.priority.severity] || '#94a3b8',
                      border: `1px solid ${SEVERITY_COLORS[analysis.priority.severity] || '#94a3b8'}40`,
                    }}>
                      Severity: {analysis.priority.severity}
                    </span>
                    <span style={{
                      padding: '4px 10px', borderRadius: 8, fontWeight: 700, fontSize: '0.75rem',
                      background: 'rgba(99,102,241,0.1)', color: '#6366f1',
                      border: '1px solid rgba(99,102,241,0.3)',
                    }}>
                      Priority: {analysis.priority.priority}
                    </span>
                    <ConfidenceBadge value={analysis.priority.confidence} />
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    💡 {analysis.priority.reasoning}
                  </p>

                  {/* Explainable AI factors */}
                  {analysis.priority.factors?.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <p style={{ fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                        Decision Factors:
                      </p>
                      {analysis.priority.factors.map((f, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: '0.375rem',
                          fontSize: '0.6875rem', marginBottom: '2px',
                          color: 'var(--text-muted)',
                        }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: f.impact === 'positive' ? '#22c55e' :
                                       f.impact === 'negative' ? '#ef4444' : '#94a3b8',
                            flexShrink: 0,
                          }} />
                          <strong>{f.factor}:</strong> {f.explanation}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {onApplyPriority && (
                      <button
                        onClick={() => onApplyPriority(analysis.priority.severity, analysis.priority.priority)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
                          borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                          fontSize: '0.6875rem', fontWeight: 600, color: '#6366f1',
                        }}
                      >
                        <Sparkles size={10} /> Apply Suggestion
                      </button>
                    )}
                    <FeedbackButtons type="severity" prediction={analysis.priority.severity} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Summary ── */}
          {analysis.summary && (
            <div>
              <SectionHeader icon={FileText} title="AI Summary" sectionKey="summary" iconColor="#22c55e" />
              {expanded.summary && (
                <div style={{
                  background: 'var(--bg-surface, rgba(34,197,94,0.05))',
                  borderRadius: 8, padding: '0.625rem', marginBottom: '0.375rem',
                }}>
                  <p style={{ fontSize: '0.75rem', lineHeight: 1.6, margin: 0, color: 'var(--text-primary)' }}>
                    {analysis.summary.summary}
                  </p>
                  {analysis.summary.impact && (
                    <p style={{ fontSize: '0.6875rem', color: '#f59e0b', marginTop: '0.375rem', margin: '0.375rem 0 0' }}>
                      ⚡ Impact: {analysis.summary.impact}
                    </p>
                  )}
                  {analysis.summary.suggestedAction && (
                    <p style={{ fontSize: '0.6875rem', color: '#22c55e', marginTop: '0.25rem', margin: '0.25rem 0 0' }}>
                      ✅ Next step: {analysis.summary.suggestedAction}
                    </p>
                  )}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(analysis.summary.summary);
                      toast.success('Summary copied!');
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px', marginTop: '0.375rem',
                      background: 'none', border: '1px solid var(--border)', borderRadius: 6,
                      padding: '3px 8px', cursor: 'pointer',
                      fontSize: '0.625rem', color: 'var(--text-muted)',
                    }}
                  >
                    <Copy size={10} /> Copy
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Duplicate Detection ── */}
          {analysis.duplicates && (
            <div>
              <SectionHeader
                icon={AlertTriangle}
                title={`Duplicates (${analysis.duplicates.duplicates?.length || 0} found)`}
                sectionKey="duplicates"
                iconColor={analysis.duplicates.isDuplicate ? '#ef4444' : '#94a3b8'}
              />
              {expanded.duplicates && (
                <div style={{
                  background: analysis.duplicates.isDuplicate
                    ? 'rgba(239,68,68,0.05)'
                    : 'var(--bg-surface, rgba(148,163,184,0.05))',
                  borderRadius: 8, padding: '0.625rem', marginBottom: '0.375rem',
                  border: analysis.duplicates.isDuplicate
                    ? '1px solid rgba(239,68,68,0.2)' : 'none',
                }}>
                  {analysis.duplicates.isDuplicate && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.375rem',
                      marginBottom: '0.5rem', color: '#ef4444', fontSize: '0.75rem', fontWeight: 700,
                    }}>
                      <AlertTriangle size={14} /> High chance this is a duplicate!
                    </div>
                  )}
                  {analysis.duplicates.duplicates?.length > 0 ? (
                    analysis.duplicates.duplicates.map((dup, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.375rem 0.5rem', borderRadius: 6,
                        background: 'var(--bg-elevated)', marginBottom: '0.25rem',
                        border: '1px solid var(--border)',
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: '0.7rem', fontWeight: 600, margin: 0,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {dup.title}
                          </p>
                          <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                            {dup.status} • {dup.severity} • {dup.assignedTo}
                          </p>
                        </div>
                        <span style={{
                          fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0, marginLeft: '0.5rem',
                          color: dup.similarity >= 90 ? '#ef4444' :
                                 dup.similarity >= 80 ? '#f59e0b' : '#3b82f6',
                        }}>
                          {dup.similarity}%
                        </span>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '0.7rem', color: '#22c55e', margin: 0 }}>
                      ✅ No similar bugs found — this appears to be a unique report.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Assignment Suggestion ── */}
          {analysis.assignment && analysis.assignment.suggestedDeveloperId && (
            <div>
              <SectionHeader icon={Users} title="Suggested Assignment" sectionKey="assignment" iconColor="#8b5cf6" />
              {expanded.assignment && (
                <div style={{
                  background: 'var(--bg-surface, rgba(139,92,246,0.05))',
                  borderRadius: 8, padding: '0.625rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '0.6875rem', fontWeight: 700,
                    }}>
                      {analysis.assignment.developerName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                        {analysis.assignment.developerName}
                      </p>
                      <ConfidenceBadge value={analysis.assignment.confidence} />
                    </div>
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    💡 {analysis.assignment.reasoning}
                  </p>
                  {onApplyAssignee && (
                    <button
                      onClick={() => onApplyAssignee(analysis.assignment.suggestedDeveloperId)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px', marginTop: '0.375rem',
                        background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
                        borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                        fontSize: '0.6875rem', fontWeight: 600, color: '#8b5cf6',
                      }}
                    >
                      <Users size={10} /> Assign to {analysis.assignment.developerName}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAnalysisPanel;
