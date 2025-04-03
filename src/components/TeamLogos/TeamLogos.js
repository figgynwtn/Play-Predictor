import React from 'react';
import './TeamLogos.css';

export default function TeamLogos({ team, size = 80 }) {
  return (
    <div className="team-logo" style={{ width: size, height: size }}>
      <img 
        src={`/team-logos/${team}.png`} 
        alt={`${team} logo`}
        onError={(e) => {
          e.target.src = '/team-logos/default.png';
        }}
      />
    </div>
  );
}