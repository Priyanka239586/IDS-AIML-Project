"""
NSL-KDD Dataset Preprocessing Module.
Handles loading, categorical encoding, feature scaling, and label mapping.
No data leakage: encoders are fitted ONLY on the training set.
"""

import os
import json
import pandas as pd
import numpy as np
import joblib
from sklearn.preprocessing import StandardScaler, OrdinalEncoder, LabelEncoder

# ─────────────────────────────────────────────────────────────────────────────
# NSL-KDD Column Definitions
# ─────────────────────────────────────────────────────────────────────────────

COLUMN_NAMES = [
    'duration', 'protocol_type', 'service', 'flag', 'src_bytes', 'dst_bytes',
    'land', 'wrong_fragment', 'urgent', 'hot', 'num_failed_logins', 'logged_in',
    'num_compromised', 'root_shell', 'su_attempted', 'num_root',
    'num_file_creations', 'num_shells', 'num_access_files', 'num_outbound_cmds',
    'is_host_login', 'is_guest_login', 'count', 'srv_count', 'serror_rate',
    'srv_serror_rate', 'rerror_rate', 'srv_rerror_rate', 'same_srv_rate',
    'diff_srv_rate', 'srv_diff_host_rate', 'dst_host_count', 'dst_host_srv_count',
    'dst_host_same_srv_rate', 'dst_host_diff_srv_rate',
    'dst_host_same_src_port_rate', 'dst_host_srv_diff_host_rate',
    'dst_host_serror_rate', 'dst_host_srv_serror_rate',
    'dst_host_rerror_rate', 'dst_host_srv_rerror_rate',
    'label', 'difficulty_level'
]

FEATURE_NAMES: list[str] = COLUMN_NAMES[:41]  # First 41 columns are features

CATEGORICAL_FEATURES = ['protocol_type', 'service', 'flag']

# Mapping from specific attack name → 5-class category
ATTACK_CATEGORY_MAP: dict[str, str] = {
    'normal': 'Normal',
    # DoS
    'neptune': 'DoS', 'back': 'DoS', 'land': 'DoS', 'pod': 'DoS',
    'smurf': 'DoS', 'teardrop': 'DoS', 'apache2': 'DoS', 'udpstorm': 'DoS',
    'processtable': 'DoS', 'worm': 'DoS', 'mailbomb': 'DoS',
    # Probe
    'portsweep': 'Probe', 'ipsweep': 'Probe', 'nmap': 'Probe', 'satan': 'Probe',
    'mscan': 'Probe', 'saint': 'Probe',
    # R2L
    'ftp_write': 'R2L', 'guess_passwd': 'R2L', 'imap': 'R2L', 'multihop': 'R2L',
    'phf': 'R2L', 'spy': 'R2L', 'warezclient': 'R2L', 'warezmaster': 'R2L',
    'sendmail': 'R2L', 'named': 'R2L', 'snmpgetattack': 'R2L', 'snmpguess': 'R2L',
    'xlock': 'R2L', 'xsnoop': 'R2L', 'httptunnel': 'R2L',
    # U2R
    'buffer_overflow': 'U2R', 'loadmodule': 'U2R', 'perl': 'U2R',
    'rootkit': 'U2R', 'sqlattack': 'U2R', 'xterm': 'U2R', 'ps': 'U2R',
}

# Paths
_HERE = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.normpath(os.path.join(_HERE, '..', 'models'))
DATA_DIR = os.path.normpath(os.path.join(_HERE, '..', 'data'))


# ─────────────────────────────────────────────────────────────────────────────
# Loading
# ─────────────────────────────────────────────────────────────────────────────

def load_dataset(filepath: str) -> pd.DataFrame:
    """Load NSL-KDD .txt file (no header row) and assign column names.
    Supports both tab-separated and comma-separated formats."""
    # Try tab first, fall back to comma
    df = pd.read_csv(filepath, header=None, names=COLUMN_NAMES, sep='\t')
    # If only 1 column parsed, it's comma-separated
    if df.shape[1] == 1:
        df = pd.read_csv(filepath, header=None, names=COLUMN_NAMES, sep=',')
    return df


