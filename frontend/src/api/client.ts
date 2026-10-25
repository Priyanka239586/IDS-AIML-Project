import axios from 'axios';
import type { Metrics, FeatureImportanceResponse, PredictResponse, HealthStatus } from '../types';

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000';

const api = axios.create({ baseURL: BASE, timeout: 30_000 });

export const getHealth = (): Promise<HealthStatus> =>
  api.get('/health').then(r => r.data);

export const getMetrics = (): Promise<Metrics> =>
  api.get('/metrics/').then(r => r.data);

export const getConfusionMatrix = (): Promise<{ confusion_matrix: number[][]; class_names: string[] }> =>
  api.get('/metrics/confusion-matrix').then(r => r.data);

export const getFeatureImportance = (): Promise<FeatureImportanceResponse> =>
  api.get('/feature-importance/').then(r => r.data);

export const getAlerts = (params?: {
  limit?: number;
  attack_type?: string;
  severity?: string;
}) => api.get('/alerts/', { params }).then(r => r.data);

export const getDatasetInfo = () =>
  api.get('/dataset-info/').then(r => r.data);

export const predict = (payload: {
  raw_features?: Record<string, number>;
  feature_values?: number[];
}): Promise<PredictResponse> =>
  api.post('/predict/', payload).then(r => r.data);

export default api;
