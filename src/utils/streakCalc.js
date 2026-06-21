/**
 * Helper to convert a timestamp/Date into a local YYYY-MM-DD string.
 */
export function getLocalDateString(timestamp) {
  if (!timestamp) return null;
  
  let date;
  if (typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'number' || typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else if (timestamp.seconds !== undefined) { // Firestore fallback for serialized timestamps
    date = new Date(timestamp.seconds * 1000);
  } else {
    return null;
  }

  if (isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the current consecutive days streak of logged trips.
 * A streak is active if there is at least one trip logged today or yesterday.
 * 
 * @param {Array} trips - List of trip objects, each containing a timestamp
 * @param {Date} [baseDate] - Optional base date (defaults to current system date) to make testing pure
 * @returns {number} The current streak count in days
 */
export function calculateStreak(trips, baseDate = new Date()) {
  if (!Array.isArray(trips) || trips.length === 0) {
    return 0;
  }

  // Get unique YYYY-MM-DD strings for all trips
  const uniqueDates = new Set();
  trips.forEach(trip => {
    const dateStr = getLocalDateString(trip.timestamp);
    if (dateStr) {
      uniqueDates.add(dateStr);
    }
  });

  if (uniqueDates.size === 0) {
    return 0;
  }

  // Convert Set to sorted Array descending (most recent first)
  const sortedDates = Array.from(uniqueDates).sort((a, b) => b.localeCompare(a));

  // Determine "today" and "yesterday" relative to baseDate
  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatDate(baseDate);
  
  const yesterday = new Date(baseDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  // Check if the user logged a trip today or yesterday
  const hasTripToday = sortedDates.includes(todayStr);
  const hasTripYesterday = sortedDates.includes(yesterdayStr);

  if (!hasTripToday && !hasTripYesterday) {
    return 0;
  }

  // The streak starts from either today (if logged today) or yesterday (if logged yesterday but not today)
  let checkDate = hasTripToday ? new Date(baseDate) : yesterday;
  let streak = 0;

  while (true) {
    const checkDateStr = formatDate(checkDate);
    if (sortedDates.includes(checkDateStr)) {
      streak++;
      // Move to the previous day
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
