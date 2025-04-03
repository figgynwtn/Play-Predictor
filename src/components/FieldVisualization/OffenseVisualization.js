import React from 'react';
import './VisualizationBase.css';

export default function OffenseVisualization({ play, confidence, formation }) {
  const isPass = play.toLowerCase().includes('pass');
  
  // Yard numbers (10-50-40-10)
  const yardNumbers = [10, 20, 30, 40, 50, 40, 30, 20, 10];
  
  // Yard line positions (10-100)
  const yardLinePositions = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  
  // Hashmark positions (4 between each yard line)
  const hashMarkPositions = [
    2, 4, 6, 8, 12, 14, 16, 18, 22, 24, 26, 28, 32, 34, 36, 38,
    42, 44, 46, 48, 52, 54, 56, 58, 62, 64, 66, 68,
    72, 74, 76, 78, 82, 84, 86, 88, 92, 94, 96, 98
  ];

  return (
    <div className="visualization-container">
      <div className="football-field">
        {/* End Zones */}
        <div className="end-zone left">TOUCHDOWN</div>
        <div className="end-zone right">TOUCHDOWN</div>
        
        {/* 100-yard Field */}
        <div className="field-container">
          <div className="field-markings">
            {/* Sidelines */}
            <div className="sideline top"></div>
            <div className="sideline bottom"></div>
            
            {/* Yard Lines and Numbers */}
            {yardNumbers.map((number, i) => {
              const position = yardLinePositions[i];
              const digits = String(number).padStart(2, '0').split('');
              const isMobile = window.innerWidth < 768;
              
              return (
                <React.Fragment key={i}>
                  {/* Yard Line */}
                  <div 
                    className={`yard-line ${number === 50 ? 'yard-line-50' : ''}`}
                    style={{ 
                      left: `${position}%`,
                      transform: 'translateX(-50%)'
                    }}
                  />
                  
                  {/* Top Numbers */}
                  {isMobile ? (
                    <div 
                      className="yard-number top" 
                      style={{ 
                        left: `${position}%`,
                        transform: 'translateX(-50%)'
                      }}
                    >
                      {number}
                    </div>
                  ) : (
                    <>
                      <div 
                        className="yard-number top left-digit" 
                        style={{ 
                          left: `${position}%`,
                          transform: 'translateX(calc(-50% - 6px))'
                        }}
                      >
                        {digits[0]}
                      </div>
                      <div 
                        className="yard-number top right-digit" 
                        style={{ 
                          left: `${position}%`,
                          transform: 'translateX(calc(-50% + 6px))'
                        }}
                      >
                        {digits[1]}
                      </div>
                    </>
                  )}
                  
                  {/* Bottom Numbers */}
                  {isMobile ? (
                    <div 
                      className="yard-number bottom" 
                      style={{ 
                        left: `${position}%`,
                        transform: 'translateX(-50%)'
                      }}
                    >
                      {number}
                    </div>
                  ) : (
                    <>
                      <div 
                        className="yard-number bottom left-digit" 
                        style={{ 
                          left: `${position}%`,
                          transform: 'translateX(calc(-50% - 6px))'
                        }}
                      >
                        {digits[0]}
                      </div>
                      <div 
                        className="yard-number bottom right-digit" 
                        style={{ 
                          left: `${position}%`,
                          transform: 'translateX(calc(-50% + 6px))'
                        }}
                      >
                        {digits[1]}
                      </div>
                    </>
                  )}
                </React.Fragment>
              );
            })}
            
            {/* Hash Marks */}
            {hashMarkPositions.map((position, i) => (
              <React.Fragment key={i}>
                <div 
                  className="hash-mark top-hash" 
                  style={{ left: `${position}%` }}
                />
                <div 
                  className="hash-mark top-middle-hash" 
                  style={{ left: `${position}%` }}
                />
                <div 
                  className="hash-mark bottom-middle-hash" 
                  style={{ left: `${position}%` }}
                />
                <div 
                  className="hash-mark bottom-hash" 
                  style={{ left: `${position}%` }}
                />
              </React.Fragment>
            ))}
          </div>
          
          {/* Play Visualization */}
          <div className={`offense-play ${isPass ? 'pass' : 'run'}`}>
            <div className="football-confidence">{confidence}%</div>
          </div>
          
          {/* Play Indicator */}
          <div className="play-indicator" style={{ left: isPass ? '30%' : '70%' }}>
            <div className="play-name">{play}</div>
            <div className="coverage-type">{formation}</div>
          </div>
        </div>
      </div>
    </div>
  );
}