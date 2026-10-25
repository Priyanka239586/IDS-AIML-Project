"""
Full IDS-AIML Training Pipeline.

Steps:
  1. Load KDDTrain+.txt  (KDDTest+.txt has only binary 'Attack'/'Normal' labels,
     so it cannot be used for 5-class evaluation)
  2. Map specific attack names -> 5 categories (Normal/DoS/Probe/R2L/U2R)
  3. Stratified 80/20 split -> train / held-out test set
  4. Fit OrdinalEncoder + StandardScaler + LabelEncoder on train; apply to test
  5. Train Random Forest (150 trees) -> feature importances -> select top features
  6. Train DNN on selected features (held-out test used as validation)
  7. Evaluate DNN on held-out test -> save metrics.json

Run from the backend/ directory:
    py -3.11 -m app.ml.train
"""

import os
import sys
import time

_BACKEND = os.path.normpath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
)
if _BACKEND not in sys.path:
    sys.path.insert(0, _BACKEND)

from app.ml.preprocess import (
    load_dataset, map_attack_categories,
    fit_preprocess_train, preprocess_test,
    DATA_DIR, MODELS_DIR, FEATURE_NAMES,
)
from app.ml.feature_select import train_random_forest
from app.ml.dnn_model import train_dnn, evaluate_dnn


def main() -> None:
    t0 = time.time()
    print("=" * 62)
    print("  IDS-AIML -- Training Pipeline")
    print("=" * 62)

    # -- 1. Locate KDDTrain+.txt ----------------------------------------
    train_path = os.path.join(DATA_DIR, 'KDDTrain+.txt')

    # Also check datasets/ at project root
    _root = os.path.normpath(os.path.join(_BACKEND, '..'))
    alt_train = os.path.join(_root, 'datasets', 'KDDTrain+.txt')
    if not os.path.exists(train_path) and os.path.exists(alt_train):
        train_path = alt_train
        print("  INFO: Using dataset from: {}".format(alt_train))

    if not os.path.exists(train_path):
        print("\n  ERROR: KDDTrain+.txt not found.")
        print("      Expected at: {}".format(train_path))
        print("      Place the NSL-KDD file in backend/app/data/")
        sys.exit(1)

    # -- 2. Load ---------------------------------------------------------
    print("\n  Loading dataset ...")
    df_all = load_dataset(train_path)
    print("  Total rows: {:>7,}".format(len(df_all)))

    # -- 3. Map attack categories ----------------------------------------
    print("\n  Mapping attack labels -> 5 categories ...")
    df_all = map_attack_categories(df_all)

    print("\n  Full dataset class distribution:")
    for cat, cnt in df_all['category'].value_counts().items():
        print("    {:<10} {:>7,}".format(cat, cnt))

    # -- 4. Stratified 80/20 split (reproducible) ------------------------
    from sklearn.model_selection import train_test_split
    df_train, df_test = train_test_split(
        df_all, test_size=0.20, random_state=42, stratify=df_all['category']
    )
    print("\n  Train split : {:>7,} rows  (80 %)".format(len(df_train)))
    print("  Test  split : {:>7,} rows  (20 %, held-out for real evaluation)".format(len(df_test)))

    print("\n  Test split class distribution:")
    for cat, cnt in df_test['category'].value_counts().items():
        print("    {:<10} {:>7,}".format(cat, cnt))

    # -- 5. Preprocess ---------------------------------------------------
    os.makedirs(MODELS_DIR, exist_ok=True)
    print("\n  Preprocessing train split (fit encoders + scaler) ...")
    X_train_scaled, y_train, feature_names = fit_preprocess_train(df_train)

    print("\n  Preprocessing test split (apply saved encoders) ...")
    X_test_scaled, y_test = preprocess_test(df_test)

    # -- 6. Random Forest ------------------------------------------------
    selected_features, _ = train_random_forest(X_train_scaled, y_train, feature_names)

    sel_idx = [feature_names.index(f) for f in selected_features]
    X_train_sel = X_train_scaled[:, sel_idx]
    X_test_sel  = X_test_scaled[:, sel_idx]
    print("\n  DNN input dimension: {} RF-selected features".format(X_train_sel.shape[1]))

    # -- 7. Train DNN ----------------------------------------------------
    model, _ = train_dnn(X_train_sel, y_train, X_test_sel, y_test)

    # -- 8. Evaluate -----------------------------------------------------
    metrics = evaluate_dnn(model, X_test_sel, y_test)

    elapsed = time.time() - t0
    print("=" * 62)
    print("  Pipeline complete in {:.1f} min".format(elapsed / 60))
    print("  Accuracy : {:.4f}".format(metrics['accuracy']))
    print("  Macro F1 : {:.4f}".format(metrics['macro_f1']))
    if metrics['roc_auc_ovr_macro']:
        print("  ROC-AUC  : {:.4f}".format(metrics['roc_auc_ovr_macro']))
    print("  Artifacts saved to: {}".format(MODELS_DIR))
    print("=" * 62)


if __name__ == '__main__':
    main()
