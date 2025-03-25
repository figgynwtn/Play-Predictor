import React from 'react';
import './TendencyAnalysis.css';

// Mock data - replace with actual API calls
const teamTendencies = {
  DET: {
    1: { pass: 62, run: 38 },
    2: { pass: 45, run: 55 },
    3: { pass: 78, run: 22 },
    4: { pass: 35, run: 65 }
  },
  GB: {
    1: { pass: 58, run: 42 },
    2: { pass: 52, run: 48 },
    3: { pass: 82, run: 18 },
    4: { pass: 40, run: 60 }
  }
};

export default function TendencyAnalysis({ team, down, distance }) {
  const tendencies = teamTendencies[team]?.[down] || { pass: 50, run: 50 };
  const distanceCategory = distance >= 7 ? 'Long' : distance >= 3 ? 'Medium' : 'Short';

  return (
    <div className="tendency-analysis">
      <h3 className="title">{team} Tendencies</h3>
      
      <div className="tendency-grid">
        <div className="tendency-item">
          <span className="tendency-label">Down:</span>
          <span className="tendency-value">{down}</span>
        </div>
        <div className="tendency-item">
          <span className="tendency-label">Distance:</span>
          <span className="tendency-value">{distanceCategory}</span>
        </div>
      </div>
      
      <div className="tendency-bars">
        <div className="tendency-bar">
          <div 
            className="bar-fill pass" 
            style={{ width: `${tendencies.pass}%` }}
          >
            <span className="bar-label">Pass {tendencies.pass}%</span>
          </div>
        </div>
        <div className="tendency-bar">
          <div 
            className="bar-fill run" 
            style={{ width: `${tendencies.run}%` }}
          >
            <span className="bar-label">Run {tendencies.run}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}