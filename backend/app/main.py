"""FastAPI Application Entry Point — IDS-AIML Backend."""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routers import predict, metrics, features, alerts, dataset_info

load_dotenv()

app = FastAPI(
    title="IDS-AIML API",
    description=(
        "Intrusion Detection System backend. "
        "Random Forest feature selection + Keras DNN classifier on NSL-KDD dataset."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[_origin, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router)
app.include_router(metrics.router)
app.include_router(features.router)
app.include_router(alerts.router)
app.include_router(dataset_info.router)


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "service": "IDS-AIML API", "version": "1.0.0", "docs": "/docs"}


@app.get("/health", tags=["Health"])
async def health():
    """Returns which trained model artifacts are present on disk."""
    models_dir = os.path.normpath(os.path.join(os.path.dirname(__file__), 'models'))
    required = [
        'dnn_model.keras', 'rf_model.pkl', 'scaler.pkl',
        'label_encoder.pkl', 'feature_encoder.pkl',
        'metrics.json', 'selected_features.json', 'feature_importance.json',
    ]
    status = {f: os.path.exists(os.path.join(models_dir, f)) for f in required}
    return {"trained": all(status.values()), "artifacts": status, "models_dir": models_dir}
