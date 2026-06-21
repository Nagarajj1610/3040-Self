import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { calculateCO2 } from '../utils/carbonMath';
import { generateGeminiFact } from '../utils/gemini';
import Mascot from '../components/Mascot';
import GeminiFactCard from '../components/GeminiFactCard';
import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function LogTripPage() {
  const { user, profile } = useAuth();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [mode, setMode] = useState('car');
  const [distance, setDistance] = useState('');

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [successTrip, setSuccessTrip] = useState(null);

  // Gemini fact card states
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiFact, setGeminiFact] = useState('');
  const [geminiError, setGeminiError] = useState('');

  const [recentTrips, setRecentTrips] = useState([]);

  const fetchRecentTrips = async () => {
    if (!user) return;
    try {
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
    } catch (err) {
      console.error('Error fetching recent trips:', err);
    }
  };

  useEffect(() => {
    fetchRecentTrips();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessTrip(null);
    setGeminiFact('');
    setGeminiError('');

    if (!from.trim()) { setFormError('Please enter a starting location.'); return; }
    if (!to.trim()) { setFormError('Please enter a destination.'); return; }
    const distNum = parseFloat(distance);
    if (isNaN(distNum) || distNum <= 0) { setFormError('Please enter a valid positive distance in km.'); return; }

    setLoading(true);
    setGeminiLoading(true);

    try {
      const co2 = calculateCO2(mode, distNum);

      // Generate Gemini Fact — show loading state visibly
      let fact = '';
      try {
        fact = await generateGeminiFact(mode, distNum, co2, profile?.persona || 'friend');
        setGeminiFact(fact);
      } catch (gemErr) {
        console.error('Gemini error:', gemErr);
        setGeminiError('Could not generate AI fact card. Trip was still saved.');
        fact = '';
      } finally {
        setGeminiLoading(false);
      }

      const tripData = {
        userId: user.uid,
        from: from.trim(),
        to: to.trim(),
        mode,
        distanceKm: distNum,
        co2Kg: co2,
        factCard: fact,
        timestamp: Timestamp.now()
      };

      await addDoc(collection(db, 'trips'), tripData);

      setSuccessTrip({
        from: from.trim(),
        to: to.trim(),
        mode,
        distanceKm: distNum,
        co2Kg: co2,
        factCard: fact
      });

      setFrom('');
      setTo('');
      setDistance('');
      setMode('car');
      await fetchRecentTrips();

    } catch (err) {
      console.error('Error logging trip:', err);
      setFormError(err.message || 'An error occurred while logging the trip.');
      setGeminiLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const getModeLabel = (m) => {
    const labels = { car: '🚗 Car', bus: '🚌 Bus', train: '🚆 Train', flight: '✈️ Flight', bike: '🚲 Bicycle', walk: '🚶 Walk' };
    return labels[m] || m;
  };

  return (
    <div className="dashboard-grid">
      {/* Main column: Log Trip Form + Result */}
      <div className="main-column">
        <div className="card card-primary">
          <h2 className="card-title">
            <span className="card-icon">📝</span>
            Log Your Travel
          </h2>

          {formError && (
            <div className="alert alert-error">{formError}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="from-input">From</label>
              <input id="from-input" type="text" className="form-input" placeholder="e.g. Home" value={from} onChange={(e) => setFrom(e.target.value)} disabled={loading} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="to-input">To</label>
              <input id="to-input" type="text" className="form-input" placeholder="e.g. Office" value={to} onChange={(e) => setTo(e.target.value)} disabled={loading} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="mode-select">Transport</label>
                <select id="mode-select" className="form-input" value={mode} onChange={(e) => setMode(e.target.value)} disabled={loading}>
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
                <input id="distance-input" type="number" step="any" className="form-input" placeholder="15.5" value={distance} onChange={(e) => setDistance(e.target.value)} disabled={loading} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Logging Trip & Generating Fact...' : 'Log Trip'}
            </button>
          </form>
        </div>

        {/* GEMINI FACT CARD — prominently visible after every trip */}
        {geminiLoading && (
          <div className="card gemini-card">
            <div className="gemini-header">
              <span className="gemini-sparkle">✨</span>
              <span className="gemini-title">Powered by Gemini</span>
            </div>
            <div className="gemini-loading">
              <div className="gemini-spinner"></div>
              <p>Generating your personalized eco-fact...</p>
            </div>
          </div>
        )}

        {geminiError && !geminiFact && (
          <div className="card gemini-card gemini-card-error">
            <div className="gemini-header">
              <span className="gemini-sparkle">✨</span>
              <span className="gemini-title">Powered by Gemini</span>
            </div>
            <p className="gemini-error-text">{geminiError}</p>
          </div>
        )}

        {successTrip && (
          <div className="card card-success">
            <div className="success-header">
              <span>✅</span>
              <h3>Trip Logged!</h3>
            </div>
            <p className="success-summary">
              <strong>{successTrip.distanceKm} km</strong> from {successTrip.from} → {successTrip.to} by {getModeLabel(successTrip.mode)}
            </p>
            <div className="carbon-result">
              <div className="carbon-value">{successTrip.co2Kg} kg</div>
              <div className="carbon-label">CO₂ emitted</div>
            </div>

            {/* Gemini Fact Card — always visible post-trip */}
            {successTrip.factCard && (
              <div className="gemini-card-inline">
                <div className="gemini-header">
                  <span className="gemini-sparkle">✨</span>
                  <span className="gemini-title">Powered by Gemini</span>
                </div>
                <p className="gemini-body">{successTrip.factCard}</p>
              </div>
            )}

            {!successTrip.factCard && !geminiLoading && (
              <div className="gemini-card-inline gemini-card-fallback">
                <div className="gemini-header">
                  <span className="gemini-sparkle">✨</span>
                  <span className="gemini-title">Powered by Gemini</span>
                </div>
                <p className="gemini-body">Fact card unavailable — configure your Gemini API key in .env to see AI-generated eco-facts here.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar: Companion Mascot */}
      <div className="side-column">
        <div className="card card-companion">
          <h3 className="card-title card-title-sm">Your Carbon Companion</h3>
          <p className="companion-desc">
            Its mood reflects your last 5 trips. Low-carbon choices make it thrive!
          </p>
          <Mascot trips={recentTrips} />
          <div className="companion-status">
            {recentTrips.length < 3 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🌱</div>
                <p>Log <strong>{3 - recentTrips.length} more</strong> trip{3 - recentTrips.length > 1 ? 's' : ''} to calibrate your companion's mood.</p>
              </div>
            ) : (
              <p>Based on your last <strong>{recentTrips.length}</strong> trips.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
