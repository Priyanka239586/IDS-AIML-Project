import React, { useEffect, useState } from 'react';
import { BarChart2, Info } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { getMetrics, getConfusionMatrix } from '../api/client';
import type { Metrics } from '../types';
import StatCard from '../components/StatCard';

const CLASS_COLORS: Record<string,string> = {
  Normal:'#06b6d4', DoS:'#ef4444', Probe:'#eab308', R2L:'#a855f7', U2R:'#f97316',
};

const ModelPerformance: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics|null>(null);
  const [cm, setCm] = useState<{confusion_matrix:number[][];class_names:string[]}|null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  useEffect(()=>{
    Promise.all([getMetrics(), getConfusionMatrix()])
      .then(([m,c])=>{ setMetrics(m); setCm(c); })
      .catch(e=>setError(e.response?.data?.detail??e.message))
      .finally(()=>setLoading(false));
  },[]);

  const fmt = (n:number) => `${(n*100).toFixed(2)}%`;

  const barData = metrics ? metrics.class_names.map(cls=>({
    name: cls,
    Precision: parseFloat((metrics.per_class[cls].precision*100).toFixed(2)),
    Recall:    parseFloat((metrics.per_class[cls].recall*100).toFixed(2)),
    F1:        parseFloat((metrics.per_class[cls].f1_score*100).toFixed(2)),
  })) : [];

  if (error) return (
    <div className="page-container">
      <div className="card" style={{border:'1px solid var(--red)',color:'var(--red)'}}>⚠️ {error}</div>
    </div>
  );

  return (
    <div className="page-container">
      <div>
        <div className="page-title"><BarChart2 size={22} color="var(--cyan)"/> Model Performance</div>
        <p className="page-subtitle">Real metrics from KDDTest+ ({metrics?.num_test_samples?.toLocaleString()??'…'} samples) — not simulated.</p>
      </div>

      <div className="grid-4">
        <StatCard title="Accuracy"  value={metrics?fmt(metrics.accuracy):'…'}          loading={loading} color="var(--cyan)"/>
        <StatCard title="Macro F1"  value={metrics?fmt(metrics.macro_f1):'…'}          loading={loading} color="var(--green)"/>
        <StatCard title="ROC-AUC"   value={metrics?.roc_auc_ovr_macro?fmt(metrics.roc_auc_ovr_macro):'N/A'} loading={loading} color="var(--purple)"/>
        <StatCard title="Macro FPR" value={metrics?fmt(metrics.macro_fpr):'…'}         loading={loading} color="var(--yellow)"/>
      </div>

      {metrics && (
        <div className="card">
          <div style={{fontWeight:600,marginBottom:16,fontSize:14}}>Per-Class Precision / Recall / F1 (%)</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
              <XAxis dataKey="name" stroke="var(--text-dim)"/>
              <YAxis domain={[0,100]} stroke="var(--text-dim)" unit="%"/>
              <Tooltip contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8}}/>
              <Legend/>
              <Bar dataKey="Precision" fill="#06b6d4" radius={[4,4,0,0]}/>
              <Bar dataKey="Recall"    fill="#22c55e" radius={[4,4,0,0]}/>
              <Bar dataKey="F1"        fill="#a855f7" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {cm && (
        <div className="card">
          <div style={{fontWeight:600,marginBottom:4,fontSize:14}}>Confusion Matrix</div>
          <div style={{fontSize:12,color:'var(--text-dim)',marginBottom:16}}>Rows = actual class, Columns = predicted class</div>
          <div style={{overflowX:'auto'}}>
            <table style={{fontFamily:'monospace'}}>
              <thead>
                <tr>
                  <th style={{textAlign:'center',minWidth:80}}>Actual ↓ / Pred →</th>
                  {cm.class_names.map(c=><th key={c} style={{textAlign:'center',minWidth:80,color:CLASS_COLORS[c]}}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {cm.confusion_matrix.map((row,i)=>{
                  const rowSum = row.reduce((a,b)=>a+b,0);
                  return (
                    <tr key={i}>
                      <td style={{fontWeight:600,color:CLASS_COLORS[cm.class_names[i]]}}>{cm.class_names[i]}</td>
                      {row.map((val,j)=>{
                        const isDiag = i===j;
                        const pct = rowSum>0 ? val/rowSum : 0;
                        return (
                          <td key={j} style={{textAlign:'center',
                            background: isDiag ? `rgba(34,197,94,${0.1+pct*0.5})`
                                               : val>0 ? `rgba(239,68,68,${Math.min(0.5,pct*2)})` : 'transparent',
                            color: isDiag ? 'var(--green)' : val>0 ? '#fca5a5' : 'var(--text-dim)',
                            fontWeight: isDiag?700:400}}>
                            {val.toLocaleString()}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{marginTop:10,fontSize:11,color:'var(--text-dim)'}}>
            🟢 Green diagonal = correct predictions | 🔴 Red off-diagonal = misclassifications
          </div>
        </div>
      )}

      {metrics && (
        <div className="card">
          <div style={{fontWeight:600,marginBottom:16,fontSize:14}}>Detailed Per-Class Metrics</div>
          <table>
            <thead><tr><th>Class</th><th>Precision</th><th>Recall</th><th>F1</th><th>FPR</th><th>Support</th></tr></thead>
            <tbody>
              {metrics.class_names.map(cls=>{
                const pc = metrics.per_class[cls];
                return (
                  <tr key={cls}>
                    <td><span style={{fontWeight:700,color:CLASS_COLORS[cls]}}>{cls}</span></td>
                    <td>{fmt(pc.precision)}</td><td>{fmt(pc.recall)}</td>
                    <td>{fmt(pc.f1_score)}</td><td>{fmt(pc.fpr)}</td>
                    <td>{pc.support.toLocaleString()}</td>
                  </tr>
                );
              })}
              <tr style={{borderTop:'2px solid var(--border)'}}>
                <td><span style={{fontWeight:600,color:'var(--text-muted)'}}>Macro avg</span></td>
                <td>{fmt(metrics.macro_precision)}</td><td>{fmt(metrics.macro_recall)}</td>
                <td>{fmt(metrics.macro_f1)}</td><td>{fmt(metrics.macro_fpr)}</td>
                <td>{metrics.num_test_samples.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          <div style={{marginTop:10,fontSize:11,color:'var(--text-dim)',display:'flex',gap:6}}>
            <Info size={12} style={{marginTop:1,flexShrink:0}}/>
            Lower recall for U2R/R2L is expected — NSL-KDD has very few samples for these classes (documented limitation).
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelPerformance;
