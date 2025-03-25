import React, { useState } from 'react';
import './BasicPredictor.css';

export default function BasicPredictor() {
  const [prediction, setPrediction] = useState(null);
  const [situation, setSituation] = useState({
    down: 1,
    distance: 10
  });

  const predict = () => {
    // Simple rule-based prediction
    const isPass = situation.down === 3 || situation.distance > 8;
    setPrediction({
      play: isPass ? 'pass' : 'run',
      confidence: isPass ? 65 : 70,
      formation: isPass ? 'Shotgun' : 'I-Form'
    });
  };

  return (
    <div className="basic-predictor">
      <h3>Basic Play Predictor</h3>
      
      <div className="basic-controls">
        <div>
          <label>Down: </label>
          <select 
            value={situation.down}
            onChange={(e) => setSituation({...situation, down: e.target.value})}
          >
            {[1, 2, 3, 4].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label>Distance: </label>
          <input 
            type="number" 
            value={situation.distance}
            onChange={(e) => setSituation({...situation, distance: e.target.value})}
          />
        </div>
      </div>
      
      <button onClick={predict}>Predict</button>
      
      {prediction && (
        <div className="basic-result">
          <p>Play: <strong>{prediction.play.toUpperCase()}</strong></p>
          <p>Formation: {prediction.formation}</p>
          <p>Confidence: {prediction.confidence}%</p>
        </div>
      )}
    </div>
  );
}