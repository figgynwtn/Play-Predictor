import * as tf from '@tensorflow/tfjs';

export const createModel = (inputShape) => {
  const model = tf.sequential();
  model.add(tf.layers.dense({
    units: 64,
    activation: 'relu',
    inputShape: [inputShape]
  }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 4, activation: 'linear' }));
  return model;
};

export const trainModel = async (model, features, labels) => {
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError'
  });

  await model.fit(
    tf.tensor2d(features), 
    tf.tensor2d(labels),
    {
      epochs: 15,
      batchSize: 32,
      validationSplit: 0.2,
      verbose: 0
    }
  );
};