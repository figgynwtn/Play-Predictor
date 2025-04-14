import React, { useState, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { loadNFLData, filterTeamData } from '../../utils/nflDataLoader';
import OffenseVisualization from '../FieldVisualization/OffenseVisualization';
import DefenseVisualization from '../FieldVisualization/DefenseVisualization';
import TeamLogos from '../TeamLogos/TeamLogos';
import LoadingSpinner from '../shared/LoadingSpinner';
import DriveHistoryChart from '../DriveHistoryChart/DriveHistoryChart';
import TendencyAnalysis from '../TendencyAnalysis/TendencyAnalysis';
import './Predictor.css';

// Constants
const MAX_QUARTER_TIME = 15 * 60;
const DEFENSIVE_PLAY_TYPES = [
  'Cover 2', 'Cover 3', 'Man Press', 'Blitz',
  'Tampa 2', 'Spy', 'Prevent'
];
const DEFENSIVE_FORMATIONS = ['4-3', '3-4', 'Nickel', 'Dime'];
const OFFENSIVE_PLAY_TYPES = {
  PASS: [
    'Slant', 
    'Out', 
    'Post', 
    'Screen Pass',
    'Deep Pass',
    'Play Action',
    'Go',
    'Corner',
    'Dig',
    'Hook',
    'Arrow',
    'Option',
    'Trick Play',
    'Hail Mary'

  ],
  RUN: [
    'Dive', 
    'Outside Zone',
    'Draw',
    'Counter',
    'Power Run',
    'Up The Middle',
    'Iso',
    'Off Tackle',
    'Toss',
    'Sweep',
    'Trap',
    'Bootleg',
    'Quarterback Sneak',
    'End-around',
    'Reverse',
    'Option'

  ]
};
const ALL_OFFENSIVE_PLAYS = [...OFFENSIVE_PLAY_TYPES.PASS, ...OFFENSIVE_PLAY_TYPES.RUN];
const OFFENSIVE_FORMATIONS = ['Shotgun', 'Under Center', 'Pistol', 'I Formation', 'Empty'];
const SITUATION_PRESETS = [
  { label: "1st & 10", down: 1, ydstogo: 10, yardline: 35 },
  { label: "3rd & Long", down: 3, ydstogo: 8, yardline: 45 },
  { label: "Goal Line", down: 1, ydstogo: 3, yardline: 5 },
  { label: "2 Minute Drill", timeLeft: 120, noHuddle: true, yardline: 25 },
  { label: "4th Down", down: 4, ydstogo: 2, yardline: 50 }
];

const isHailMarySituation = (situation) => {
  return (
    situation.timeLeft < 30 && 
    situation.yardline > 50 && 
    situation.down === 4 && 
    situation.ydstogo >= 10 &&
    !situation.noHuddle // Assuming noHuddle means timeouts available
  );
};

const adjustForDesperation = (prediction, situation) => {
  if (isHailMarySituation(situation)) {
    return {
      ...prediction,
      playType: 'Hail Mary',
      formation: 'Shotgun',
      confidence: 95, // High confidence for clear Hail Mary situations
      suggestedPlay: 'Prevent' // Standard defense against Hail Mary
    };
  }
  return prediction;
};

// Helper functions
const predictBlitz = ({ down, ydstogo }) => down === 3 && ydstogo > 7 ? 0.75 : 0.35;

const suggestCounterPlay = (playType, situation, selectedUnit) => {
  if (selectedUnit === 'defense') {
    switch (playType) {
      case 'Blitz': return 'Screen Pass';
      case 'Cover 3': return 'Deep Post Route';
      case 'Man Press': return 'Slant';
      default: return 'Standard Play';
    }
  } else {
    switch (playType) {
      case 'Screen Pass': return 'Cover 2';
      case 'HB Dive': return 'Blitz';
      case 'Play Action': return 'Spy';
      default: return 'Base Defense';
    }
  }
};

const formatTime = (seconds) => {
  seconds = Math.max(0, Math.min(seconds, MAX_QUARTER_TIME));
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const TimeInput = ({ value, onChange }) => {
  const [inputValue, setInputValue] = useState(formatTime(value));

  const handleChange = (e) => {
    const value = e.target.value.replace(/[^0-9:]/g, '');
    let formatted = value.length > 2 && !value.includes(':') 
      ? `${value.slice(0, 2)}:${value.slice(2)}` 
      : value;
    formatted = formatted.slice(0, 5);
    
    setInputValue(formatted);
    if (formatted.includes(':') && formatted.length === 5) {
      onChange(parseTimeInput(formatted));
    }
  };

  const handleBlur = () => {
    const seconds = parseTimeInput(inputValue);
    setInputValue(formatTime(seconds));
    onChange(seconds);
  };

  return (
    <input
      type="text"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={(e) => e.target.select()}
      placeholder="MM:SS"
      className="time-input"
    />
  );
};

const parseTimeInput = (input) => {
  if (!input || input === ':') return 0;
  const [mins = 0, secs = 0] = input.split(':').map(Number);
  return Math.min(mins * 60 + secs, MAX_QUARTER_TIME);
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

  // Data loading
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const data = await loadNFLData();
        const teams = [...new Set(data.map(p => p.posteam).filter(Boolean))].sort();
        if (isMounted) setState(prev => ({ ...prev, allTeams: teams, isLoading: false, dataLoaded: true }));
      } catch (err) {
        if (isMounted) setState(prev => ({ ...prev, error: `Data load failed: ${err.message}`, isLoading: false }));
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (state.situation.yardline === 50) {
      setState(prev => ({
        ...prev,
        situation: {
          ...prev.situation,
          yardline: 50 // This ensures it's exactly 50
        }
      }));
    }
  }, [state.situation.yardline]);

  // Model training
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

    const labels = tf.tensor2d(
      filteredData.map(play => [
        (unit === 'defense' ? DEFENSIVE_PLAY_TYPES.indexOf(play.defensive_play_type) / DEFENSIVE_PLAY_TYPES.length 
          : ALL_OFFENSIVE_PLAYS.indexOf(play.play_type) / ALL_OFFENSIVE_PLAYS.length),
        (unit === 'offense' ? OFFENSIVE_FORMATIONS.indexOf(play.formation) / OFFENSIVE_FORMATIONS.length
          : DEFENSIVE_FORMATIONS.indexOf(play.formation) / DEFENSIVE_FORMATIONS.length),
        (play.yards_gained || 0) / 20,
        play.wp || 0.5
      ]),
      [filteredData.length, 4]
    );

    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [features[0].length] }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 4, activation: 'linear' }));

    model.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError' });
    await model.fit(tf.tensor2d(features), labels, { epochs: 15, batchSize: 32, validationSplit: 0.2, verbose: 0 });
    
    tf.dispose([labels]);
    return model;
  }, [state.selectedTeam]);

  // Prediction handler
  const handlePredict = async () => {
    if (!state.dataLoaded) {
      setState(prev => ({ ...prev, error: "Please wait for data to load" }));
      return;
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const model = await trainTeamModel(await loadNFLData(), state.selectedUnit);
      const prediction = await model.predict(tf.tensor2d([[
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
      ]])).array();
  
      const [playTypeBin, formationBin, yardsNorm, wp] = prediction[0];
      
      const playType = state.selectedUnit === 'offense'
        ? ALL_OFFENSIVE_PLAYS[Math.floor(playTypeBin * ALL_OFFENSIVE_PLAYS.length)] || 'Slant'
        : DEFENSIVE_PLAY_TYPES[Math.floor(playTypeBin * DEFENSIVE_PLAY_TYPES.length)] || 'Cover 2';
      
      const isPass = state.selectedUnit === 'offense' ? OFFENSIVE_PLAY_TYPES.PASS.includes(playType) : false;
      const playCategory = isPass ? 'Pass' : 'Run';
  
      const rawPrediction = {
        playType,
        playCategory,
        formation: state.selectedUnit === 'offense'
          ? OFFENSIVE_FORMATIONS[Math.floor(formationBin * OFFENSIVE_FORMATIONS.length)] || 'Shotgun'
          : DEFENSIVE_FORMATIONS[Math.floor(formationBin * DEFENSIVE_FORMATIONS.length)] || '4-3',
        expectedYards: Math.round(yardsNorm * 20),
        confidence: Math.round(Math.max(playTypeBin, 1-playTypeBin) * 100),
        winProbability: wp,
        blitzProbability: predictBlitz(state.situation),
        suggestedPlay: suggestCounterPlay(playType, state.situation, state.selectedUnit)
      };
  
      // Apply situational overrides (like Hail Mary)
      const finalPrediction = adjustForDesperation(rawPrediction, state.situation);
  
      setState(prev => ({
        ...prev,
        model,
        prediction: finalPrediction,
        isLoading: false,
        driveHistory: [
          ...prev.driveHistory.slice(-9),
          {
            down: prev.situation.down,
            distance: prev.situation.ydstogo,
            yardline: prev.situation.yardline,
            playType: finalPrediction.playType,
            playCategory: finalPrediction.playCategory,
            formation: finalPrediction.formation
          }
        ]
      }));
    } catch (err) {
      setState(prev => ({ ...prev, error: `Prediction failed: ${err.message}`, isLoading: false }));
    }
  };

  // Event handlers
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

  const handlePreset = (preset) => setState(prev => ({ ...prev, situation: { ...prev.situation, ...preset } }));
  const handleTeamChange = (e) => setState(prev => ({ ...prev, selectedTeam: e.target.value, prediction: null }));
  const handleUnitChange = (unit) => setState(prev => ({ ...prev, selectedUnit: unit, prediction: null }));

  return (
    <div className="predictor-app">
      <div className="predictor-header">
        <h2>NFL Play Predictor</h2>
        <div className="team-controls">
          <select value={state.selectedTeam} onChange={handleTeamChange} disabled={state.isLoading}>
            {state.allTeams.map(team => <option key={team} value={team}>{team}</option>)}
          </select>
          <div className="unit-selector">
            {['offense', 'defense'].map(unit => (
              <button
                key={unit}
                className={state.selectedUnit === unit ? 'active' : ''}
                onClick={() => handleUnitChange(unit)}
                disabled={state.isLoading}
              >
                {unit.charAt(0).toUpperCase() + unit.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="situation-panel">
        <div className="situation-header">
          <h3>Game Situation</h3>
          <div className="time-display">
            Q{state.situation.quarter} - {formatTime(state.situation.timeLeft)}
          </div>
        </div>

        <div className="situation-presets">
          {SITUATION_PRESETS.map((preset, i) => (
            <button key={i} className="preset-btn" onClick={() => handlePreset(preset)}>
              {preset.label}
            </button>
          ))}
        </div>

        <div className="situation-grid">
          <div className="input-group">
            <label>Down</label>
            <select name="down" value={state.situation.down} onChange={handleInputChange}>
              {[1, 2, 3, 4].map(num => <option key={num} value={num}>{num}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label>Distance (yards)</label>
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
            <div className="yardline-input-group">
              <input
                type="number"
                name="yardline"
                min="0"
                max="50"
                value={state.situation.yardline > 50 ? 100 - state.situation.yardline : state.situation.yardline}
                onChange={(e) => {
                  const yardline = parseInt(e.target.value) || 0;
                  const adjustedYardline = Math.min(50, Math.max(0, yardline));
                  setState(prev => ({
                    ...prev,
                    situation: {
                      ...prev.situation,
                      yardline: prev.situation.yardline > 50 
                        ? 100 - adjustedYardline
                        : adjustedYardline
                    }
                  }));
                }}
              />
              <select
                value={state.situation.yardline === 50 ? 'midfield' : 
                      state.situation.yardline <= 50 ? 'own' : 'opponent'}
                onChange={(e) => {
                  const currentYardline = state.situation.yardline > 50 
                    ? 100 - state.situation.yardline 
                    : state.situation.yardline;
                  
                  let newYardline;
                  if (e.target.value === 'midfield') {
                    newYardline = 50;
                  } else {
                    newYardline = e.target.value === 'own' 
                      ? currentYardline 
                      : 100 - currentYardline;
                  }

                  setState(prev => ({
                    ...prev,
                    situation: {
                      ...prev.situation,
                      yardline: newYardline
                    }
                  }));
                }}
              >
                <option value="own">Your Side</option>
                <option value="opponent">Opponent Side</option>
                <option value="midfield">Midfield</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>Quarter</label>
            <select name="quarter" value={state.situation.quarter} onChange={handleInputChange}>
              {[1, 2, 3, 4, 5].map(num => <option key={num} value={num}>Q{num}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label>Time Left</label>
            <TimeInput
              value={state.situation.timeLeft}
              onChange={(seconds) => setState(prev => ({
                ...prev,
                situation: { ...prev.situation, timeLeft: seconds }
              }))}
            />
          </div>

          <div className="input-group">
            <label>Score Differential</label>
            <input
              type="number"
              name="scoreDiff"
              min="-30"
              max="30"
              value={state.situation.scoreDiff}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="shotgun"
                checked={state.situation.shotgun}
                onChange={handleInputChange}
              />
              Shotgun Formation
            </label>
          </div>

          <div className="input-group checkbox-group">
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

      {state.error && <div className="error-banner">{state.error}</div>}

      {state.prediction && (
        <div className="results-panel">
          <div className="play-visualization">
            <TeamLogos team={state.selectedTeam} size={80} />
            {state.selectedUnit === 'offense' ? (
              <OffenseVisualization
                play={state.prediction.playType}
                playCategory={state.prediction.playCategory}
                formation={state.prediction.formation}
                yardline={state.situation.yardline}
              />
            ) : (
              <DefenseVisualization
                playType={state.prediction.playType}
                formation={state.prediction.formation}
              />
            )}
          </div>
          
          <div className="play-details">
            <div className="play-header">
              <h3>{state.prediction.playType}</h3>
              {state.selectedUnit === 'offense' && (
                <span className={`play-type-badge ${state.prediction.playCategory.toLowerCase()}`}>
                  {state.prediction.playCategory}
                </span>
              )}
              <span className="confidence-badge">{state.prediction.confidence}% confidence</span>
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <h4>Formation</h4>
                <p>{state.prediction.formation.replace(/_/g, ' ')}</p>
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