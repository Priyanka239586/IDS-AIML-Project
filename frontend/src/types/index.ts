export interface Metrics {
  accuracy: number;
  macro_precision: number;
  macro_recall: number;
  macro_f1: number;
  weighted_f1: number;
  macro_fpr: number;
  roc_auc_ovr_macro: number | null;
  per_class: Record<string, PerClassMetrics>;
  confusion_matrix: number[][];
  class_names: string[];
  num_test_samples: number;
}

export interface PerClassMetrics {
  precision: number;
  recall: number;
  f1_score: number;
  support: number;
  fpr: number;
}

export interface FeatureItem {
  name: string;
  importance: number;
  selected: boolean;
  rank: number;
}

export interface FeatureImportanceResponse {
  features: FeatureItem[];
  total_features: number;
  selected_count: number;
  selected_features: string[];
}

export interface PredictResponse {
  predicted_class: string;
  predicted_index: number;
  confidence: number;
  probabilities: Record<string, number>;
  selected_features_used: string[];
}

export interface AlertItem {
  id: string;
  timestamp: string;
  attack_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_ip: string;
  dest_ip: string;
  confidence: number;
  message: string;
  is_simulated: boolean;
}

export interface HealthStatus {
  trained: boolean;
  artifacts: Record<string, boolean>;
  models_dir?: string;
}
