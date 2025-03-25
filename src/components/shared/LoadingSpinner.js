import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 20 }) => (
  <div 
    className="loading-spinner"
    style={{ 
      width: size, 
      height: size,
      borderWidth: size / 5
    }}
  />
);

export default LoadingSpinner;