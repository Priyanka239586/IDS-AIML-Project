import React, { useEffect, useState } from 'react';
import { Database } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { getDatasetInfo } from '../api/client';

const CLASS_COLORS: Record<string,string> = {
  Normal:'#06b6d4', DoS:'#ef4444', Probe:'#eab308', R2L:'#a855f7', U2R:'#f97316',
};

const ALL_41 = [
  'duration','protocol_type','service','flag','src_bytes','dst_bytes',
  'land','wrong_fragment','urgent','hot','num_failed_logins','logged_in',
  'num_compromised','root_shell','su_attempted','num_root','num_file_creations',
  'num_shells','num_access_files','num_outbound_cmds','is_host_login',
  'is_guest_login','count','srv_count','serror_rate','srv_serror_rate',
  'rerror_rate','srv_rerror_rate','same_srv_rate','diff_srv_rate',
  'srv_diff_host_rate','dst_host_count','dst_host_srv_count',
  'dst_host_same_srv_rate','dst_host_diff_srv_rate','dst_host_same_src_port_rate',
  'dst_host_srv_diff_host_rate','dst_host_serror_rate','dst_host_srv_serror_rate',
  'dst_host_rerror_rate','dst_host_srv_rerror_rate',
];
const CATEGORICAL = new Set(['protocol_type','service','flag']);

