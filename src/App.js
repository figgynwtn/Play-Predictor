import React from 'react';
import Predictor from './components/Predictor/Predictor'; // Updated path
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import BasicPredictor from './components/BasicPredictor/BasicPredictor';
import './fonts.css';
import './styles.css';

export default function App() {
  return (
    <div className="app">
      <header>
        <h1>Play Predictor</h1>
        <p>Predicting plays using game context and AI</p>
      </header>
      <ErrorBoundary fallback={<BasicPredictor />}>
        <Predictor />
      </ErrorBoundary>
    </div>
  );
}