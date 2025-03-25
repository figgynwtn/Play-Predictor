import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

// Mock all child components
jest.mock('./components/Predictor/Predictor', () => () => (
  <div data-testid="mocked-predictor">Predictor</div>
));

jest.mock('./components/ErrorBoundary/ErrorBoundary', () => ({ children }) => (
  <div data-testid="mocked-error-boundary">{children}</div>
));

jest.mock('./components/BasicPredictor/BasicPredictor', () => () => (
  <div data-testid="mocked-basic-predictor">BasicPredictor</div>
));

test('renders without crashing', () => {
  render(<App />);
});

test('renders the predictor inside error boundary', () => {
  const { getByTestId } = render(<App />);
  expect(getByTestId('mocked-error-boundary')).toBeInTheDocument();
  expect(getByTestId('mocked-predictor')).toBeInTheDocument();
});