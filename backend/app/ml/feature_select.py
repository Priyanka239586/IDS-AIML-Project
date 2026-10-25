"""
Random Forest Feature Importance and Selection.

Trains a RandomForestClassifier on all 41 NSL-KDD features,
extracts feature_importances_, selects the top features,
and saves the results to disk.
"""

import os
import json
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.utils.class_weight import compute_class_weight

_HERE = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.normpath(os.path.join(_HERE, '..', 'models'))


def train_random_forest(
    X_train: np.ndarray,
    y_train: np.ndarray,
    feature_names: list,
) -> tuple[list, dict]:
    """
    Train a Random Forest on the training set.
    Compute feature importances, select features above threshold,
    and save all artifacts to MODELS_DIR.

    Args:
        X_train      : Scaled training features, shape (n, 41)
        y_train      : Encoded integer labels, shape (n,)
        feature_names: List of 41 feature name strings

    Returns:
        selected_features : list[str]   — ordered by descending importance
        importance_dict   : dict        — {feature_name: importance_score}
    """
    print("\n🌲 Training Random Forest for feature importance...")

    # Handle class imbalance with balanced weights
    classes = np.unique(y_train)
    class_weights_arr = compute_class_weight('balanced', classes=classes, y=y_train)
    class_weight_dict = dict(zip(classes.tolist(), class_weights_arr.tolist()))

    rf = RandomForestClassifier(
        n_estimators=150,
        max_depth=None,
        min_samples_split=5,
        n_jobs=-1,
        random_state=42,
        class_weight=class_weight_dict,
    )
    rf.fit(X_train, y_train)
    print("  RF training complete.")

    # Feature importances
    importances = rf.feature_importances_
    importance_dict: dict[str, float] = {
        name: float(score) for name, score in zip(feature_names, importances)
    }

    # Sort descending by importance
    sorted_pairs = sorted(importance_dict.items(), key=lambda x: x[1], reverse=True)

    print("\n  Top 15 features by RF importance:")
    for rank, (name, score) in enumerate(sorted_pairs[:15], 1):
        bar = "#" * int(score * 200)
        print("    {:>2}. {:<35} {:.5f}  {}".format(rank, name, score, bar))

    # Select features with importance ≥ threshold
    THRESHOLD = 0.01
    selected_features = [name for name, score in sorted_pairs if score >= THRESHOLD]

    # Guarantee at least 10 features
    if len(selected_features) < 10:
        selected_features = [name for name, _ in sorted_pairs[:10]]

    print(f"\n  ✅ Selected {len(selected_features)} features (importance ≥ {THRESHOLD})")

    # ── Persist ──────────────────────────────────────────────────────────────
    joblib.dump(rf, os.path.join(MODELS_DIR, 'rf_model.pkl'))

    with open(os.path.join(MODELS_DIR, 'feature_importance.json'), 'w') as fh:
        json.dump(importance_dict, fh, indent=2)

    with open(os.path.join(MODELS_DIR, 'selected_features.json'), 'w') as fh:
        json.dump(selected_features, fh, indent=2)

    print(f"  Saved: rf_model.pkl, feature_importance.json, selected_features.json")

    return selected_features, importance_dict