const DatasetModelInfo: React.FC = () => {
  const [info, setInfo]     = useState<any>(null);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState<string|null>(null);

  useEffect(()=>{
    getDatasetInfo().then(setInfo).catch(e=>setError(e.response?.data?.detail??e.message)).finally(()=>setLoad(false));
  },[]);

  const pieData = info?.test_class_distribution
    ? Object.entries(info.test_class_distribution).map(([name,value])=>({name,value:Number(value)}))
    : null;

  return (
    <div className="page-container">
      <div>
        <div className="page-title"><Database size={22} color="var(--cyan)"/> Dataset &amp; Model Info</div>
        <p className="page-subtitle">NSL-KDD dataset details, DNN architecture, and RF configuration</p>
      </div>

      {error && <div className="card" style={{border:'1px solid var(--red)',color:'var(--red)'}}>⚠️ {error}</div>}
      {loading && <div style={{display:'flex',gap:10}}><div className="spinner"/> Loading…</div>}

      {info && (
        <>
          {/* Dataset overview */}
          <div className="card">
            <div style={{fontWeight:600,fontSize:14,marginBottom:16,color:'var(--cyan)'}}>📊 NSL-KDD Dataset</div>
            <div className="grid-3" style={{marginBottom:16}}>
              {[['41','Input Features'],['5','Attack Classes'],[String(info.num_selected_features??'?'),'RF-Selected']].map(([v,l])=>(
                <div key={l} style={{textAlign:'center',padding:'12px 0'}}>
                  <div style={{fontSize:28,fontWeight:700,color:'var(--cyan)'}}>{v}</div>
                  <div style={{fontSize:12,color:'var(--text-muted)'}}>{l}</div>
                </div>
              ))}
            </div>
            <p style={{fontSize:13,color:'var(--text-muted)',lineHeight:1.8}}>{info.dataset.description}</p>
            <div style={{marginTop:10,fontSize:12,color:'var(--text-dim)'}}>
              Source: <a href={info.dataset.source_url} target="_blank" rel="noreferrer" style={{color:'var(--cyan)'}}>
                {info.dataset.source_url}
              </a>
            </div>
          </div>

          <div className="grid-2">
            {pieData && (
              <div className="card">
                <div style={{fontWeight:600,marginBottom:16,fontSize:14}}>Test Set Class Distribution</div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                      label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                      {pieData.map(e=><Cell key={e.name} fill={CLASS_COLORS[e.name]??'#888'}/>)}
                    </Pie>
                    <Tooltip contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="card">
              <div style={{fontWeight:600,marginBottom:12,fontSize:14}}>Attack Class Descriptions</div>
              {Object.entries(info.dataset.class_descriptions??{}).map(([cls,desc])=>(
                <div key={cls} style={{marginBottom:12,paddingBottom:12,borderBottom:'1px solid var(--border)'}}>
                  <div style={{fontWeight:600,color:CLASS_COLORS[cls]??'var(--text-primary)',marginBottom:3,fontSize:13}}>{cls}</div>
                  <div style={{fontSize:12,color:'var(--text-muted)',lineHeight:1.6}}>{desc as string}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 41 Features */}
          <div className="card">
            <div style={{fontWeight:600,marginBottom:4,fontSize:14}}>All 41 NSL-KDD Features</div>
            <div style={{fontSize:12,color:'var(--text-dim)',marginBottom:14}}>
              Cyan = RF-selected for DNN · Gray = not selected · <em>italic CAT</em> = categorical (OrdinalEncoder)
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {ALL_41.map((feat,i)=>{
                const sel = info.selected_features?.includes(feat);
                const cat = CATEGORICAL.has(feat);
                return (
                  <span key={feat} style={{
                    padding:'4px 10px', borderRadius:6, fontSize:11, fontFamily:'monospace',
                    background: sel?'rgba(6,182,212,0.12)':'rgba(30,45,69,0.5)',
                    color: sel?'var(--cyan)':'var(--text-dim)',
                    border:`1px solid ${sel?'rgba(6,182,212,0.3)':'var(--border)'}`,
                    fontStyle: cat?'italic':'normal',
                  }}>
                    {i+1}. {feat}{cat&&<sup style={{fontSize:8,marginLeft:2}}>CAT</sup>}
                  </span>
                );
              })}
            </div>
          </div>

          {/* DNN Architecture */}
          <div className="card">
            <div style={{fontWeight:600,marginBottom:16,fontSize:14,color:'var(--green)'}}>🧠 DNN Architecture</div>
            <div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'flex-start'}}>
              {info.dnn_architecture.layers.map((layer:any,i:number)=>{
                const isFirst = i===0;
                const isLast  = i===info.dnn_architecture.layers.length-1;
                return (
                  <React.Fragment key={i}>
                    <div style={{
                      padding:'8px 18px', borderRadius:6, fontSize:12, color:'var(--text-primary)',
                      background: isLast?'rgba(34,197,94,0.15)':isFirst?'rgba(6,182,212,0.15)':'rgba(30,45,69,0.7)',
                      border:`1px solid ${isFirst?'rgba(6,182,212,0.3)':isLast?'rgba(34,197,94,0.3)':'var(--border)'}`,
                      minWidth:260, maxWidth:480,
                    }}>
                      <strong>{layer.name}</strong>
                      <span style={{color:'var(--text-muted)',marginLeft:8}}>({layer.units} units</span>
                      {layer.activation&&layer.activation!=='-'&&
                        <span style={{color:'var(--cyan)',marginLeft:4}}>, {layer.activation}</span>}
                      <span style={{color:'var(--text-muted)'}}>)</span>
                      {layer.extra&&<span style={{color:'var(--text-dim)',fontSize:11,marginLeft:8}}>— {layer.extra}</span>}
                    </div>
                    {!isLast&&<div style={{color:'var(--text-dim)',fontSize:16,marginLeft:12}}>↓</div>}
                  </React.Fragment>
                );
              })}
            </div>
            <div style={{marginTop:14,fontSize:12,color:'var(--text-muted)',lineHeight:2}}>
              <strong>Loss:</strong> {info.dnn_architecture.loss} &nbsp;|&nbsp;
              <strong>Optimizer:</strong> {info.dnn_architecture.optimizer} &nbsp;|&nbsp;
              <strong>Batch:</strong> {info.dnn_architecture.batch_size} &nbsp;|&nbsp;
              <strong>Max Epochs:</strong> {info.dnn_architecture.max_epochs}
            </div>
          </div>

          {/* Limitations */}
          <div className="card" style={{border:'1px solid rgba(234,179,8,0.3)',background:'rgba(234,179,8,0.04)'}}>
            <div style={{fontWeight:600,marginBottom:10,color:'var(--yellow)',fontSize:13}}>⚠️ Known Limitations of NSL-KDD</div>
            <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:6}}>
              {info.dataset.known_limitations?.map((l:string,i:number)=>(
                <li key={i} style={{fontSize:13,color:'var(--text-muted)',display:'flex',gap:8}}>
                  <span style={{color:'var(--yellow)'}}>•</span>{l}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default DatasetModelInfo;
