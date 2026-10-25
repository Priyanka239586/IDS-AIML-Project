import React, { useEffect, useState } from 'react';
import { Activity, RefreshCw, Info } from 'lucide-react';
import { AttackBadge } from '../components/AlertBadge';

const ATTACK_TYPES = ['Normal','DoS','Probe','R2L','U2R'];
const PROTOCOLS    = ['tcp','udp','icmp'];
const SERVICES     = ['http','ftp','smtp','ssh','telnet','dns','pop3'];
const FLAGS        = ['SF','S0','REJ','RSTO','SH'];
const WEIGHTED     = ['Normal','Normal','Normal','Normal','DoS','DoS','Probe','Probe','R2L','U2R'];

let _ctr = 1000;
const rnd  = (n: number) => Math.floor(Math.random() * n);
const rndIp = () => `${rnd(200)+10}.${rnd(256)}.${rnd(256)}.${rnd(254)+1}`;

interface Row {
  id: string; timestamp: string; src_ip: string; dst_ip: string;
  protocol: string; service: string; flag: string;
  src_bytes: number; predicted: string; confidence: number;
}

const genRow = (): Row => ({
  id: `PKT-${++_ctr}`,
  timestamp: new Date().toISOString(),
  src_ip: rndIp(), dst_ip: rndIp(),
  protocol: PROTOCOLS[rnd(PROTOCOLS.length)],
  service:  SERVICES[rnd(SERVICES.length)],
  flag:     FLAGS[rnd(FLAGS.length)],
  src_bytes: rnd(50000),
  predicted: WEIGHTED[rnd(WEIGHTED.length)],
  confidence: parseFloat((Math.random() * 0.3 + 0.68).toFixed(3)),
});

const TrafficMonitor: React.FC = () => {
  const [rows, setRows]     = useState<Row[]>(() => Array.from({length:20}, genRow));
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setRows(p => [genRow(), ...p.slice(0,49)]), 1500);
    return () => clearInterval(id);
  }, [paused]);

  const visible = filter === 'All' ? rows : rows.filter(r => r.predicted === filter);

  return (
    <div className="page-container">
      <div>
        <div className="page-title"><Activity size={22} color="var(--cyan)"/> Traffic Monitor</div>
        <p className="page-subtitle">Simulated feed — for live demo UI only. Use Threat Detection for real DNN predictions.</p>
      </div>

      <div className="card" style={{border:'1px solid rgba(234,179,8,0.4)',background:'rgba(234,179,8,0.05)',display:'flex',gap:10}}>
        <Info size={16} color="var(--yellow)" style={{flexShrink:0,marginTop:1}}/>
        <span style={{fontSize:13,color:'var(--text-muted)'}}>
          <strong style={{color:'var(--yellow)'}}>Simulated Data:</strong> Connections are randomly generated with weighted attack distribution. In production, this would show real network captures classified by the DNN.
        </span>
      </div>

      <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
        <select value={filter} onChange={e=>setFilter(e.target.value)} style={{width:'auto',minWidth:150}}>
          {['All',...ATTACK_TYPES].map(t=><option key={t}>{t}</option>)}
        </select>
        <button className={`btn ${paused?'btn-primary':'btn-outline'}`} onClick={()=>setPaused(p=>!p)}>
          <RefreshCw size={13}/> {paused?'Resume':'Pause'}
        </button>
        <span style={{fontSize:12,color:'var(--text-dim)'}}>{paused?'⏸ Paused':'🔴 Live (1.5s)'}</span>
        <span style={{fontSize:12,color:'var(--text-dim)',marginLeft:'auto'}}>Showing {visible.length}</span>
      </div>

      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
          <table>
            <thead><tr>
              <th>ID</th><th>Time</th><th>Source IP</th><th>Dest IP</th>
              <th>Proto</th><th>Service</th><th>Flag</th><th>Src Bytes</th>
              <th>Predicted</th><th>Confidence</th>
            </tr></thead>
            <tbody>
              {visible.slice(0,25).map(r=>(
                <tr key={r.id}>
                  <td style={{fontFamily:'monospace',fontSize:11,color:'var(--text-dim)'}}>{r.id}</td>
                  <td style={{fontFamily:'monospace',fontSize:11,whiteSpace:'nowrap',color:'var(--text-dim)'}}>
                    {new Date(r.timestamp).toLocaleTimeString()}
                  </td>
                  <td style={{fontFamily:'monospace',fontSize:12}}>{r.src_ip}</td>
                  <td style={{fontFamily:'monospace',fontSize:12}}>{r.dst_ip}</td>
                  <td style={{color:'var(--cyan)',fontSize:12}}>{r.protocol}</td>
                  <td style={{fontSize:12}}>{r.service}</td>
                  <td style={{fontFamily:'monospace',fontSize:12}}>{r.flag}</td>
                  <td style={{fontFamily:'monospace',fontSize:12}}>{r.src_bytes.toLocaleString()}</td>
                  <td><AttackBadge type={r.predicted}/></td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:48,height:4,background:'var(--border)',borderRadius:2,overflow:'hidden'}}>
                        <div style={{width:`${r.confidence*100}%`,height:'100%',background:'var(--cyan)',borderRadius:2}}/>
                      </div>
                      <span style={{fontSize:11,color:'var(--text-muted)'}}>{(r.confidence*100).toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TrafficMonitor;
