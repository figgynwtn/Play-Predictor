import React from 'react';
import './SituationalContext.css';

export default function SituationalContext({ situation }) {
  const getDownText = (down) => {
    const suffixes = ['', 'st', 'nd', 'rd', 'th'];
    return `${down}${suffixes[down] || 'th'}`;
  };

  const getFieldPosition = (yardline) => {
    return yardline <= 50 ? `Own ${yardline}` : `Opp ${100 - yardline}`;
  };

  return (
    <div className="situational-context">
      <div className="context-item">
        <span className="label">Situation:</span>
        <span className="value">
          {getDownText(situation.down)} & {situation.ydstogo}
        </span>
      </div>
      <div className="context-item">
        <span className="label">Field Position:</span>
        <span className="value">{getFieldPosition(situation.yardline)}</span>
      </div>
      <div className="context-item">
        <span className="label">Quarter:</span>
        <span className="value">Q{situation.quarter}</span>
      </div>
      <div className="context-item">
        <span className="label">Time Left:</span>
        <span className="value">
          {Math.floor(situation.timeLeft / 60)}:
          {(situation.timeLeft % 60).toString().padStart(2, '0')}
        </span>
      </div>
      <div className="context-item">
        <span className="label">Score Diff:</span>
        <span className="value">
          {situation.scoreDiff > 0 ? '+' : ''}{situation.scoreDiff}
        </span>
      </div>
    </div>
  );
}