import React, { useEffect, useState } from 'react';
import { Shield, AlertTriangle, Activity, Cpu, CheckCircle, XCircle } from 'lucide-react';
import StatCard from '../components/StatCard';
import { getHealth, getMetrics } from '../api/client';
import type { Metrics, HealthStatus } from '../types';

const CLASS_COLORS: Record<string, string> = {
  Normal: 'var(--cyan)', DoS: 'var(--red)',
  Probe: 'var(--yellow)', R2L: 'var(--purple)', U2R: 'var(--orange)',
};

const Overview: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [health, setHealth]   = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getHealth(), getMetrics()])
      .then(([h, m]) => { setHealth(h); setMetrics(m); })
      .catch(e => setError(e.response?.data?.detail ?? e.message))
      .finally(() => setLoading(false));
  }, []);

  const pct = (n: number | null | undefined) =>
    n == null ? 'N/A' : `${(n * 100).toFixed(2)}%`;

  return (
    <div className="page-container">
      <div>
        <div className="page-title"><Shield size={22} color="var(--cyan)" /> Intrusion Detection System</div>
        <p className="page-subtitle">NSL-KDD · Random Forest feature selection · Deep Neural Network classifier</p>
      </div>

      {/* Status banner */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {health?.trained
          ? <CheckCircle size={18} color="var(--green)" />
          : <XCircle    size={18} color="var(--red)" />}
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>
            {health?.trained ? 'Model Ready — all artifacts loaded' : 'Model not yet trained'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {health?.trained
              ? 'DNN + RF models, scaler, encoders, and metrics are present.'
              : 'Run: cd backend  then  py -3.11 -m app.ml.train'}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="pulse-dot" style={{ background: error ? 'var(--red)' : 'var(--green)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>API {error ? 'Offline' : 'Online'}</span>
        </div>
      </div>

      {error && (
        <div className="card" style={{ border: '1px solid var(--red)', color: 'var(--red)', fontSize: 13 }}>
          ⚠️ Cannot reach backend: {error}. Make sure uvicorn is running on port 8000.
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid-4">
        <StatCard title="Test Accuracy"   value={pct(metrics?.accuracy)}         subtitle="On KDDTest+ (held-out)"  icon={<Activity size={18}/>}      color="var(--cyan)"   loading={loading} />
        <StatCard title="Macro F1-Score"  value={pct(metrics?.macro_f1)}         subtitle="Across all 5 classes"    icon={<Cpu size={18}/>}           color="var(--green)"  loading={loading} />
        <StatCard title="ROC-AUC (OvR)"   value={pct(metrics?.roc_auc_ovr_macro)} subtitle="One-vs-Rest macro avg" icon={<Activity size={18}/>}      color="var(--purple)" loading={loading} />
        <StatCard title="Macro FPR"       value={pct(metrics?.macro_fpr)}        subtitle="False positive rate"     icon={<AlertTriangle size={18}/>} color="var(--yellow)" loading={loading} />
      </div>

      {/* Per-class table */}
      {metrics && (
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 14 }}>Per-Class Performance — KDDTest+</div>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>Class</th><th>Precision</th><th>Recall</th><th>F1</th><th>FPR</th><th>Samples</th></tr></thead>
              <tbody>
                {metrics.class_names.map(cls => {
                  const pc = metrics.per_class[cls];
                  return (
                    <tr key={cls}>
                      <td><span style={{ fontWeight: 600, color: CLASS_COLORS[cls] }}>{cls}</span></td>
                      <td>{(pc.precision * 100).toFixed(1)}%</td>
                      <td>{(pc.recall * 100).toFixed(1)}%</td>
                      <td>{(pc.f1_score * 100).toFixed(1)}%</td>
                      <td>{(pc.fpr * 100).toFixed(2)}%</td>
                      <td>{pc.support.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-dim)' }}>
            ℹ️ All metrics from KDDTest+.txt evaluation — no simulated numbers. Lower recall for U2R/R2L is expected (class imbalance in NSL-KDD).
          </div>
        </div>
      )}

      {/* Architecture cards */}
      <div className="grid-2">
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 12, color: 'var(--cyan)', fontSize: 13 }}>🌲 Stage 1 — Random Forest</div>
          <ul style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 2, listStyle: 'none' }}>
            <li>• 150 decision trees, class_weight=balanced</li>
            <li>• Trained on all 41 NSL-KDD features</li>
            <li>• Extracts feature_importances_ scores</li>
            <li>• Selects features with importance ≥ 0.01</li>
          </ul>
        </div>
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 12, color: 'var(--green)', fontSize: 13 }}>🧠 Stage 2 — Deep Neural Network</div>
          <ul style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 2, listStyle: 'none' }}>
            <li>• Input: RF-selected features</li>
            <li>• Layers: 256 → 128 → 64 → 32 → 5</li>
            <li>• BatchNorm + Dropout(0.3, 0.2)</li>
            <li>• Softmax output: 5 attack classes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Overview;
