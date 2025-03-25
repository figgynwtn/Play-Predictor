import React from 'react';
import './FieldVisualization.css';

export default function FieldVisualization({ play, confidence }) {
  // Ensure play is always a string and has a default value
  const playType = typeof play === 'string' ? play : 'run';
  // Ensure confidence is a number and has a default value
  const confidenceValue = typeof confidence === 'number' ? confidence : 0;

  return (
    <div className="field-container">
      <div className="football-field">
        {/* Yard lines */}
        <div className="yard-lines">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="yard-line" style={{ left: `${i * 10}%` }} />
          ))}
        </div>
        
        {/* Animated play */}
        <div 
          className={`play-symbol ${playType}`} 
          style={{
            left: playType === 'pass' ? '20%' : '40%',
            backgroundColor: playType === 'pass' ? '#36A2EB' : '#FF6384'
          }}
        >
          <div className="confidence-badge">
            {Math.round(confidenceValue)}%
          </div>
        </div>
      </div>
      
      <div className="play-type-tag">
        {playType.toUpperCase()}
      </div>
    </div>
  );
}