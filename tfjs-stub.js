module.exports = {
    sequential: () => ({
      add: jest.fn(),
      compile: jest.fn(),
      fit: jest.fn(),
      predict: jest.fn()
    }),
    tensor2d: jest.fn(),
    tensor1d: jest.fn(),
    layers: {
      dense: jest.fn()
    },
    train: {
      adam: jest.fn()
    }
  };