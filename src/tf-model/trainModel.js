import * as tf from '@tensorflow/tfjs';

// Play type constants
const OFFENSIVE_PLAY_TYPES = {
  PASS: [
    'Slant', 
    'Out Route', 
    'Post Route', 
    'Screen Pass',
    'Deep Pass',
    'Play Action'
  ],
  RUN: [
    'HB Dive', 
    'Outside Zone',
    'Draw Play',
    'Counter',
    'Power Run'
  ]
};

const OFFENSIVE_FORMATIONS = ['Shotgun', 'Under Center', 'Pistol', 'I Formation', 'Empty'];

export const createModel = (inputShape) => {
  const model = tf.sequential();
  model.add(tf.layers.dense({
    units: 64,
    activation: 'relu',
    inputShape: [inputShape]
  }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(tf.layers.dense({ 
    units: 4,  // [isPass, playType, formation, yards]
    activation: 'linear' 
  }));
  return model;
};

export const trainModel = async (model, features, labels, unit) => {
  // Process labels based on unit type
  const processedLabels = unit === 'offense' 
    ? labels.map(play => {
        const isPass = OFFENSIVE_PLAY_TYPES.PASS.includes(play.play_type) ? 1 : 0;
        const playTypes = isPass ? OFFENSIVE_PLAY_TYPES.PASS : OFFENSIVE_PLAY_TYPES.RUN;
        const formationIndex = OFFENSIVE_FORMATIONS.indexOf(play.formation);
        
        return [
          isPass,
          playTypes.indexOf(play.play_type) / playTypes.length,
          formationIndex >= 0 ? formationIndex / OFFENSIVE_FORMATIONS.length : 0,
          (play.yards_gained || 0) / 20
        ];
      })
    : labels;

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError'
  });

  await model.fit(
    tf.tensor2d(features), 
    tf.tensor2d(processedLabels),
    {
      epochs: 15,
      batchSize: 32,
      validationSplit: 0.2,
      verbose: 0
    }
  );
};

export const processPrediction = (prediction, unit) => {
  if (unit === 'offense') {
    const [isPass, playTypeBin, formationBin, yardsNorm] = prediction;
    const playTypes = isPass > 0.5 ? OFFENSIVE_PLAY_TYPES.PASS : OFFENSIVE_PLAY_TYPES.RUN;
    const playType = playTypes[Math.floor(playTypeBin * playTypes.length)] || playTypes[0];
    const formation = OFFENSIVE_FORMATIONS[Math.floor(formationBin * OFFENSIVE_FORMATIONS.length)] || 'Shotgun';
    
    return {
      isPass: isPass > 0.5,
      playType,
      formation,
      expectedYards: Math.round(yardsNorm * 20),
      playTypeConfidence: Math.round(Math.max(isPass, 1-isPass) * 100),
      specificPlayConfidence: Math.round(playTypeBin * 100)
    };
  }
  
  // Default return for defense
  return {
    playType: '',
    formation: '',
    expectedYards: 0,
    confidence: 0
  };
};