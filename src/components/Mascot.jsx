import React from 'react';

export default function Mascot({ trips }) {
  // Simple logic to determine mascot state
  let mood = 'happy'; // default

  if (trips && trips.length > 0) {
    const recentEmissions = trips.slice(0, 5).map(t => t.co2Kg);
    const avg = recentEmissions.reduce((a, b) => a + b, 0) / recentEmissions.length;

    if (avg > 15) {
      mood = 'angry';
    } else if (avg > 5) {
      mood = 'sad';
    } else {
      mood = 'happy';
    }
  }

  return (
    <div className="mascot-container">
      <div className={`data-mascot mascot-${mood}`} aria-label={`Mascot is feeling ${mood}`}>
        <div className="mascot-core"></div>
        <div className="mascot-eye">
          <div className="mascot-data-line"></div>
        </div>
        <div className="mascot-antenna">
          <div className="mascot-leaf"></div>
        </div>
      </div>
    </div>
  );
}
