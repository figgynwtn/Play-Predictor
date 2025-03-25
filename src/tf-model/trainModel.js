// src/tf-model/trainModel.js
import * as tf from '@tensorflow/tfjs';

export async function createAndTrainModel(data) {
  try {
    // 1. Prepare features
    const features = data.map(play => [
      play.down,
      play.ydstogo,
      play.yardline_100,
      play.score_differential,
      play.qtr,
      play.game_seconds_remaining,
      play.wp || 0.5,  // Default win probability
      play.shotgun ? 1 : 0,
      play.no_huddle ? 1 : 0
    ]);

    // 2. Prepare labels
    const playTypes = [...new Set(data.map(p => p.play_type))];
    const labelIndices = data.map(play => playTypes.indexOf(play.play_type));

    // 3. Create tensors with explicit shapes
    const featureTensor = tf.tensor2d(features, [features.length, features[0].length]);
    const labelTensor = tf.oneHot(
      tf.tensor1d(labelIndices, 'int32'),
      playTypes.length
    );

    // 4. Model architecture
    const model = tf.sequential();
    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
      inputShape: [features[0].length]
    }));
    model.add(tf.layers.dense({
      units: playTypes.length,
      activation: 'softmax'
    }));

    // 5. Train
    await model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    await model.fit(featureTensor, labelTensor, {
      epochs: 15,
      batchSize: 64,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}`);
        }
      }
    });

    return { model, playTypes };
  } catch (error) {
    console.error('Model training failed:', error);
    throw error;
  }
}