def map_attack_categories(df: pd.DataFrame) -> pd.DataFrame:
    """
    Map specific attack labels → 5-class categories.
    Drops rows with labels not in ATTACK_CATEGORY_MAP.
    Also drops 'difficulty_level' column.
    """
    df = df.copy()
    df['label'] = df['label'].astype(str).str.strip().str.lower().str.rstrip('.')
    df['category'] = df['label'].map(ATTACK_CATEGORY_MAP)

    unknown = df['category'].isna()
    if unknown.sum() > 0:
        unknown_labels = df.loc[unknown, 'label'].unique().tolist()
        print(f"  ⚠  Dropping {unknown.sum()} rows with unknown labels: {unknown_labels[:10]}")
        df = df[~unknown].copy()

    df = df.drop(columns=['label', 'difficulty_level'], errors='ignore')
    return df


# ─────────────────────────────────────────────────────────────────────────────
# Training Preprocessing  (fit + save)
# ─────────────────────────────────────────────────────────────────────────────

def fit_preprocess_train(df: pd.DataFrame):
    """
    Fit OrdinalEncoder, StandardScaler, LabelEncoder on training data.
    Saves fitted objects to MODELS_DIR.

    Returns:
        X_scaled  : np.ndarray shape (n_train, 41)
        y_encoded : np.ndarray shape (n_train,)
        feature_names : list[str]  — same as FEATURE_NAMES
    """
    os.makedirs(MODELS_DIR, exist_ok=True)

    X = df[FEATURE_NAMES].copy()
    y_raw = df['category'].values

    # 1. Encode the 3 categorical columns
    cat_encoder = OrdinalEncoder(
        handle_unknown='use_encoded_value',
        unknown_value=-1,
        dtype=np.float64,
    )
    X[CATEGORICAL_FEATURES] = cat_encoder.fit_transform(
        X[CATEGORICAL_FEATURES].astype(str)
    )
    X = X.astype(np.float64)

    # 2. Scale all 41 numeric features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # 3. Encode target labels (LabelEncoder sorts classes alphabetically)
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y_raw)

    # 4. Persist to disk
    joblib.dump(cat_encoder,    os.path.join(MODELS_DIR, 'feature_encoder.pkl'))
    joblib.dump(scaler,         os.path.join(MODELS_DIR, 'scaler.pkl'))
    joblib.dump(label_encoder,  os.path.join(MODELS_DIR, 'label_encoder.pkl'))

    print(f"  ✅ Saved preprocessors → {MODELS_DIR}")
    print(f"  Classes: {list(label_encoder.classes_)}")
    print(f"  X shape: {X_scaled.shape},  y shape: {y_encoded.shape}")

    return X_scaled, y_encoded, FEATURE_NAMES


# ─────────────────────────────────────────────────────────────────────────────
# Test / Inference Preprocessing  (load saved artifacts, no fitting)
# ─────────────────────────────────────────────────────────────────────────────

def preprocess_test(df: pd.DataFrame):
    """Apply saved encoders to the test DataFrame. No fitting is done here."""
    cat_encoder   = joblib.load(os.path.join(MODELS_DIR, 'feature_encoder.pkl'))
    scaler        = joblib.load(os.path.join(MODELS_DIR, 'scaler.pkl'))
    label_encoder = joblib.load(os.path.join(MODELS_DIR, 'label_encoder.pkl'))

    X = df[FEATURE_NAMES].copy()
    y_raw = df['category'].values

    X[CATEGORICAL_FEATURES] = cat_encoder.transform(X[CATEGORICAL_FEATURES].astype(str))
    X = X.astype(np.float64)
    X_scaled  = scaler.transform(X)
    y_encoded = label_encoder.transform(y_raw)

    return X_scaled, y_encoded


def preprocess_inference(feature_dict: dict, selected_features: list) -> np.ndarray:
    """
    Preprocess a single raw sample for real-time prediction.

    Args:
        feature_dict    : {feature_name: value}  — can be all 41 features or a subset
                          Missing features default to 0.
        selected_features: ordered list of feature names the DNN expects.

    Returns:
        np.ndarray of shape (1, len(selected_features)), scaled and ready for DNN.
    """
    cat_encoder = joblib.load(os.path.join(MODELS_DIR, 'feature_encoder.pkl'))
    scaler      = joblib.load(os.path.join(MODELS_DIR, 'scaler.pkl'))

    # Build a complete 41-feature row (default 0 for missing)
    row = {f: feature_dict.get(f, 0.0) for f in FEATURE_NAMES}
    df = pd.DataFrame([row])

    df[CATEGORICAL_FEATURES] = cat_encoder.transform(df[CATEGORICAL_FEATURES].astype(str))
    df = df.astype(np.float64)
    X_scaled = scaler.transform(df)

    # Extract only the selected feature columns
    selected_indices = [FEATURE_NAMES.index(f) for f in selected_features]
    return X_scaled[:, selected_indices]
