import React from 'react';

const TYPE_CLASS: Record<string, string> = {
  Normal: 'badge-normal', DoS: 'badge-dos',
  Probe: 'badge-probe', R2L: 'badge-r2l', U2R: 'badge-u2r',
};
const SEV_CLASS: Record<string, string> = {
  critical: 'badge-critical', high: 'badge-high',
  medium: 'badge-medium', low: 'badge-low',
};

export const AttackBadge: React.FC<{ type: string }> = ({ type }) => (
  <span className={`badge ${TYPE_CLASS[type] ?? 'badge-normal'}`}>{type}</span>
);

export const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => (
  <span className={`badge ${SEV_CLASS[severity] ?? 'badge-low'}`}>{severity}</span>
);

export default AttackBadge;
