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
export function calculateStreak(tripsOrDates, baseDate = new Date()) {
  if (!Array.isArray(tripsOrDates) || tripsOrDates.length === 0) {
    return { current: 0, longest: 0, lastLogDate: null };
  }

  // Get unique YYYY-MM-DD strings
  const uniqueDates = new Set();
  tripsOrDates.forEach(item => {
    // Check if it's a trip object with timestamp or just a date
    const timestamp = item.timestamp ? item.timestamp : item;
    const dateStr = getLocalDateString(timestamp);
    if (dateStr) {
      uniqueDates.add(dateStr);
    }
  });

  if (uniqueDates.size === 0) {
    return { current: 0, longest: 0, lastLogDate: null };
  }

  const sortedDates = Array.from(uniqueDates).sort((a, b) => b.localeCompare(a));
  const lastLogDate = new Date(sortedDates[0] + 'T00:00:00');

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

  // Calculate current streak
  const hasTripToday = sortedDates.includes(todayStr);
  const hasTripYesterday = sortedDates.includes(yesterdayStr);

  let currentStreak = 0;
  if (hasTripToday || hasTripYesterday) {
    let checkDate = hasTripToday ? new Date(baseDate) : yesterday;
    while (true) {
      if (sortedDates.includes(formatDate(checkDate))) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  
  if (sortedDates.length > 0) {
    tempStreak = 1;
    longestStreak = 1;
    let prevDate = new Date(sortedDates[0] + 'T00:00:00');
    
    for (let i = 1; i < sortedDates.length; i++) {
      const currDate = new Date(sortedDates[i] + 'T00:00:00');
      const diffTime = Math.abs(prevDate - currDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 1;
      }
      prevDate = currDate;
    }
  }

  return {
    current: currentStreak,
    longest: longestStreak,
    lastLogDate: lastLogDate
  };
}
