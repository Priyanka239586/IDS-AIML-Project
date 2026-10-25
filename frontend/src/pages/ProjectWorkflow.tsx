import React from 'react';
import { GitBranch } from 'lucide-react';

const STEPS = [
  {
    n:'01', title:'NSL-KDD Dataset', sub:'KDDTrain+.txt + KDDTest+.txt', color:'#06b6d4',
    items:['125,973 training + 22,544 test samples','41 network traffic features per connection',
      '5 attack categories: Normal, DoS, Probe, R2L, U2R','No duplicate records (improved over KDD\'99)',
      'Source: University of New Brunswick (unb.ca)'],
  },
  {
    n:'02', title:'Preprocessing', sub:'Encoding → Scaling → Label Mapping', color:'#22c55e',
    items:['OrdinalEncoder → protocol_type, service, flag (3 categorical features)',
      'StandardScaler → all 41 features (fitted ONLY on train set)',
      'LabelEncoder → 5-class target labels (alphabetical order)',
      'Attack names → categories (e.g., neptune → DoS)',
      'No data leakage: scaler fitted on train, applied to test'],
  },
  {
    n:'03', title:'Random Forest', sub:'Feature Importance & Selection', color:'#eab308',
    items:['150 decision trees, class_weight="balanced"',
      'Trained on all 41 preprocessed + scaled features',
      'feature_importances_ extracted from trained RF',
      'Features with importance ≥ 0.01 are selected for DNN',
      'Artifacts: rf_model.pkl, feature_importance.json, selected_features.json'],
  },
  {
    n:'04', title:'Deep Neural Network', sub:'Keras DNN on RF-Selected Features', color:'#a855f7',
    items:['Input: RF-selected features only (reduces dimensionality)',
      'Dense(256, relu) → BatchNorm → Dropout(0.3)',
      'Dense(128, relu) → BatchNorm → Dropout(0.3)',
      'Dense(64, relu) → Dropout(0.2) → Dense(32, relu)',
      'Dense(5, softmax) — one probability per attack class',
      'EarlyStopping(patience=5) + ReduceLROnPlateau'],
  },
  {
    n:'05', title:'Evaluation', sub:'Tested on KDDTest+ (held-out set)', color:'#ef4444',
    items:['Accuracy — overall correct predictions on test set',
      'Precision, Recall, F1 — per class + macro average',
      'False Positive Rate — FP/(FP+TN) per class',
      'ROC-AUC — One-vs-Rest macro average',
      '5×5 Confusion Matrix',
      'All real metrics saved to metrics.json'],
  },
  {
    n:'06', title:'FastAPI Backend', sub:'REST API serving trained models', color:'#f97316',
    items:['POST /predict — real DNN inference',
      'GET /metrics — all evaluation metrics',
      'GET /feature-importance — RF importance scores for all 41 features',
      'GET /alerts — simulated alert log (is_simulated=true)',
      'GET /dataset-info — NSL-KDD metadata + architecture',
      'Running on http://localhost:8000 | Docs at /docs'],
  },
  {
    n:'07', title:'React Dashboard', sub:'Vite + TypeScript + Recharts', color:'#06b6d4',
    items:['Overview — KPI cards + per-class metrics table',
      'Traffic Monitor — simulated live feed (clearly labeled)',
      'Threat Detection — real DNN prediction via /predict API',
      'Model Performance — bar charts + heatmap confusion matrix',
      'Feature Importance — all 41 RF scores + DNN selection',
      'Alerts & Logs — simulated alert feed with filtering',
      'Dataset & Model Info + Project Workflow pages'],
  },
];

const ProjectWorkflow: React.FC = () => (
  <div className="page-container">
    <div>
      <div className="page-title"><GitBranch size={22} color="var(--cyan)"/> Project Workflow</div>
      <p className="page-subtitle">
        End-to-end pipeline: NSL-KDD → Preprocessing → Random Forest → DNN → FastAPI → React Dashboard
      </p>
    </div>

    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {STEPS.map((s,i)=>(
        <div key={s.n} style={{display:'flex',gap:16,alignItems:'flex-start'}}>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',flexShrink:0}}>
            <div style={{width:44,height:44,borderRadius:'50%',
              background:`${s.color}22`,border:`2px solid ${s.color}`,
              display:'flex',alignItems:'center',justifyContent:'center',
              fontWeight:800,fontSize:13,color:s.color}}>{s.n}</div>
            {i<STEPS.length-1&&<div style={{width:2,height:20,background:'var(--border)',margin:'4px 0'}}/>}
          </div>
          <div className="card" style={{flex:1,borderLeft:`3px solid ${s.color}`,marginBottom:0}}>
            <div style={{fontWeight:700,fontSize:15,color:s.color,marginBottom:2}}>{s.title}</div>
            <div style={{fontSize:12,color:'var(--text-dim)',marginBottom:10}}>{s.sub}</div>
            <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:4}}>
              {s.items.map((item,j)=>(
                <li key={j} style={{fontSize:13,color:'var(--text-muted)',display:'flex',gap:8}}>
                  <span style={{color:s.color,marginTop:1}}>›</span>{item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>

    <div className="card">
      <div style={{fontWeight:600,marginBottom:16,fontSize:14}}>🛠️ Technology Stack</div>
      <div className="grid-3">
        {[
          {label:'ML & Data', color:'var(--green)', items:['Python 3.11','TensorFlow 2.16 / Keras','scikit-learn 1.4.2','pandas 2.2, numpy 1.26, joblib']},
          {label:'Backend API', color:'var(--yellow)', items:['FastAPI 0.111','Uvicorn (ASGI server)','Pydantic v2','python-dotenv']},
          {label:'Frontend', color:'var(--cyan)', items:['React 18 + Vite 5','TypeScript 5','Recharts 2','react-router-dom 6, lucide-react']},
        ].map(col=>(
          <div key={col.label}>
            <div style={{fontWeight:600,color:col.color,marginBottom:10,fontSize:13}}>{col.label}</div>
            <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:6}}>
              {col.items.map(item=>(
                <li key={item} style={{fontSize:13,color:'var(--text-muted)',display:'flex',gap:6}}>
                  <span style={{color:col.color}}>•</span>{item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default ProjectWorkflow;
