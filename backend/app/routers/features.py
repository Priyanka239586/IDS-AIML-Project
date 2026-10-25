"""GET /feature-importance — RF importance scores for all 41 NSL-KDD features."""

import os
import json
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/feature-importance", tags=["Feature Importance"])

_HERE = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.normpath(os.path.join(_HERE, '..', 'models'))


@router.get("/", summary="RF feature importance for all 41 features")
async def get_feature_importance():
    """
    Returns all 41 NSL-KDD features sorted by Random Forest importance (descending).
    Each feature is marked selected=true if it was chosen as DNN input.
    """
    imp_path = os.path.join(MODELS_DIR, 'feature_importance.json')
    sel_path = os.path.join(MODELS_DIR, 'selected_features.json')

    if not os.path.exists(imp_path):
        raise HTTPException(
            status_code=503,
            detail="feature_importance.json not found. Run training first."
        )

    with open(imp_path) as fh:
        importance_dict: dict = json.load(fh)

    selected: list = []
    if os.path.exists(sel_path):
        with open(sel_path) as fh:
            selected = json.load(fh)

    features = [
        {"name": n, "importance": round(s, 6), "selected": n in selected, "rank": 0}
        for n, s in importance_dict.items()
    ]
    features.sort(key=lambda x: x["importance"], reverse=True)
    for i, f in enumerate(features):
        f["rank"] = i + 1

    return {
        "features":          features,
        "total_features":    len(features),
        "selected_count":    len(selected),
        "selected_features": selected,
    }
