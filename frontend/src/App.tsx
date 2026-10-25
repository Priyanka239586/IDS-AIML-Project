import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Overview from './pages/Overview';
import TrafficMonitor from './pages/TrafficMonitor';
import ThreatDetection from './pages/ThreatDetection';
import ModelPerformance from './pages/ModelPerformance';
import FeatureImportance from './pages/FeatureImportance';
import AlertsLogs from './pages/AlertsLogs';
import DatasetModelInfo from './pages/DatasetModelInfo';
import ProjectWorkflow from './pages/ProjectWorkflow';

const App: React.FC = () => (
  <BrowserRouter>
    <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden' }}>
      <Sidebar />
      <main className="layout-main">
        <Routes>
          <Route path="/"            element={<Overview />} />
          <Route path="/traffic"     element={<TrafficMonitor />} />
          <Route path="/detect"      element={<ThreatDetection />} />
          <Route path="/performance" element={<ModelPerformance />} />
          <Route path="/features"    element={<FeatureImportance />} />
          <Route path="/alerts"      element={<AlertsLogs />} />
          <Route path="/info"        element={<DatasetModelInfo />} />
          <Route path="/workflow"    element={<ProjectWorkflow />} />
        </Routes>
      </main>
    </div>
  </BrowserRouter>
);

export default App;
