/**
 * Carbon Footprint Calculation Module
 * 
 * Sourced average coefficients (kg CO2e per km):
 * - Car (Average Petrol/Diesel Passenger Car): ~0.17 - 0.21 kg/km (Source: UK Government GHG Conversion Factors 2025/2026)
 * - Bus (Average Local Bus): ~0.10 kg/km (Source: UK Government GHG Conversion Factors 2025/2026)
 * - Train (National Rail): ~0.04 kg/km (Source: UK Government GHG Conversion Factors 2025/2026)
 * - Flight (Average Domestic / Short Haul Flight): ~0.25 kg/km (Source: UK Government GHG Conversion Factors 2025/2026)
 * - Bike / Walk: 0.00 kg/km (Zero direct tailpipe emissions)
 */

export const CARBON_COEFFICIENTS = {
  car: 0.21,
  bus: 0.10,
  train: 0.04,
  bike: 0.00,
  walk: 0.00,
  flight: 0.25,
};

/**
 * Calculates the CO2 emissions in kg for a given mode of transport and distance.
 * 
 * @param {string} mode - The mode of transport (car, bus, train, bike, walk, flight)
 * @param {number} distanceKm - The distance traveled in kilometers
 * @returns {number} The calculated CO2 emissions in kg, rounded to 2 decimal places
 */
export function calculateCO2(mode, distanceKm) {
  if (typeof distanceKm !== 'number' || isNaN(distanceKm) || distanceKm < 0) {
    return 0;
  }

  const normalizedMode = (mode || '').toLowerCase().trim();
  const coefficient = CARBON_COEFFICIENTS[normalizedMode];

  if (coefficient === undefined) {
    return 0;
  }

  const co2 = distanceKm * coefficient;
  return Math.round(co2 * 100) / 100;
}
