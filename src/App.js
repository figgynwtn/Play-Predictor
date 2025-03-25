import React from 'react';
import Predictor from './components/Predictor/Predictor'; // Updated path
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import BasicPredictor from './components/BasicPredictor/BasicPredictor';
import './styles.css';

export default function App() {
  return (
    <div className="app">
      <header>
        <h1>🏈 AI Play Predictor (TensorFlow.js)</h1>
        <p>Predict run/pass plays using game context</p>
      </header>
      <ErrorBoundary fallback={<BasicPredictor />}>
        <Predictor />
      </ErrorBoundary>
    </div>
  );
}