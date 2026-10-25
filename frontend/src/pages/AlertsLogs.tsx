import React, { useEffect, useState } from 'react';
import { Bell, RefreshCw, Info } from 'lucide-react';
import { getAlerts } from '../api/client';
import type { AlertItem } from '../types';
import { AttackBadge, SeverityBadge } from '../components/AlertBadge';

const AlertsLogs: React.FC = () => {
  const [alerts, setAlerts]     = useState<AlertItem[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string|null>(null);
  const [attackF, setAttackF]   = useState('All');
  const [sevF, setSevF]         = useState('All');

  const fetch = async () => {
    setLoading(true);
    try {
      const data = await getAlerts({
        limit: 40,
        attack_type: attackF !== 'All' ? attackF : undefined,
        severity:    sevF    !== 'All' ? sevF    : undefined,
      });
      setAlerts(data.alerts);
      setTotal(data.total);
    } catch (e: any) {
      setError(e.response?.data?.detail ?? e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [attackF, sevF]);

  return (
    <div className="page-container">
      <div>
        <div className="page-title"><Bell size={22} color="var(--cyan)"/> Alerts &amp; Logs</div>
        <p className="page-subtitle">Simulated alert feed — all records have is_simulated=true.</p>
      </div>

      <div className="card" style={{border:'1px solid rgba(234,179,8,0.4)',background:'rgba(234,179,8,0.05)',display:'flex',gap:10}}>
        <Info size={16} color="var(--yellow)" style={{flexShrink:0,marginTop:1}}/>
        <span style={{fontSize:13,color:'var(--text-muted)'}}>
          <strong style={{color:'var(--yellow)'}}>Simulated Data:</strong> Generated with a fixed random seed for demo consistency. In production, this would show real DNN classifications on live network traffic.
        </span>
      </div>

      <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
        <select value={attackF} onChange={e=>setAttackF(e.target.value)} style={{width:'auto',minWidth:150}}>
          {['All','Normal','DoS','Probe','R2L','U2R'].map(t=><option key={t}>{t}</option>)}
        </select>
        <select value={sevF} onChange={e=>setSevF(e.target.value)} style={{width:'auto',minWidth:150}}>
          {['All','critical','high','medium','low'].map(s=><option key={s}>{s}</option>)}
        </select>
        <button className="btn btn-outline" onClick={fetch} style={{padding:'7px 14px'}}>
          <RefreshCw size={13}/> Refresh
        </button>
        <span style={{fontSize:12,color:'var(--text-dim)',marginLeft:'auto'}}>{total} alerts</span>
      </div>

      {error && <div className="card" style={{border:'1px solid var(--red)',color:'var(--red)'}}>⚠️ {error}</div>}

      {loading
        ? <div style={{display:'flex',gap:10,alignItems:'center'}}><div className="spinner"/> Loading…</div>
        : (
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div style={{overflowX:'auto'}}>
            <table>
              <thead><tr>
                <th>ID</th><th>Timestamp</th><th>Type</th><th>Severity</th>
                <th>Source IP</th><th>Dest IP</th><th>Confidence</th><th>Message</th>
              </tr></thead>
              <tbody>
                {alerts.map(a=>(
                  <tr key={a.id}>
                    <td style={{fontFamily:'monospace',fontSize:11,color:'var(--text-dim)'}}>{a.id}</td>
                    <td style={{fontFamily:'monospace',fontSize:11,whiteSpace:'nowrap',color:'var(--text-dim)'}}>
                      {new Date(a.timestamp).toLocaleString()}
                    </td>
                    <td><AttackBadge type={a.attack_type}/></td>
                    <td><SeverityBadge severity={a.severity}/></td>
                    <td style={{fontFamily:'monospace',fontSize:12}}>{a.source_ip}</td>
                    <td style={{fontFamily:'monospace',fontSize:12}}>{a.dest_ip}</td>
                    <td style={{fontSize:12,color:a.confidence>0.9?'var(--green)':'var(--text-muted)'}}>
                      {(a.confidence*100).toFixed(1)}%
                    </td>
                    <td style={{fontSize:12,color:'var(--text-muted)',maxWidth:280}}>{a.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
    </div>
  );
};

export default AlertsLogs;
