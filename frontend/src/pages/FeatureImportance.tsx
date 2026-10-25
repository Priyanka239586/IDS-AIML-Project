import React, { useEffect, useState } from 'react';
import { Layers } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { getFeatureImportance } from '../api/client';
import type { FeatureItem } from '../types';

const FeatureImportance: React.FC = () => {
  const [features, setFeatures]       = useState<FeatureItem[]>([]);
  const [selectedCount, setSelCount]  = useState(0);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string|null>(null);
  const [showAll, setShowAll]         = useState(false);

  useEffect(()=>{
    getFeatureImportance()
      .then(d=>{ setFeatures(d.features); setSelCount(d.selected_count); })
      .catch(e=>setError(e.response?.data?.detail??e.message))
      .finally(()=>setLoading(false));
  },[]);

  const displayed = showAll ? features : features.slice(0,20);

  return (
    <div className="page-container">
      <div>
        <div className="page-title"><Layers size={22} color="var(--cyan)"/> Feature Importance</div>
        <p className="page-subtitle">
          Random Forest importance scores for all 41 NSL-KDD features. Cyan = selected as DNN input.
        </p>
      </div>

      {error && <div className="card" style={{border:'1px solid var(--red)',color:'var(--red)'}}>⚠️ {error}</div>}
      {loading && <div style={{display:'flex',gap:10,alignItems:'center'}}><div className="spinner"/> Loading…</div>}

      {!loading && features.length>0 && (
        <>
          <div className="grid-3">
            <div className="card">
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:6}}>TOTAL FEATURES</div>
              <div style={{fontSize:28,fontWeight:700,color:'var(--cyan)'}}>{features.length}</div>
              <div style={{fontSize:12,color:'var(--text-dim)'}}>NSL-KDD input features</div>
            </div>
            <div className="card">
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:6}}>RF SELECTED</div>
              <div style={{fontSize:28,fontWeight:700,color:'var(--green)'}}>{selectedCount}</div>
              <div style={{fontSize:12,color:'var(--text-dim)'}}>importance ≥ 0.01 → DNN input</div>
            </div>
            <div className="card">
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:6}}>TOP FEATURE</div>
              <div style={{fontSize:16,fontWeight:700,color:'var(--yellow)',fontFamily:'monospace'}}>{features[0]?.name}</div>
              <div style={{fontSize:12,color:'var(--text-dim)'}}>score = {features[0]?.importance.toFixed(4)}</div>
            </div>
          </div>

          <div className="card">
            <div style={{fontWeight:600,marginBottom:4,fontSize:14}}>RF Importance Scores (Top {displayed.length})</div>
            <div style={{fontSize:12,color:'var(--text-dim)',marginBottom:16}}>
              Cyan = selected for DNN training · Gray = not selected
            </div>
            <ResponsiveContainer width="100%" height={Math.max(300, displayed.length*26+40)}>
              <BarChart data={[...displayed].reverse()} layout="vertical"
                margin={{top:0,right:60,left:180,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false}/>
                <XAxis type="number" stroke="var(--text-dim)" tickFormatter={v=>v.toFixed(3)} fontSize={11}/>
                <YAxis type="category" dataKey="name" stroke="var(--text-dim)" fontSize={11} width={175}/>
                <Tooltip
                  contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8}}
                  formatter={(val:number,_:string,props:any)=>[
                    val.toFixed(5),
                    props.payload.selected ? '✅ Selected for DNN' : '⬜ Not selected',
                  ]}
                />
                <Bar dataKey="importance" radius={[0,4,4,0]}>
                  {[...displayed].reverse().map((f,i)=>(
                    <Cell key={i} fill={f.selected?'#06b6d4':'#1e2d45'}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <button className="btn btn-outline" style={{marginTop:16,fontSize:12}}
              onClick={()=>setShowAll(p=>!p)}>
              {showAll?'Show Top 20':`Show All ${features.length} Features`}
            </button>
          </div>

          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div style={{padding:'16px 20px',fontWeight:600,fontSize:14}}>All Features — Ranked by Importance</div>
            <div style={{overflowX:'auto'}}>
              <table>
                <thead><tr><th>Rank</th><th>Feature</th><th>Importance</th><th>DNN Input</th></tr></thead>
                <tbody>
                  {features.map(f=>(
                    <tr key={f.name}>
                      <td style={{color:'var(--text-dim)',fontFamily:'monospace'}}>#{f.rank}</td>
                      <td style={{fontFamily:'monospace',fontWeight:f.selected?600:400,
                        color:f.selected?'var(--text-primary)':'var(--text-dim)'}}>{f.name}</td>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{width:80,height:4,background:'var(--border)',borderRadius:2}}>
                            <div style={{width:`${Math.min(100,f.importance*800)}%`,height:'100%',
                              background:f.selected?'var(--cyan)':'var(--text-dim)',borderRadius:2}}/>
                          </div>
                          <span style={{fontFamily:'monospace',fontSize:12}}>{f.importance.toFixed(5)}</span>
                        </div>
                      </td>
                      <td>
                        {f.selected
                          ? <span style={{color:'var(--green)',fontSize:12,fontWeight:600}}>✅ Selected</span>
                          : <span style={{color:'var(--text-dim)',fontSize:12}}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FeatureImportance;
