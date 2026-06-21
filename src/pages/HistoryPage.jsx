import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';

export default function HistoryPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [expandedTripId, setExpandedTripId] = useState(null);

  const fetchTrips = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const q = query(
        collection(db, 'trips'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const fetchedTrips = [];
      querySnapshot.forEach((doc) => { fetchedTrips.push({ id: doc.id, ...doc.data() }); });
      
      // Client-side sort to completely avoid Firestore index requirements!
      fetchedTrips.sort((a, b) => {
        const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : new Date(a.timestamp).getTime();
        const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : new Date(b.timestamp).getTime();
        return timeB - timeA;
      });

      setTrips(fetchedTrips);
      setHasMore(false); // Disable pagination since we loaded all trips
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Could not load history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreTrips = async () => {
    // Pagination disabled in favor of fetching all and client-side sorting to bypass indexes.
  };

  useEffect(() => { fetchTrips(); }, [user]);

  const toggleExpand = (id) => setExpandedTripId(expandedTripId === id ? null : id);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const d = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getModeEmoji = (mode) => {
    const map = { car: '🚗', bus: '🚌', train: '🚆', flight: '✈️', bike: '🚲', walk: '🚶' };
    return map[mode] || '🚗';
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div className="card">
        <h2 className="card-title">
          <span className="card-icon">📋</span>
          Travel History
        </h2>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading-state">
            <div className="gemini-spinner"></div>
            <span>Loading trip history...</span>
          </div>
        ) : trips.length === 0 ? (
          <div className="empty-state-large">
            <div className="empty-state-icon-lg">🗺️</div>
            <h3>No trips logged yet</h3>
            <p>Your logged travels will appear here. Head to Log Trip to record your first journey!</p>
          </div>
        ) : (
          <div>
            <div className="table-container">
              <table className="responsive-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Mode</th>
                    <th>Distance</th>
                    <th>CO₂</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((trip) => (
                    <React.Fragment key={trip.id}>
                      <tr onClick={() => toggleExpand(trip.id)} style={{ cursor: 'pointer' }}>
                        <td>{formatDate(trip.timestamp)}</td>
                        <td>{trip.from}</td>
                        <td>{trip.to}</td>
                        <td title={trip.mode}>{getModeEmoji(trip.mode)}</td>
                        <td>{trip.distanceKm} km</td>
                        <td>
                          <span className={`badge ${trip.co2Kg < 1 ? 'badge-success' : trip.co2Kg <= 5 ? 'badge-warning' : 'badge-danger'}`}>
                            {trip.co2Kg} kg
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-sm" aria-label={expandedTripId === trip.id ? "Hide" : "Show"}>
                            {expandedTripId === trip.id ? '▲' : '▼'}
                          </button>
                        </td>
                      </tr>
                      {expandedTripId === trip.id && (
                        <tr>
                          <td colSpan="7" className="expanded-row">
                            <div className="gemini-card-inline">
                              <div className="gemini-header">
                                <span className="gemini-sparkle">✨</span>
                                <span className="gemini-title">Powered by Gemini</span>
                              </div>
                              <p className="gemini-body">{trip.factCard || 'No fact card available for this trip.'}</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {hasMore && (
              <div className="pagination-container">
                <button onClick={loadMoreTrips} className="btn btn-secondary" disabled={loadingMore}>
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
