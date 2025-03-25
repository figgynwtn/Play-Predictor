import React, { useState, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { loadNFLData, filterTeamData } from '../../utils/nflDataLoader';
import FieldVisualization from '../FieldVisualization/FieldVisualization';
import TeamLogos from '../TeamLogos/TeamLogos';
import LoadingSpinner from '../shared/LoadingSpinner';
import DriveHistoryChart from '../DriveHistoryChart/DriveHistoryChart';
import SituationalContext from '../SituationalContext/SituationalContext';
import TendencyAnalysis from '../TendencyAnalysis/TendencyAnalysis';
import './Predictor.css';

const predictBlitz = ({ down, ydstogo }) => {
  return down === 3 && ydstogo > 7 ? 0.75 : 0.35;
};

const suggestCounterPlay = (playType, { down }) => {
  if (playType === 'pass' && down === 3) return 'Screen Pass';
  if (playType === 'run' && down === 2) return 'Play Action';
  return 'Standard Play';
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default function Predictor() {
  const [state, setState] = useState({
    model: null,
    prediction: null,
    isLoading: true,
    dataLoaded: false,
    error: null,
    allTeams: [],
    selectedTeam: 'DET',
    selectedUnit: 'offense',
    situation: {
      down: 1,
      ydstogo: 10,
      yardline: 65,
      scoreDiff: 0,
      quarter: 1,
      timeLeft: 900,
      shotgun: false,
      noHuddle: false,
      defendersInBox: 6,
      passRushers: 4
    },
    driveHistory: []
  });

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const data = await loadNFLData();
        const teams = [...new Set(data.map(p => p.posteam).filter(Boolean))];
        
        if (isMounted) {
          setState(prev => ({
            ...prev,
            allTeams: teams.sort(),
            isLoading: false,
            dataLoaded: true
          }));
        }
      } catch (err) {
        if (isMounted) {
          setState(prev => ({ 
            ...prev, 
            error: `Data load failed: ${err.message}`, 
            isLoading: false 
          }));
        }
      }
    };
    
    init();
    return () => { isMounted = false; };
  }, []);

  const trainTeamModel = useCallback(async (teamData, unit) => {
    const filteredData = filterTeamData(teamData, state.selectedTeam, unit);
    
    const features = filteredData.map(play => [
      play.down,
      play.ydstogo,
      play.yardline_100,
      play.score_differential,
      play.qtr,
      play.game_seconds_remaining,
      play.shotgun ? 1 : 0,
      play.no_huddle ? 1 : 0,
      unit === 'defense' ? (play.number_of_pass_rushers || 4) : 0,
      play.defenders_in_box || 6
    ]);

    const labels = filteredData.map(play => ({
      playType: play.play_type,
      formation: play.formation || 'Unknown',
      expectedYards: play.yards_gained || 0,
      wp: play.wp || 0.5
    }));

    const featureTensor = tf.tensor2d(features, [features.length, features[0].length]);
    const labelTensor = tf.tensor2d(
      labels.map(l => [
        l.playType === 'pass' ? 1 : 0,
        l.formation.includes('SHOTGUN') ? 1 : 0,
        l.expectedYards / 20,
        l.wp
      ]),
      [labels.length, 4]
    );

    const model = tf.sequential();
    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
      inputShape: [features[0].length]
    }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu'
    }));
    model.add(tf.layers.dense({
      units: 4,
      activation: 'linear'
    }));

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError'
    });

    await model.fit(featureTensor, labelTensor, {
      epochs: 15,
      batchSize: 32,
      validationSplit: 0.2,
      verbose: 0
    });

    tf.dispose([featureTensor, labelTensor]);
    
    return model;
  }, [state.selectedTeam]);

  const handlePredict = async () => {
    if (!state.dataLoaded) {
      setState(prev => ({ ...prev, error: "Please wait for data to load" }));
      return;
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const historicalData = await loadNFLData();
      const model = await trainTeamModel(historicalData, state.selectedUnit);
      
      const inputFeatures = [
        state.situation.down,
        state.situation.ydstogo,
        state.situation.yardline,
        state.situation.scoreDiff,
        state.situation.quarter,
        state.situation.timeLeft,
        state.situation.shotgun ? 1 : 0,
        state.situation.noHuddle ? 1 : 0,
        state.situation.passRushers,
        state.situation.defendersInBox
      ];

      const prediction = await model.predict(
        tf.tensor2d([inputFeatures], [1, inputFeatures.length])
      ).array();

      const [playTypeBin, formationBin, yardsNorm, wp] = prediction[0];
      const playType = playTypeBin > 0.5 ? 'pass' : 'run';
      const formation = formationBin > 0.5 ? 'Shotgun' : 'Under Center';
      const expectedYards = Math.round(yardsNorm * 20);
      
      setState(prev => ({
        ...prev,
        model,
        prediction: {
          playType,
          formation,
          expectedYards,
          confidence: Math.round(Math.max(playTypeBin, 1-playTypeBin) * 100),
          winProbability: wp,
          blitzProbability: predictBlitz(prev.situation),
          suggestedPlay: suggestCounterPlay(playType, prev.situation)
        },
        isLoading: false,
        driveHistory: [
          ...prev.driveHistory.slice(-9),
          {
            down: prev.situation.down,
            distance: prev.situation.ydstogo,
            yardline: prev.situation.yardline,
            playType
          }
        ]
      }));

    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: `Prediction failed: ${err.message}`,
        isLoading: false 
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setState(prev => ({
      ...prev,
      situation: {
        ...prev.situation,
        [name]: type === 'checkbox' ? checked : Number(value)
      }
    }));
  };

  const handleTeamChange = (e) => {
    setState(prev => ({
      ...prev,
      selectedTeam: e.target.value,
      prediction: null
    }));
  };

  return (
    <div className="predictor-app">
      <div className="predictor-header">
        <h2>NFL Play Predictor</h2>
        <div className="team-controls">
          <select
            value={state.selectedTeam}
            onChange={handleTeamChange}
            disabled={state.isLoading}
          >
            {state.allTeams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>

          <div className="unit-selector">
            {['offense', 'defense', 'special'].map(unit => (
              <button
              key={unit}
              className={state.selectedUnit === unit ? 'active' : ''}
              onClick={() => {
                setState(prev => ({ 
                  ...prev, 
                  selectedUnit: unit,
                  prediction: null
                }));
              }}
              disabled={state.isLoading}
            >
              {unit.charAt(0).toUpperCase() + unit.slice(1)}
            </button>
            ))}
          </div>
        </div>
      </div>

      <div className="situation-panel">
        <h3>Game Situation</h3>
        
        <div className="situation-grid">
          <div className="input-group">
            <label>Down</label>
            <select name="down" value={state.situation.down} onChange={handleInputChange}>
              {[1, 2, 3, 4].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Distance (yds)</label>
            <input
              type="number"
              name="ydstogo"
              min="1"
              max="99"
              value={state.situation.ydstogo}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-group">
            <label>Field Position</label>
            <input
              type="number"
              name="yardline"
              min="1"
              max="99"
              value={state.situation.yardline}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-group">
            <label>Quarter</label>
            <select name="quarter" value={state.situation.quarter} onChange={handleInputChange}>
              {[1, 2, 3, 4, 5].map(num => (
                <option key={num} value={num}>Q{num}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Time Left</label>
            <div className="time-input">
              <input
                type="number"
                name="timeLeft"
                min="0"
                max="900"
                value={state.situation.timeLeft}
                onChange={handleInputChange}
              />
              <span>{formatTime(state.situation.timeLeft)}</span>
            </div>
          </div>

          <div className="input-group">
            <label>Score Diff</label>
            <input
              type="number"
              name="scoreDiff"
              min="-30"
              max="30"
              value={state.situation.scoreDiff}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-group checkbox">
            <label>
              <input
                type="checkbox"
                name="shotgun"
                checked={state.situation.shotgun}
                onChange={handleInputChange}
              />
              Shotgun
            </label>
          </div>

          <div className="input-group checkbox">
            <label>
              <input
                type="checkbox"
                name="noHuddle"
                checked={state.situation.noHuddle}
                onChange={handleInputChange}
              />
              No Huddle
            </label>
          </div>

          {state.selectedUnit === 'defense' && (
            <>
              <div className="input-group">
                <label>Pass Rushers</label>
                <input
                  type="number"
                  name="passRushers"
                  min="3"
                  max="6"
                  value={state.situation.passRushers}
                  onChange={handleInputChange}
                />
              </div>
              <div className="input-group">
                <label>Defenders in Box</label>
                <input
                  type="number"
                  name="defendersInBox"
                  min="5"
                  max="9"
                  value={state.situation.defendersInBox}
                  onChange={handleInputChange}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="prediction-controls">
        <button 
          onClick={handlePredict}
          disabled={state.isLoading || !state.dataLoaded}
          className="predict-button"
        >
          {state.isLoading ? (
            <LoadingSpinner size={20} text="Analyzing..." />
          ) : (
            `Predict ${state.selectedTeam} ${state.selectedUnit} Play`
          )}
        </button>
      </div>

      {state.error && (
        <div className="error-banner">
          {state.error}
        </div>
      )}

      {state.prediction && (
        <div className="results-panel">
          <div className="play-visualization">
            <TeamLogos team={state.selectedTeam} size={80} />
            <FieldVisualization
              play={state.prediction.playType}
              confidence={state.prediction.confidence}
            />
          </div>

          <div className="play-details">
            <h3>
              {state.prediction.playType.toUpperCase()} 
              <span className="confidence-badge">
                {state.prediction.confidence}% confidence
              </span>
            </h3>
            
            <div className="detail-grid">
              <div className="detail-item">
                <h4>Formation</h4>
                <p>{state.prediction.formation}</p>
              </div>
              <div className="detail-item">
                <h4>Expected Yards</h4>
                <p>{state.prediction.expectedYards >= 0 ? '+' : ''}{state.prediction.expectedYards}</p>
              </div>
              <div className="detail-item">
                <h4>Win Probability</h4>
                <p>{(state.prediction.winProbability * 100).toFixed(1)}%</p>
              </div>
              {state.selectedUnit === 'defense' && (
                <div className="detail-item">
                  <h4>Blitz Probability</h4>
                  <p>{(state.prediction.blitzProbability * 100).toFixed(0)}%</p>
                </div>
              )}
              <div className="detail-item">
                <h4>Suggested Counter</h4>
                <p>{state.prediction.suggestedPlay}</p>
              </div>
            </div>
          </div>

          <div className="analytics-section">
            <TendencyAnalysis 
              team={state.selectedTeam}
              down={state.situation.down}
              distance={state.situation.ydstogo}
              unit={state.selectedUnit}
            />
            
            <DriveHistoryChart 
              history={state.driveHistory}
              currentSituation={state.situation}
              team={state.selectedTeam}
            />
          </div>
        </div>
      )}
    </div>
  );
}