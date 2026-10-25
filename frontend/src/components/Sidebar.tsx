import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Activity, Search, BarChart2,
  Layers, Bell, Database, GitBranch, Shield,
} from 'lucide-react';

const NAV = [
  { to: '/',            icon: LayoutDashboard, label: 'Overview' },
  { to: '/traffic',     icon: Activity,        label: 'Traffic Monitor' },
  { to: '/detect',      icon: Search,          label: 'Threat Detection' },
  { to: '/performance', icon: BarChart2,       label: 'Model Performance' },
  { to: '/features',    icon: Layers,          label: 'Feature Importance' },
  { to: '/alerts',      icon: Bell,            label: 'Alerts & Logs' },
  { to: '/info',        icon: Database,        label: 'Dataset & Model' },
  { to: '/workflow',    icon: GitBranch,       label: 'Project Workflow' },
];

const Sidebar: React.FC = () => (
  <aside style={{
    width: 'var(--sidebar-w)', minHeight: '100vh',
    background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', flexShrink: 0,
    position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
  }}>
    {/* Logo */}
    <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#06b6d4,#0891b2)',
        borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Shield size={18} color="#000" />
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>IDS-AIML</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>NSL-KDD · DNN</div>
      </div>
    </div>

    {/* Nav items */}
    <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {NAV.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} end={to === '/'}
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
            borderRadius: 8, textDecoration: 'none', fontSize: 13,
            fontWeight: isActive ? 600 : 400,
            color: isActive ? 'var(--cyan)' : 'var(--text-muted)',
            background: isActive ? 'rgba(6,182,212,0.1)' : 'transparent',
            transition: 'all 0.15s',
          })}>
          <Icon size={16} />
          {label}
        </NavLink>
      ))}
    </nav>

    {/* Footer */}
    <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)' }}>
      <div style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.8 }}>
        College Demo Project<br />Random Forest + DNN<br />NSL-KDD Dataset
      </div>
    </div>
  </aside>
);

export default Sidebar;
