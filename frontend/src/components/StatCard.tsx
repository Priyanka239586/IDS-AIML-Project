import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title, value, subtitle, icon, color = 'var(--cyan)', loading = false,
}) => (
  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
      {icon && <span style={{ color, opacity: 0.8 }}>{icon}</span>}
    </div>
    {loading
      ? <div className="spinner" />
      : <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>}
    {subtitle && <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{subtitle}</div>}
  </div>
);

export default StatCard;
