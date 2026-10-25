# 🛡️ AI/ML Intrusion Detection System (IDS)

A full-stack cybersecurity dashboard that detects network intrusions using a
two-stage ML pipeline — **Random Forest** for feature selection followed by a
**Keras Deep Neural Network** classifier — trained on the **NSL-KDD** benchmark.

> **College demo project** | Python · FastAPI · TensorFlow/Keras · React · Vite · TypeScript

---

## 📊 Model Results

All metrics are **real**, computed on a **held-out test split** that was not
used during training or model selection.  See [Data splits](#data-splits) for
details on how the data was divided.

### Overall metrics (25,195-sample test split)

| Metric | Score |
|--------|-------|
| **Accuracy** | **96.00%** |
| **Macro F1** | 68.82% |
| **Macro Recall** | 96.32% |
| **Macro Precision** | 65.24% |
| **ROC-AUC (OvR macro)** | **99.77%** |
| **Macro FPR** | 0.89% |

### Per-class breakdown

| Class | Precision | Recall | F1 | FPR | Support |
|-------|-----------|--------|-----|-----|---------|
| Normal | 99.75% | 93.35% | 96.44% | 0.26% | 13,469 |
| DoS | 99.04% | 99.55% | 99.29% | 0.56% | 9,186 |
| Probe | 92.19% | 97.73% | 94.88% | 0.84% | 2,331 |
| R2L | 32.09% | 90.95% | 47.44% | 1.53% | 199 |
| U2R | 3.11% | 100.00% | 6.02% | 1.24% | 10 |

> **Why is R2L / U2R precision so low?**
> R2L and U2R have very few training samples (199 and 10 in the test split,
> respectively). Using `class_weight='balanced'` causes the model to weight
> rare-class errors heavily, which pushes it to predict R2L/U2R aggressively
> for any ambiguous sample. This maximises recall (it catches almost every
> real R2L/U2R instance) at the cost of many false positives, so precision
> collapses. This is a documented trade-off for extremely imbalanced classes
> and is expected behaviour with NSL-KDD, not a bug.

---

## Data splits

`KDDTest+.txt` (from UNB) contains only generic `Attack`/`Normal` labels, so
it cannot support 5-class evaluation. All splits come from `KDDTrain+.txt`:

| Split | Size | Purpose |
|-------|------|---------|
| **Train** (60 %) | 75,583 rows | Fit OrdinalEncoder, StandardScaler, LabelEncoder, Random Forest, DNN weights |
| **Val** (20 %) | 25,195 rows | EarlyStopping / ReduceLROnPlateau / ModelCheckpoint callbacks only — never used for weight updates |
| **Test** (20 %) | 25,195 rows | Untouched until the single final `evaluate_dnn()` call |

---

## 🧠 ML Pipeline

```
KDDTrain+.txt  (125,973 rows, 41 features, 5 attack classes)
        │
        ▼
Attack-name → category mapping  (e.g. neptune → DoS)
        │
        ▼
Stratified 60 / 20 / 20 split  (random_state=42)
        │
   ┌────┴────────┐
 Train          Val + Test
   │
   ▼
Preprocessing (fit on Train only, transform applied to Val + Test)
  ├── OrdinalEncoder  → protocol_type, service, flag
  ├── StandardScaler  → all 41 features
  └── LabelEncoder    → 5 target classes
        │
        ▼
Random Forest (150 trees, class_weight=balanced)
  └── feature_importances_ → select 27/41 features (score ≥ 0.01)
        │
        ▼
Deep Neural Network (Keras)
  Input(27) → Dense(256, BN, Drop 0.3) → Dense(128, BN, Drop 0.3)
            → Dense(64, Drop 0.2) → Dense(32) → Dense(5, softmax)
  Validation data = Val split (callbacks only)
        │
        ▼
Final evaluation on Test split → metrics.json
        │
        ▼
FastAPI REST backend  →  React + Vite dashboard
```

---

## ✨ Dashboard Pages

| Page | Description |
|------|-------------|
| **Overview** | KPI cards (Accuracy, F1, ROC-AUC, FPR) + per-class table |
| **Traffic Monitor** | Simulated live network feed (clearly labelled) |
| **Threat Detection** | Real-time DNN inference via `/predict` API |
| **Model Performance** | Bar charts + colour-coded 5×5 confusion matrix |
| **Feature Importance** | RF importance bar chart for all 41 NSL-KDD features |
| **Alerts & Logs** | Filterable simulated alert feed with severity badges |
| **Dataset & Model Info** | NSL-KDD metadata, DNN architecture, RF config |
| **Project Workflow** | End-to-end pipeline walkthrough + tech stack |

---

## 🗂️ Project Structure

```
IDS-AIML-Project/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── ml/
│   │   │   ├── preprocess.py      # Encoding, scaling, label mapping
│   │   │   ├── feature_select.py  # Random Forest + feature importance
│   │   │   ├── dnn_model.py       # Keras DNN build / train / evaluate
│   │   │   └── train.py           # Full 60/20/20 training pipeline
│   │   ├── routers/
│   │   │   ├── predict.py         # POST /predict
│   │   │   ├── metrics.py         # GET  /metrics
│   │   │   ├── features.py        # GET  /feature-importance
│   │   │   ├── alerts.py          # GET  /alerts
│   │   │   └── dataset_info.py    # GET  /dataset-info
│   │   ├── models/                # Artifacts saved after training
│   │   │   ├── metrics.json
│   │   │   ├── feature_importance.json
│   │   │   └── selected_features.json
│   │   └── data/                  # Place KDDTrain+.txt here
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/                 # 8 dashboard pages
│   │   ├── components/
│   │   ├── api/client.ts
│   │   ├── types/index.ts
│   │   └── styles/globals.css
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.11** (TensorFlow 2.16 does not support Python 3.13)
- **Node.js 18+** and npm
- NSL-KDD `KDDTrain+.txt` dataset file

### Step 1 — Download the dataset
Download `KDDTrain+.txt` from the
[University of New Brunswick](https://www.unb.ca/cic/datasets/nsl.html) and
place it at `backend/app/data/KDDTrain+.txt`.

> `KDDTest+.txt` is **not required** — the pipeline uses a stratified split
> of `KDDTrain+.txt` for validation and evaluation.

### Step 2 — Backend setup

```bash
cd backend

# Python 3.11 virtual environment (Windows)
py -3.11 -m venv venv
venv\Scripts\activate

pip install -r requirements.txt
copy .env.example .env
```

### Step 3 — Train the model *(run once, ~2–3 minutes)*

```bash
# From the backend/ directory, with the venv active
$env:PYTHONIOENCODING="utf-8"
$env:PYTHONPATH="."
python -m app.ml.train
```

Expected output:
```
Accuracy : 0.9600
Macro F1 : 0.6882
ROC-AUC  : 0.9977
```

### Step 4 — Start the backend

```bash
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Step 5 — Start the frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Dashboard: http://localhost:5173

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Artifact presence check |
| `POST` | `/predict/` | Real DNN inference |
| `GET` | `/metrics/` | All evaluation metrics |
| `GET` | `/metrics/confusion-matrix` | 5×5 confusion matrix |
| `GET` | `/feature-importance/` | RF scores for all 41 features |
| `GET` | `/alerts/` | Simulated alert log |
| `GET` | `/dataset-info/` | Dataset metadata + DNN architecture |

---

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|-------------|
| **ML & Data** | Python 3.11, TensorFlow 2.16/Keras, scikit-learn 1.4.2, pandas 2.2, NumPy 1.26 |
| **Backend** | FastAPI 0.111, Uvicorn, Pydantic v2, python-dotenv |
| **Frontend** | React 18, Vite 5, TypeScript 5, Recharts 2, react-router-dom 6, lucide-react |
| **Dataset** | NSL-KDD — University of New Brunswick |

---

## ⚠️ Known Limitations

- **R2L and U2R precision is very low** (32 % and 3 % respectively). These
  classes have far fewer samples than Normal/DoS/Probe. `class_weight='balanced'`
  causes the model to aggressively predict them to avoid missing true positives,
  resulting in many false positives and therefore low precision. Recall is high
  (91 % / 100 %) because the model rarely misses a real instance.

- **NSL-KDD reflects 1999-era traffic.** Modern attack signatures differ
  significantly; this dataset is used as a standard academic benchmark only.

- **Traffic Monitor and Alerts pages** display simulated data for demo
  purposes, clearly labelled `is_simulated=true`. The **Threat Detection**
  page uses real DNN inference via the `/predict` API.

---

## 📄 License

Academic college project. NSL-KDD dataset provided by the
[Canadian Institute for Cybersecurity, UNB](https://www.unb.ca/cic/datasets/nsl.html).
