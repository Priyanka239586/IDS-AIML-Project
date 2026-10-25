"""
Deep Neural Network for NSL-KDD 5-class intrusion detection.
Architecture: Input -> Dense(256)+BN+Drop(0.3) -> Dense(128)+BN+Drop(0.3)
              -> Dense(64)+Drop(0.2) -> Dense(32) -> Dense(5, softmax)
"""

import os
import json
import numpy as np
import joblib

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

_HERE = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.normpath(os.path.join(_HERE, '..', 'models'))
NUM_CLASSES = 5


def build_dnn(input_dim: int):
    """Build and compile the Keras DNN model."""
    import tensorflow as tf
    from tensorflow import keras

    model = keras.Sequential([
        keras.layers.Input(shape=(input_dim,), name='input'),
        keras.layers.Dense(256, activation='relu', name='dense_1'),
        keras.layers.BatchNormalization(name='bn_1'),
        keras.layers.Dropout(0.3, name='drop_1'),
        keras.layers.Dense(128, activation='relu', name='dense_2'),
        keras.layers.BatchNormalization(name='bn_2'),
        keras.layers.Dropout(0.3, name='drop_2'),
        keras.layers.Dense(64, activation='relu', name='dense_3'),
        keras.layers.Dropout(0.2, name='drop_3'),
        keras.layers.Dense(32, activation='relu', name='dense_4'),
        keras.layers.Dense(NUM_CLASSES, activation='softmax', name='output'),
    ], name='IDS_DNN')

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy'],
    )
    return model


def train_dnn(X_train: np.ndarray, y_train: np.ndarray,
              X_val: np.ndarray = None, y_val: np.ndarray = None):
    """
    Train DNN on the training split.

    X_val / y_val are the VALIDATION split (20 % of KDDTrain+).
    They are passed as validation_data= to Keras and used ONLY by callbacks
    (EarlyStopping, ReduceLROnPlateau, ModelCheckpoint) — never for weight
    updates.  The held-out test split is kept separate and is not passed here.
    """
    from tensorflow import keras
    from sklearn.utils.class_weight import compute_class_weight

    print("\n🧠 Training Deep Neural Network...")
    model = build_dnn(X_train.shape[1])
    model.summary()

    classes = np.unique(y_train)
    cw_arr = compute_class_weight('balanced', classes=classes, y=y_train)
    class_weight_dict = dict(zip(classes.tolist(), cw_arr.tolist()))

    monitor = 'val_loss' if X_val is not None else 'loss'
    save_path = os.path.join(MODELS_DIR, 'dnn_model.keras')
    validation_data = (X_val, y_val) if X_val is not None else None

    callbacks = [
        keras.callbacks.EarlyStopping(monitor=monitor, patience=5,
                                      restore_best_weights=True, verbose=1),
        keras.callbacks.ReduceLROnPlateau(monitor=monitor, factor=0.5,
                                          patience=3, min_lr=1e-5, verbose=1),
        keras.callbacks.ModelCheckpoint(save_path, monitor=monitor,
                                        save_best_only=True, verbose=0),
    ]

    history = model.fit(
        X_train, y_train,
        epochs=30,
        batch_size=512,
        validation_data=validation_data,
        class_weight=class_weight_dict,
        callbacks=callbacks,
        verbose=1,
    )
    print(f"  ✅ DNN saved → {save_path}")
    return model, history


def evaluate_dnn(model, X_test: np.ndarray, y_test: np.ndarray) -> dict:
    """
    Evaluate the trained DNN on the held-out test split.

    The test split is 20 % of KDDTrain+.txt, stratified, set aside before
    any preprocessing fitting, Random Forest training, or DNN training.
    It is used exactly once — here — to report unbiased final metrics.

    Note: KDDTest+.txt (from UNB) contains only generic 'Attack'/'Normal'
    labels and cannot be used for 5-class evaluation.

    Computes:
      - Accuracy
      - Per-class + macro Precision, Recall, F1-score
      - Per-class + macro False Positive Rate (FP / (FP + TN))
      - ROC-AUC (One-vs-Rest, macro average)
      - 5x5 Confusion Matrix
    Saves results to MODELS_DIR/metrics.json.
    """
    from sklearn.metrics import (accuracy_score, classification_report,
                                  confusion_matrix, roc_auc_score)
    from sklearn.preprocessing import label_binarize

    print("\n  Evaluating DNN on held-out test split (20 % of KDDTrain+) ...")
    label_encoder = joblib.load(os.path.join(MODELS_DIR, 'label_encoder.pkl'))
    class_names = list(label_encoder.classes_)

    y_prob = model.predict(X_test, batch_size=512, verbose=0)
    y_pred = np.argmax(y_prob, axis=1)

    acc = float(accuracy_score(y_test, y_pred))
    report = classification_report(y_test, y_pred, target_names=class_names,
                                   output_dict=True, zero_division=0)
    cm = confusion_matrix(y_test, y_pred)

    # Per-class False Positive Rate: FP / (FP + TN)
    fpr_per_class = {}
    for i, cls in enumerate(class_names):
        fp = int(cm[:, i].sum()) - int(cm[i, i])
        tn = int(cm.sum()) - int(cm[i, :].sum()) - int(cm[:, i].sum()) + int(cm[i, i])
        fpr_per_class[cls] = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0
    macro_fpr = float(np.mean(list(fpr_per_class.values())))

    # ROC-AUC One-vs-Rest macro
    y_bin = label_binarize(y_test, classes=list(range(len(class_names))))
    try:
        roc_auc = float(roc_auc_score(y_bin, y_prob, multi_class='ovr', average='macro'))
    except Exception as e:
        print(f"  ⚠  ROC-AUC failed: {e}")
        roc_auc = None

    metrics = {
        "accuracy":          acc,
        "macro_precision":   float(report['macro avg']['precision']),
        "macro_recall":      float(report['macro avg']['recall']),
        "macro_f1":          float(report['macro avg']['f1-score']),
        "weighted_f1":       float(report['weighted avg']['f1-score']),
        "macro_fpr":         macro_fpr,
        "roc_auc_ovr_macro": roc_auc,
        "per_class": {
            cls: {
                "precision": float(report[cls]['precision']),
                "recall":    float(report[cls]['recall']),
                "f1_score":  float(report[cls]['f1-score']),
                "support":   int(report[cls]['support']),
                "fpr":       fpr_per_class[cls],
            }
            for cls in class_names
        },
        "confusion_matrix":   cm.tolist(),
        "class_names":        class_names,
        "num_test_samples":   int(len(y_test)),
    }

    with open(os.path.join(MODELS_DIR, 'metrics.json'), 'w') as fh:
        json.dump(metrics, fh, indent=2)

    print(f"  Accuracy : {acc:.4f}")
    print(f"  Macro F1 : {metrics['macro_f1']:.4f}")
    if roc_auc:
        print(f"  ROC-AUC  : {roc_auc:.4f}")
    print(f"  ✅ Metrics saved → {os.path.join(MODELS_DIR, 'metrics.json')}")
    return metrics


def load_dnn():
    """Load the saved Keras DNN from disk."""
    import tensorflow as tf
    path = os.path.join(MODELS_DIR, 'dnn_model.keras')
    if not os.path.exists(path):
        raise FileNotFoundError(f"DNN not found at {path}. Run training first.")
    return tf.keras.models.load_model(path)
