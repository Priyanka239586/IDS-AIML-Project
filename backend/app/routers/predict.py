"""POST /predict — Real-time intrusion detection using the trained DNN."""

import os
import json
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/predict", tags=["Prediction"])

_HERE = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.normpath(os.path.join(_HERE, '..', 'models'))

# Module-level singletons — loaded once on first request
_model = None
_selected_features: list = None
_label_encoder = None


class PredictRequest(BaseModel):
    """
    Provide EITHER:
    - raw_features: dict of {feature_name: value} for any/all 41 NSL-KDD features
    - feature_values: list of floats in selected-feature order
      (order matches GET /feature-importance → selected_features list)
    """
    raw_features: Optional[dict] = None
    feature_values: Optional[list] = None


class PredictResponse(BaseModel):
    predicted_class: str
    predicted_index: int
    confidence: float
    probabilities: dict
    selected_features_used: list


def _load_artifacts():
    global _model, _selected_features, _label_encoder
    if _model is None:
        import tensorflow as tf
        import joblib
        paths = {
            'dnn_model.keras':        os.path.join(MODELS_DIR, 'dnn_model.keras'),
            'selected_features.json': os.path.join(MODELS_DIR, 'selected_features.json'),
            'label_encoder.pkl':      os.path.join(MODELS_DIR, 'label_encoder.pkl'),
        }
        for name, path in paths.items():
            if not os.path.exists(path):
                raise FileNotFoundError(
                    f"'{name}' not found. Run training first:\n"
                    "  cd backend && py -3.11 -m app.ml.train"
                )
        _model = tf.keras.models.load_model(paths['dnn_model.keras'])
        with open(paths['selected_features.json']) as fh:
            _selected_features = json.load(fh)
        _label_encoder = joblib.load(paths['label_encoder.pkl'])
    return _model, _selected_features, _label_encoder


@router.post("/", response_model=PredictResponse, summary="Predict attack class")
async def predict(request: PredictRequest):
    """
    Predict intrusion category for a network connection.

    Supply **either** `raw_features` (dict of NSL-KDD feature names → values)
    or `feature_values` (list in selected-feature order from GET /feature-importance).
    """
    try:
        model, selected_features, label_encoder = _load_artifacts()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    from app.ml.preprocess import preprocess_inference

    if request.raw_features:
        X = preprocess_inference(request.raw_features, selected_features)
    elif request.feature_values is not None:
        if len(request.feature_values) != len(selected_features):
            raise HTTPException(
                status_code=422,
                detail=(f"Expected {len(selected_features)} values "
                        f"(one per selected feature), got {len(request.feature_values)}. "
                        "Call GET /feature-importance to see the selected feature list.")
            )
        X = np.array(request.feature_values, dtype=np.float32).reshape(1, -1)
    else:
        raise HTTPException(
            status_code=422,
            detail="Provide either 'raw_features' (dict) or 'feature_values' (list)."
        )

    y_prob = model.predict(X, verbose=0)[0]
    y_pred = int(np.argmax(y_prob))
    class_names = list(label_encoder.classes_)

    return PredictResponse(
        predicted_class=class_names[y_pred],
        predicted_index=y_pred,
        confidence=float(y_prob[y_pred]),
        probabilities={c: float(p) for c, p in zip(class_names, y_prob)},
        selected_features_used=selected_features,
    )
