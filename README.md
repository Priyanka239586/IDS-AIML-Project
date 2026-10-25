# 🛡️ AI/ML Intrusion Detection System (IDS)

A full-stack, professional cybersecurity dashboard that detects network intrusions using a two-stage machine learning pipeline — **Random Forest** for feature selection followed by a **Deep Neural Network** classifier — trained on the **NSL-KDD** benchmark dataset.

> **College demo project** | Python · FastAPI · TensorFlow/Keras · React · Vite · TypeScript

---

## 📊 Model Results (real metrics on held-out test set)

| Metric | Score |
|--------|-------|
| **Accuracy** | **96.74%** |
| **Macro F1-Score** | 71.51% |
| **ROC-AUC (OvR)** | **99.81%** |
| **Macro Recall** | 95.75% |
| Test samples | 25,195 (stratified 20% split of KDDTrain+) |

> All metrics are **real** — computed on a held-out test split. No invented or simulated numbers.

---

## ✨ Features

| Dashboard Page | Description |
|---------------|-------------|
| **Overview** | KPI cards (Accuracy, F1, ROC-AUC, FPR) + per-class performance table |
| **Traffic Monitor** | Simulated live network feed (clearly labelled as simulated) |
| **Threat Detection** | Real-time DNN prediction via `/predict` API — enter features and run inference |
| **Model Performance** | Grouped bar charts + colour-coded 5×5 confusion matrix |
| **Feature Importance** | Horizontal RF importance bar chart for all 41 NSL-KDD features |
| **Alerts & Logs** | Filterable simulated alert feed with severity badges |
| **Dataset & Model Info** | NSL-KDD metadata, DNN architecture diagram, attack class descriptions |
| **Project Workflow** | End-to-end pipeline walkthrough with tech stack summary |

---

## 🧠 ML Pipeline

```
NSL-KDD Dataset (KDDTrain+.txt)
        │
        ▼
Preprocessing
  ├── OrdinalEncoder  → protocol_type, service, flag
  ├── StandardScaler  → all 41 features (fit on train only)
  └── LabelEncoder    → 5 attack classes
        │
        ▼
Random Forest (150 trees, class_weight=balanced)
  └── feature_importances_ → select features with score ≥ 0.01
        │  (27 of 41 selected)
        ▼
Deep Neural Network (Keras)
  Input(27) → Dense(256,BN,Drop0.3) → Dense(128,BN,Drop0.3)
            → Dense(64,Drop0.2) → Dense(32) → Dense(5, softmax)
        │
        ▼
FastAPI REST backend  →  React + Vite dashboard
```

**Attack categories:** Normal · DoS · Probe · R2L · U2R

---

## 🗂️ Project Structure

```
IDS-AIML-Project/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── ml/
│   │   │   ├── preprocess.py    # Encoding, scaling, label mapping
│   │   │   ├── feature_select.py# Random Forest + feature importance
│   │   │   ├── dnn_model.py     # Keras DNN build/train/evaluate
│   │   │   └── train.py         # Full training pipeline (run once)
│   │   ├── routers/
│   │   │   ├── predict.py       # POST /predict
│   │   │   ├── metrics.py       # GET  /metrics
│   │   │   ├── features.py      # GET  /feature-importance
│   │   │   ├── alerts.py        # GET  /alerts
│   │   │   └── dataset_info.py  # GET  /dataset-info
│   │   ├── models/              # Saved artifacts (generated after training)
│   │   │   ├── metrics.json
│   │   │   ├── feature_importance.json
│   │   │   └── selected_features.json
│   │   └── data/                # Place NSL-KDD dataset files here
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/               # 8 dashboard pages
│   │   ├── components/          # Sidebar, StatCard, AlertBadge
│   │   ├── api/client.ts        # Axios API layer
│   │   ├── types/index.ts       # TypeScript type definitions
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
- NSL-KDD dataset (see step 1)

### Step 1 — Download the Dataset
Get `KDDTrain+.txt` from the [University of New Brunswick](https://www.unb.ca/cic/datasets/nsl.html).  
Place it in `backend/app/data/KDDTrain+.txt`.

> **Why only KDDTrain+?** The KDDTest+.txt file from UNB uses generic `Attack`/`Normal` labels (not specific attack names), so it cannot support 5-class evaluation. The training script uses a stratified 80/20 split of KDDTrain+ for real multi-class metrics.

### Step 2 — Backend Setup

```bash
cd backend

# Create virtual environment with Python 3.11
py -3.11 -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env
```

### Step 3 — Train the Model *(run once, ~2–3 minutes)*

```bash
# From the backend/ directory
$env:PYTHONIOENCODING="utf-8"
$env:PYTHONPATH="."
python -m app.ml.train
```

Expected output:
```
Accuracy : 0.9674
Macro F1 : 0.7151
ROC-AUC  : 0.9981
```

### Step 4 — Start the Backend Server

```bash
# From the backend/ directory
uvicorn app.main:app --reload --port 8000
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Step 5 — Start the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env

# Start dev server
npm run dev
```

Dashboard: [http://localhost:5173](http://localhost:5173)

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Model artifact status |
| `POST` | `/predict/` | Real DNN inference on raw features |
| `GET` | `/metrics/` | All evaluation metrics from test set |
| `GET` | `/metrics/confusion-matrix` | 5×5 confusion matrix |
| `GET` | `/feature-importance/` | RF importance scores for all 41 features |
| `GET` | `/alerts/` | Simulated alert log |
| `GET` | `/dataset-info/` | Dataset metadata + DNN architecture |

**Example prediction request:**
```bash
curl -X POST http://localhost:8000/predict/ \
  -H "Content-Type: application/json" \
  -d '{"raw_features": {"src_bytes": 0, "logged_in": 0, "count": 511, "serror_rate": 1.0}}'
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|-------------|
| **ML & Data** | Python 3.11, TensorFlow 2.16/Keras, scikit-learn 1.4.2, pandas 2.2, NumPy 1.26, joblib |
| **Backend** | FastAPI 0.111, Uvicorn, Pydantic v2, python-dotenv |
| **Frontend** | React 18, Vite 5, TypeScript 5, Recharts 2, react-router-dom 6, lucide-react, framer-motion |
| **Dataset** | NSL-KDD (University of New Brunswick) |

---

## ⚠️ Known Limitations

- **U2R and R2L** have very few training samples (52 and 995 respectively) — lower recall for these classes is expected and is a documented property of the NSL-KDD dataset.
- NSL-KDD reflects **1999-era network traffic**; patterns of modern attacks differ significantly.
- The Traffic Monitor and Alerts pages display **simulated data** (clearly labelled) for demo purposes. The Threat Detection page uses **real DNN inference**.

---

## 📄 License

This project is submitted as a college academic project. The NSL-KDD dataset is provided by the [Canadian Institute for Cybersecurity, UNB](https://www.unb.ca/cic/datasets/nsl.html).
