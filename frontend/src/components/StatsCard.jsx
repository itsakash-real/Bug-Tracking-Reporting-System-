/**
 * StatsCard — a dashboard metric card with color accent bar and icon.
 * @param {string} title - Metric label
 * @param {number} value - Metric value
 * @param {string} color - Accent color class: 'blue' | 'green' | 'amber' | 'red'
 * @param {ReactNode} icon - Lucide icon component
 * @param {string} subtitle - Optional context text
 */
const StatsCard = ({ title, value, color, icon: Icon, subtitle, iconBg }) => {
  return (
    <div className={`stats-card ${color}`}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>
            {title}
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.04em' }}>
            {value ?? '—'}
          </p>
          {subtitle && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: iconBg || 'rgba(99,102,241,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={21} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
