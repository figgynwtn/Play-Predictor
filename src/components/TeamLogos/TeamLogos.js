import React from 'react';
import './TeamLogos.css';

const TeamLogos = ({ offense, defense }) => (
  <div className="team-logos-container">
    <div className="team-logo-wrapper">
      <img 
        src={`/logos/${offense}.png`} 
        alt={`${offense} logo`}
        className="team-logo offense"
      />
      <span className="team-label">OFFENSE</span>
    </div>
    
    <div className="vs-circle">VS</div>
    
    <div className="team-logo-wrapper">
      <img 
        src={`/logos/${defense}.png`} 
        alt={`${defense} logo`}
        className="team-logo defense" 
      />
      <span className="team-label">DEFENSE</span>
    </div>
  </div>
);

export default TeamLogos;