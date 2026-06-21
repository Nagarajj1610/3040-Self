import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { calculateCO2 } from '../utils/carbonMath';
import { generateGeminiFact } from '../utils/gemini';
import Mascot from '../components/Mascot';
import GeminiFactCard from '../components/GeminiFactCard';
import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { Send, MapPin, Navigation, Car, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

export default function LogTripPage() {
  const { user, profile } = useAuth();
  
  // Form states
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [mode, setMode] = useState('car');
  const [distance, setDistance] = useState('');

  // Status states
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [successTrip, setSuccessTrip] = useState(null);

  // User's recent trips (for Mascot mood calculation)
  const [recentTrips, setRecentTrips] = useState([]);
  const [fetchError, setFetchError] = useState('');

  // Fetch recent trips to update mascot mood
  const fetchRecentTrips = async () => {
    if (!user) return;
    try {
      if (isFirebaseConfigured) {
        const q = query(
          collection(db, 'trips'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(5)
        );
        const querySnapshot = await getDocs(q);
        const trips = [];
        querySnapshot.forEach((doc) => {
          trips.push({ id: doc.id, ...doc.data() });
        });
        setRecentTrips(trips);
      } else {
        // Mock Mode fetch
        const allMockTrips = JSON.parse(localStorage.getItem('mock_firestore_trips') || '[]');
        const filtered = allMockTrips
          .filter(t => t.userId === user.uid)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 5);
        setRecentTrips(filtered);
      }
    } catch (err) {
      console.error('Error fetching recent trips for mascot:', err);
      // If index is missing, Firestore returns a link in the error message
      setFetchError(err.message);
    }
  };

  useEffect(() => {
    fetchRecentTrips();
  }, [user]);

  // Handle trip submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessTrip(null);

    // Client-side validation before any network request or write
    if (!from.trim()) {
      setFormError('Please enter a starting location.');
      return;
    }
    if (!to.trim()) {
      setFormError('Please enter a destination.');
      return;
    }
    const distNum = parseFloat(distance);
    if (isNaN(distNum) || distNum <= 0) {
      setFormError('Please enter a valid positive distance in km.');
      return;
    }

    setLoading(true);

    try {
      // 1. Calculate carbon footprint synchronously (pure function)
      const co2 = calculateCO2(mode, distNum);

      // 2. Generate Gemini Fact Card client-side
      const fact = await generateGeminiFact(mode, distNum, co2, profile.persona);

      // 3. Prepare trip record
      const tripData = {
        userId: user.uid,
        from: from.trim(),
        to: to.trim(),
        mode,
        distanceKm: distNum,
        co2Kg: co2,
        factCard: fact,
        timestamp: isFirebaseConfigured ? Timestamp.now() : new Date().toISOString()
      };

      // 4. Save to Firestore / LocalStorage
      if (isFirebaseConfigured) {
        await addDoc(collection(db, 'trips'), tripData);
      } else {
        // Mock Firestore write
        const allMockTrips = JSON.parse(localStorage.getItem('mock_firestore_trips') || '[]');
        const newTrip = { id: `mock-trip-${Date.now()}`, ...tripData };
        allMockTrips.push(newTrip);
        localStorage.setItem('mock_firestore_trips', JSON.stringify(allMockTrips));
      }

      // 5. Success state
      setSuccessTrip({
        from: from.trim(),
        to: to.trim(),
        mode,
        distanceKm: distNum,
        co2Kg: co2,
        factCard: fact
      });

      // Clear form inputs
      setFrom('');
      setTo('');
      setDistance('');
      setMode('car');

      // Refresh recent trips to update Mascot mood
      await fetchRecentTrips();

    } catch (err) {
      console.error('Error logging trip:', err);
      setFormError(err.message || 'An error occurred while logging the trip.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-grid">
      
      {/* Left side: Log Trip Form */}
      <div>
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-family-heading)' }}>
            <Navigation size={24} color="var(--color-primary)" />
            <span>Log Your Travel</span>
          </h2>

          {formError && (
            <div className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem', marginBottom: '1rem', width: '100%', borderRadius: 'var(--radius-sm)' }}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            
            <div className="form-group">
              <label className="form-label" htmlFor="from-input">From (Starting Location)</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  id="from-input"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                  placeholder="e.g. London Office"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  disabled={loading}
                  aria-describedby={formError ? "form-error-msg" : undefined}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="to-input">To (Destination)</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  id="to-input"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                  placeholder="e.g. Piccadilly Circus"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="mode-select">Transport Mode</label>
                <select
                  id="mode-select"
                  className="form-input"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  disabled={loading}
                  style={{ background: 'var(--input-bg)', width: '100%' }}
                >
                  <option value="car">🚗 Car</option>
                  <option value="bus">🚌 Bus</option>
                  <option value="train">🚆 Train</option>
                  <option value="flight">✈️ Flight</option>
                  <option value="bike">🚲 Bicycle</option>
                  <option value="walk">🚶 Walk</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="distance-input">Distance (km)</label>
                <input
                  id="distance-input"
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="e.g. 15.5"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  disabled={loading}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={loading}
              style={{ marginTop: '1rem' }}
            >
              <Send size={16} />
              {loading ? 'Logging Trip & Generating Fact Card...' : 'Log Trip'}
            </button>
          </form>
        </div>

        {/* Success notification banner & Fact Card */}
        {successTrip && (
          <div className="card card-success" style={{ animation: 'float-calm 3s ease-in-out infinite' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)', marginBottom: '0.75rem' }}>
              <CheckCircle size={20} />
              <h3 style={{ fontSize: '1.2rem' }}>Trip Logged Successfully!</h3>
            </div>
            
            <p style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>
              You traveled <strong>{successTrip.distanceKm} km</strong> from <strong>{successTrip.from}</strong> to <strong>{successTrip.to}</strong> by <strong>{successTrip.mode}</strong>.
            </p>

            <div className="stats-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: '1fr' }}>
              <div className="stat-item" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                <div className="stat-value" style={{ color: 'var(--color-success)' }}>{successTrip.co2Kg} kg</div>
                <div className="stat-label">Estimated Carbon Impact</div>
              </div>
            </div>

            <GeminiFactCard fact={successTrip.factCard} />
          </div>
        )}
      </div>

      {/* Right side: Companion Mascot */}
      <div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: '0.5rem', fontFamily: 'var(--font-family-heading)' }}>Your Carbon Companion</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Its mood reacts to the rolling average of your last 5 trips. Keep it happy by choosing low-carbon travel!
          </p>
          
          <Mascot trips={recentTrips} />

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {recentTrips.length < 3 ? (
              <span>Log at least <strong>{3 - recentTrips.length} more</strong> trips to calibrate your companion's mood. Currently showing neutral.</span>
            ) : (
              <span>Calibrated on your last <strong>{recentTrips.length}</strong> logged trips. Great work keeping track!</span>
            )}
          </div>
          
          {fetchError && (
            <p style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '0.5rem' }}>
              Warning: Could not fetch Firestore index (sorting will rely on LocalStorage / local caching).
            </p>
          )}
        </div>
      </div>

    </div>
  );
}
