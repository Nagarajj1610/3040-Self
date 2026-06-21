import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, isFirebaseConfigured } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { ClipboardList, ChevronDown, ChevronUp, Loader2, Sparkles, Footprints } from 'lucide-react';

export default function HistoryPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  
  // Pagination states
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [expandedTripId, setExpandedTripId] = useState(null);

  // Mock pagination index tracker
  const [mockLimit, setMockLimit] = useState(20);

  // Fetch initial batch of trips
  const fetchTrips = async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      if (isFirebaseConfigured) {
        const q = query(
          collection(db, 'trips'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(20)
        );
        const querySnapshot = await getDocs(q);
        
        const fetchedTrips = [];
        querySnapshot.forEach((doc) => {
          fetchedTrips.push({ id: doc.id, ...doc.data() });
        });

        setTrips(fetchedTrips);
        
        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
        setLastDoc(lastVisible);
        
        // Check if there are potentially more docs by checking if we fetched exactly 20
        setHasMore(querySnapshot.docs.length === 20);
      } else {
        // Mock Mode pagination
        const allMockTrips = JSON.parse(localStorage.getItem('mock_firestore_trips') || '[]');
        const filtered = allMockTrips
          .filter(t => t.userId === user.uid)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setTrips(filtered.slice(0, 20));
        setHasMore(filtered.length > 20);
        setMockLimit(20);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Could not load history. Please check if Firestore indexes are ready.');
    } finally {
      setLoading(false);
    }
  };

  // Load more trips
  const loadMoreTrips = async () => {
    if (!user || loadingMore) return;
    setLoadingMore(true);
    setError('');

    try {
      if (isFirebaseConfigured && lastDoc) {
        const q = query(
          collection(db, 'trips'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc'),
          startAfter(lastDoc),
          limit(20)
        );
        const querySnapshot = await getDocs(q);

        const newTrips = [];
        querySnapshot.forEach((doc) => {
          newTrips.push({ id: doc.id, ...doc.data() });
        });

        setTrips((prev) => [...prev, ...newTrips]);

        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
        setLastDoc(lastVisible);
        setHasMore(querySnapshot.docs.length === 20);
      } else {
        // Mock Mode Load More
        const allMockTrips = JSON.parse(localStorage.getItem('mock_firestore_trips') || '[]');
        const filtered = allMockTrips
          .filter(t => t.userId === user.uid)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        const nextLimit = mockLimit + 20;
        setTrips(filtered.slice(0, nextLimit));
        setHasMore(filtered.length > nextLimit);
        setMockLimit(nextLimit);
      }
    } catch (err) {
      console.error('Error loading more history:', err);
      setError('Could not load more history.');
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [user]);

  // Expand / collapse card fact details
  const toggleExpand = (id) => {
    setExpandedTripId(expandedTripId === id ? null : id);
  };

  // Format date helper
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    let d;
    if (typeof timestamp.toDate === 'function') {
      d = timestamp.toDate();
    } else {
      d = new Date(timestamp);
    }
    return d.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getModeEmoji = (mode) => {
    switch (mode) {
      case 'car': return '🚗';
      case 'bus': return '🚌';
      case 'train': return '🚆';
      case 'flight': return '✈️';
      case 'bike': return '🚲';
      case 'walk': return '🚶';
      default: return '✈️';
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-family-heading)' }}>
          <ClipboardList size={24} color="var(--color-primary)" />
          <span>Travel History</span>
        </h2>

        {error && (
          <div className="badge badge-danger" style={{ display: 'block', padding: '0.75rem', marginBottom: '1rem', width: '100%', borderRadius: 'var(--radius-sm)' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem 0' }}>
            <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
            <span style={{ marginLeft: '10px', color: 'var(--text-secondary)' }}>Loading trip history...</span>
          </div>
        ) : trips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 'var(--radius-md)' }}>
            <Footprints size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>No trips logged yet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Your logged travels will show up here. Head over to the home page to log your first journey!
            </p>
          </div>
        ) : (
          <div>
            <div className="table-container">
              <table className="responsive-table" aria-label="Travel history entries">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Mode</th>
                    <th>Distance</th>
                    <th>CO₂ Impact</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((trip) => (
                    <React.Fragment key={trip.id}>
                      <tr 
                        onClick={() => toggleExpand(trip.id)} 
                        style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                        className={expandedTripId === trip.id ? 'active-row' : ''}
                      >
                        <td style={{ fontSize: '0.9rem' }}>{formatDate(trip.timestamp)}</td>
                        <td>{trip.from}</td>
                        <td>{trip.to}</td>
                        <td style={{ fontSize: '1.1rem' }}>
                          <span title={trip.mode}>{getModeEmoji(trip.mode)}</span>
                        </td>
                        <td>{trip.distanceKm} km</td>
                        <td>
                          <span className={`badge ${
                            trip.co2Kg < 1 ? 'badge-success' : trip.co2Kg <= 5 ? 'badge-warning' : 'badge-danger'
                          }`}>
                            {trip.co2Kg} kg
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px' }}
                            aria-label={expandedTripId === trip.id ? "Hide details" : "Show details"}
                          >
                            {expandedTripId === trip.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>
                      </tr>
                      {expandedTripId === trip.id && (
                        <tr>
                          <td colSpan="7" style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.25rem' }}>
                            <div style={{ padding: '0.5rem 1rem' }}>
                              <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a78bfa', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                <Sparkles size={14} />
                                <span>Gemini Fact Card</span>
                              </h4>
                              <p style={{ fontSize: '0.95rem', lineHeight: '1.5', color: '#cbd5e1' }}>
                                {trip.factCard || 'Generating fact card details...'}
                              </p>
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
                <button 
                  onClick={loadMoreTrips} 
                  className="btn btn-secondary"
                  disabled={loadingMore}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {loadingMore && <Loader2 className="animate-spin" size={16} />}
                  <span>{loadingMore ? 'Loading more...' : 'Load More'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
