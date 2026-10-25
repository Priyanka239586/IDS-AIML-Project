"""GET /dataset-info — NSL-KDD metadata, DNN architecture, RF configuration."""

import os
import json
from fastapi import APIRouter

router = APIRouter(prefix="/dataset-info", tags=["Dataset Info"])

_HERE = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.normpath(os.path.join(_HERE, '..', 'models'))

_NSL_KDD = {
    "name": "NSL-KDD",
    "description": (
        "NSL-KDD is an improved version of the KDD Cup 1999 dataset. "
        "It removes duplicate records, reducing classifier bias toward frequent connections. "
        "Widely used as a standard benchmark for network intrusion detection research."
    ),
    "source_url":       "https://www.unb.ca/cic/datasets/nsl.html",
    "train_file":       "KDDTrain+.txt",
    "test_file":        "KDDTest+.txt",
    "approx_train_size": 125973,
    "approx_test_size":  22544,
    "total_features":   41,
    "categorical_features": ["protocol_type", "service", "flag"],
    "total_classes":    5,
    "class_names":      ["Normal", "DoS", "Probe", "R2L", "U2R"],
    "class_descriptions": {
        "Normal": "Legitimate network traffic — no attack.",
        "DoS":    "Denial of Service — overwhelm resources (neptune, smurf, pod, teardrop, back).",
        "Probe":  "Reconnaissance/scanning — gather network info (portsweep, ipsweep, nmap, satan).",
        "R2L":    "Remote-to-Local — unauthorized remote access (guess_passwd, ftp_write, imap).",
        "U2R":    "User-to-Root — local privilege escalation (buffer_overflow, rootkit, loadmodule).",
    },
    "evaluation_method": (
        "KDDTest+.txt uses only generic 'Attack'/'Normal' labels, so it cannot support 5-class "
        "evaluation. Model is evaluated on a stratified 20% held-out split of KDDTrain+ "
        "(random_state=42), guaranteeing all 5 classes are present in the test set."
    ),
    "known_limitations": [
        "U2R and R2L have very few samples — lower recall for these classes is expected and documented.",
        "Dataset reflects 1999-era network traffic; modern attacks may differ.",
        "Class imbalance is handled with class_weight='balanced' in both RF and DNN.",
        "KDDTest+.txt has generic labels; evaluation uses a stratified 80/20 split of KDDTrain+.",
    ],
}

_DNN_ARCH = {
    "framework": "TensorFlow 2.x / Keras",
    "type":      "Feedforward Deep Neural Network (multi-class classifier)",
    "layers": [
        {"name": "Input",  "units": "N (RF-selected features)", "activation": "-",       "extra": ""},
        {"name": "Dense",  "units": 256,  "activation": "ReLU",    "extra": "BatchNormalization + Dropout(0.3)"},
        {"name": "Dense",  "units": 128,  "activation": "ReLU",    "extra": "BatchNormalization + Dropout(0.3)"},
        {"name": "Dense",  "units": 64,   "activation": "ReLU",    "extra": "Dropout(0.2)"},
        {"name": "Dense",  "units": 32,   "activation": "ReLU",    "extra": ""},
        {"name": "Output", "units": 5,    "activation": "Softmax", "extra": "5 attack classes"},
    ],
    "loss":       "sparse_categorical_crossentropy",
    "optimizer":  "Adam (lr=0.001)",
    "batch_size": 512,
    "max_epochs": 30,
    "callbacks":  ["EarlyStopping(patience=5)", "ReduceLROnPlateau(patience=3)", "ModelCheckpoint(best_only=True)"],
}

_RF_INFO = {
    "framework":            "scikit-learn RandomForestClassifier",
    "purpose":              "Feature importance ranking and selection of DNN inputs",
    "n_estimators":         150,
    "class_weight":         "balanced",
    "selection_threshold":  0.01,
    "note":                 "Features with importance score >= 0.01 are passed to the DNN.",
}


@router.get("/", summary="NSL-KDD info and model architecture")
async def get_dataset_info():
    """Returns dataset metadata, DNN architecture, RF config, and real test-set class distribution if available."""

    # Real test-set class distribution (from metrics.json if training done)
    test_class_dist = None
    metrics_path = os.path.join(MODELS_DIR, 'metrics.json')
    if os.path.exists(metrics_path):
        with open(metrics_path) as fh:
            m = json.load(fh)
        test_class_dist = {
            cls: m['per_class'][cls]['support']
            for cls in m.get('class_names', [])
            if cls in m.get('per_class', {})
        }

    selected = None
    sel_path = os.path.join(MODELS_DIR, 'selected_features.json')
    if os.path.exists(sel_path):
        with open(sel_path) as fh:
            selected = json.load(fh)

    return {
        "dataset":                 _NSL_KDD,
        "dnn_architecture":        _DNN_ARCH,
        "rf_info":                 _RF_INFO,
        "test_class_distribution": test_class_dist,
        "selected_features":       selected,
        "num_selected_features":   len(selected) if selected else None,
    }
