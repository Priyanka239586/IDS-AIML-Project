import React, { useEffect, useState } from 'react';
import { Search, Zap, Info } from 'lucide-react';
import { getFeatureImportance, predict } from '../api/client';
import type { PredictResponse } from '../types';

const CLASS_COLORS: Record<string, string> = {
  Normal: 'var(--cyan)', DoS: 'var(--red)',
  Probe: 'var(--yellow)', R2L: 'var(--purple)', U2R: 'var(--orange)',
};

// Pre-filled sample vectors (approximate NSL-KDD patterns)
const SAMPLES: Record<string, Record<string, number>> = {
  DoS: {
    duration:0, src_bytes:0, dst_bytes:0, land:0, wrong_fragment:0, urgent:0,
    hot:0, num_failed_logins:0, logged_in:0, num_compromised:0,
    count:511, srv_count:511, serror_rate:1.0, srv_serror_rate:1.0,
    rerror_rate:0.0, same_srv_rate:1.0, diff_srv_rate:0.0,
    dst_host_count:255, dst_host_srv_count:255, dst_host_serror_rate:1.0,
  },
  Probe: {
    duration:0, src_bytes:0, dst_bytes:0, land:0, wrong_fragment:0, urgent:0,
    hot:0, num_failed_logins:0, logged_in:0, num_compromised:0,
    count:1, srv_count:1, serror_rate:0.0, srv_serror_rate:0.0,
    rerror_rate:0.0, same_srv_rate:0.06, diff_srv_rate:0.07,
    dst_host_count:20, dst_host_srv_count:20, dst_host_serror_rate:0.0,
  },
  Normal: {
    duration:2, src_bytes:5000, dst_bytes:2000, land:0, wrong_fragment:0, urgent:0,
    hot:0, num_failed_logins:0, logged_in:1, num_compromised:0,
    count:2, srv_count:2, serror_rate:0.0, srv_serror_rate:0.0,
    rerror_rate:0.0, same_srv_rate:1.0, diff_srv_rate:0.0,
    dst_host_count:150, dst_host_srv_count:25, dst_host_serror_rate:0.0,
  },
};

const ThreatDetection: React.FC = () => {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [values, setValues]   = useState<Record<string, number>>({});
  const [result, setResult]   = useState<PredictResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    getFeatureImportance()
      .then(data => {
        setSelectedFeatures(data.selected_features);
        const d: Record<string,number> = {};
        data.selected_features.forEach(f => { d[f] = 0; });
        setValues(d);
      })
      .catch(e => setError(e.response?.data?.detail ?? e.message))
      .finally(() => setFetching(false));
  }, []);

  const loadSample = (type: string) => {
    const s = SAMPLES[type] ?? {};
    setValues(prev => {
      const u = {...prev};
      selectedFeatures.forEach(f => { u[f] = s[f] ?? 0; });
      return u;
    });
    setResult(null);
  };

  const runPredict = async () => {
    setLoading(true); setError(null);
    try {
      const res = await predict({ raw_features: { ...values } });
      setResult(res);
    } catch (e: any) {
      setError(e.response?.data?.detail ?? e.message ?? 'Prediction failed');
    } finally { setLoading(false); }
  };

  if (fetching) return (
    <div className="page-container">
      <div style={{display:'flex',alignItems:'center',gap:10}}><div className="spinner"/> Loading features…</div>
    </div>
  );

  return (
    <div className="page-container">
      <div>
        <div className="page-title"><Search size={22} color="var(--cyan)"/> Threat Detection</div>
        <p className="page-subtitle">Enter feature values → real DNN prediction via /predict API</p>
      </div>

      <div className="card" style={{border:'1px solid rgba(6,182,212,0.3)',background:'rgba(6,182,212,0.05)',display:'flex',gap:10}}>
        <Info size={16} color="var(--cyan)" style={{flexShrink:0,marginTop:1}}/>
        <span style={{fontSize:13,color:'var(--text-muted)'}}>
          <strong style={{color:'var(--cyan)'}}>Real Prediction:</strong> This form sends values to the trained Keras DNN via <code style={{background:'rgba(0,0,0,0.3)',padding:'1px 5px',borderRadius:3}}>/predict</code>. Use the sample buttons to pre-fill known attack patterns.
        </span>
      </div>

      <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <span style={{fontSize:12,color:'var(--text-muted)'}}>Load sample:</span>
        {['Normal','DoS','Probe'].map(t=>(
          <button key={t} className="btn btn-outline" style={{padding:'5px 14px',fontSize:12}} onClick={()=>loadSample(t)}>{t}</button>
        ))}
        <button className="btn btn-outline" style={{padding:'5px 14px',fontSize:12,marginLeft:'auto'}}
          onClick={()=>{setValues({});setResult(null);}}>Clear</button>
      </div>

      {error && (
        <div className="card" style={{border:'1px solid var(--red)',color:'var(--red)',fontSize:13}}>⚠️ {error}</div>
      )}

      <div style={{display:'grid',gridTemplateColumns:result?'1fr 300px':'1fr',gap:20,alignItems:'start'}}>
        <div className="card">
          <div style={{fontWeight:600,marginBottom:16,fontSize:13}}>
            Selected Features ({selectedFeatures.length} inputs — RF-chosen for DNN)
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))',gap:12}}>
            {selectedFeatures.map(feat=>(
              <div key={feat}>
                <label style={{fontSize:11,color:'var(--text-muted)',display:'block',marginBottom:4}}>{feat}</label>
                <input type="number" step="any" value={values[feat]??0}
                  onChange={e=>setValues(p=>({...p,[feat]:parseFloat(e.target.value)||0}))}/>
              </div>
            ))}
          </div>
          <div style={{marginTop:20}}>
            <button className="btn btn-primary" onClick={runPredict}
              disabled={loading||selectedFeatures.length===0}>
              {loading
                ? <><div className="spinner" style={{width:14,height:14}}/> Predicting…</>
                : <><Zap size={14}/> Run Prediction</>}
            </button>
          </div>
        </div>

        {result && (
          <div className="card" style={{minWidth:260}}>
            <div style={{fontWeight:600,marginBottom:16,fontSize:13,color:'var(--cyan)'}}>⚡ Result</div>
            <div style={{textAlign:'center',marginBottom:16}}>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:6}}>Predicted Class</div>
              <div style={{fontSize:36,fontWeight:800,color:CLASS_COLORS[result.predicted_class]??'var(--cyan)'}}>
                {result.predicted_class}
              </div>
              <div style={{fontSize:22,fontWeight:600,marginTop:4}}>{(result.confidence*100).toFixed(1)}%</div>
              <div style={{fontSize:11,color:'var(--text-dim)'}}>confidence</div>
            </div>
            <div style={{borderTop:'1px solid var(--border)',paddingTop:14}}>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:10,fontWeight:600}}>CLASS PROBABILITIES</div>
              {Object.entries(result.probabilities).sort(([,a],[,b])=>b-a).map(([cls,prob])=>(
                <div key={cls} style={{marginBottom:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                    <span style={{fontSize:12,color:cls===result.predicted_class?CLASS_COLORS[cls]:'var(--text-muted)',
                      fontWeight:cls===result.predicted_class?600:400}}>{cls}</span>
                    <span style={{fontSize:11,color:'var(--text-dim)'}}>{(prob*100).toFixed(1)}%</span>
                  </div>
                  <div style={{height:4,background:'var(--border)',borderRadius:2}}>
                    <div style={{width:`${prob*100}%`,height:'100%',
                      background:CLASS_COLORS[cls]??'var(--cyan)',borderRadius:2,transition:'width 0.4s'}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreatDetection;
