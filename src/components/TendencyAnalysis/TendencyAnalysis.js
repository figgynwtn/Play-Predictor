import React from 'react';
import './TendencyAnalysis.css';

export default function TendencyAnalysis({ team, down, distance, unit }) {
  // Calculate tendencies based on unit (offense/defense)
  const tendencies = unit === 'offense' 
    ? {
        'Pass': 60,
        'Run': 40
      }
    : {
        'Zone': 55,
        'Man': 35,
        'Blitz': 10
      };

  const distanceCategory = distance >= 7 ? 'Long' : distance >= 3 ? 'Medium' : 'Short';

  return (
    <div className="tendency-analysis">
      <h3 className="title">{team} {unit} Tendencies</h3>
      
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
        {Object.entries(tendencies).map(([play, percent]) => (
          <div key={play} className="tendency-bar">
            <div 
              className={`bar-fill ${play === 'Pass' || play === 'Zone' ? 'pass' : 'run'}`}
              style={{ width: `${percent}%` }}
            >
              <span className="bar-label">{play} {percent}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}