import React from 'react';

/**
 * Pure function to map the rolling average carbon score to a mood class and description.
 * - Under 3 trips: Neutral (needs more data)
 * - Average < 1.0 kg CO2: Thriving
 * - Average 1.0 to 5.0 kg CO2: Neutral
 * - Average > 5.0 kg CO2: Struggling
 * 
 * @param {Array} trips - Last 5 trips
 * @returns {Object} { className: string, description: string }
 */
export function getMascotMood(trips) {
  const neutralState = { 
    className: 'mascot-neutral', 
    description: 'Your mascot is feeling neutral. Keep tracking to help it thrive!' 
  };

  if (!Array.isArray(trips) || trips.length < 3) {
    return neutralState;
  }

  // Calculate average of the last 5 trips (or all trips if less than 5 but >= 3)
  const lastTrips = trips.slice(0, 5);
  const totalCO2 = lastTrips.reduce((sum, t) => sum + (Number(t.co2Kg) || 0), 0);
  const averageCO2 = totalCO2 / lastTrips.length;

  if (averageCO2 < 1.0) {
    return {
      className: 'mascot-thriving',
      description: `Your mascot is thriving (average CO2: ${averageCO2.toFixed(2)} kg)! Your low-carbon habits are making a huge difference.`
    };
  } else if (averageCO2 <= 5.0) {
    return neutralState;
  } else {
    return {
      className: 'mascot-struggling',
      description: `Your mascot is struggling (average CO2: ${averageCO2.toFixed(2)} kg). Try switching to public transport, walking, or cycling.`
    };
  }
}

export default function Mascot({ trips = [] }) {
  const { className, description } = getMascotMood(trips);

  return (
    <div className="mascot-container">
      <div 
        className={`mascot-body ${className}`}
        aria-label={description}
        role="img"
      >
        <div className="mascot-face">
          <div className="mascot-eyes">
            <div className="mascot-eye" />
            <div className="mascot-eye" />
          </div>
          <div className="mascot-mouth" />
        </div>
      </div>
      <div className="mascot-glow" />
    </div>
  );
}
