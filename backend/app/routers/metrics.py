"""
GET /metrics              — Full evaluation metrics from the held-out test split
GET /metrics/confusion-matrix — 5x5 confusion matrix

Evaluation note
---------------
The metrics in metrics.json are computed on a held-out TEST split that is
20 % of KDDTrain+.txt (stratified, random_state=42).  This split is set aside
before any preprocessing fitting, Random Forest training, or DNN training.

KDDTest+.txt (from UNB) uses only generic 'Attack'/'Normal' labels and cannot
be used for 5-class evaluation, so it is not used here.
"""

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


@router.get("/", summary="All evaluation metrics (held-out test split of KDDTrain+)")
async def get_metrics():
    """
    Returns accuracy, precision, recall, F1, FPR, ROC-AUC, and per-class
    breakdowns.  All values are REAL metrics computed on the held-out test
    split (20 % of KDDTrain+, stratified) — not simulated, and not from
    KDDTest+.txt (which lacks per-class labels).
    """
    return _load()


@router.get("/confusion-matrix", summary="5x5 confusion matrix")
async def get_confusion_matrix():
    """Returns the 5x5 confusion matrix and class names from the held-out test split."""
    data = _load()
    return {"confusion_matrix": data["confusion_matrix"], "class_names": data["class_names"]}
