"""GET /metrics  and  GET /metrics/confusion-matrix"""

import os
import json
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/metrics", tags=["Metrics"])

_HERE = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.normpath(os.path.join(_HERE, '..', 'models'))


def _load() -> dict:
    path = os.path.join(MODELS_DIR, 'metrics.json')
    if not os.path.exists(path):
        raise HTTPException(
            status_code=503,
            detail="metrics.json not found. Run: cd backend && py -3.11 -m app.ml.train"
        )
    with open(path) as fh:
        return json.load(fh)


@router.get("/", summary="All evaluation metrics from KDDTest+")
async def get_metrics():
    """
    Returns accuracy, precision, recall, F1, FPR, ROC-AUC, and per-class breakdowns.
    These are REAL metrics computed on KDDTest+ — not simulated.
    """
    return _load()


@router.get("/confusion-matrix", summary="5x5 confusion matrix")
async def get_confusion_matrix():
    """Returns the 5×5 confusion matrix and class names."""
    data = _load()
    return {"confusion_matrix": data["confusion_matrix"], "class_names": data["class_names"]}
