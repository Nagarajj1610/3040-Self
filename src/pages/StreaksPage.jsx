import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { calculateStreak } from '../utils/streakCalc';
import { CARBON_COEFFICIENTS } from '../utils/carbonMath';
import { db, isFirebaseConfigured } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Award, Flame, Calendar, Trash2, ShieldAlert, Footprints, Loader2, Leaf } from 'lucide-react';

export default function StreaksPage() {
  const { user, profile } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAllTrips = async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      if (isFirebaseConfigured) {
        const q = query(
          collection(db, 'trips'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetchedTrips = [];
        querySnapshot.forEach((doc) => {
          fetchedTrips.push({ id: doc.id, ...doc.data() });
        });
        setTrips(fetchedTrips);
      } else {
        const allMockTrips = JSON.parse(localStorage.getItem('mock_firestore_trips') || '[]');
        const filtered = allMockTrips
          .filter(t => t.userId === user.uid)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setTrips(filtered);
      }
    } catch (err) {
      console.error('Error fetching trips for streaks:', err);
      setError('Could not calculate stats. Firestore indexes might be building.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTrips();
  }, [user]);

  // Calculations
  const streakCount = calculateStreak(trips);

  // Calculate carbon saved:
  // For every trip by bus/train/bike/walk, compare it to the equivalent trip by car
  // Saved CO2 = (Car_Coeff - Mode_Coeff) * Distance
  const calculateCarbonSaved = () => {
    let saved = 0;
    trips.forEach((trip) => {
      const mode = trip.mode || 'car';
      const distance = Number(trip.distanceKm) || 0;
      const carCoeff = CARBON_COEFFICIENTS.car;
      const modeCoeff = CARBON_COEFFICIENTS[mode] ?? carCoeff;

      if (modeCoeff < carCoeff) {
        saved += (carCoeff - modeCoeff) * distance;
      }
    });
    return Math.round(saved * 100) / 100;
  };

  const totalCarbonEmitted = trips.reduce((sum, t) => sum + (Number(t.co2Kg) || 0), 0);
  const totalDistance = trips.reduce((sum, t) => sum + (Number(t.distanceKm) || 0), 0);
  const totalSaved = calculateCarbonSaved();

  // Custom persona message
  const getStreakMessage = () => {
    if (streakCount === 0) {
      if (profile.persona === 'kid') {
        return "Oh no! No streak yet. Let's log a trip today and start our super eco-adventure!";
      } else if (profile.persona === 'elder') {
        return "No streak is currently active. Let us begin our mindful stewardship today, one step at a time.";
      } else {
        return "You don't have an active streak. Log a trip today to start tracking your daily progress!";
      }
    }

    if (profile.persona === 'kid') {
      return `Awesome job, Carbon Hero! You have a streak of ${streakCount} day${streakCount > 1 ? 's' : ''}! Your companion is bouncing with joy! 🌟`;
    } else if (profile.persona === 'elder') {
      return `Your daily dedication is admirable. Maintaining a streak of ${streakCount} day${streakCount > 1 ? 's' : ''} represents a sincere commitment to our planet.`;
    } else {
      return `Great work! You've logged trips on ${streakCount} consecutive day${streakCount > 1 ? 's' : ''}. Keep the momentum going!`;
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-family-heading)' }}>
          <Award size={24} color="var(--color-primary)" />
          <span>My Achievements & Streaks</span>
        </h2>

        {error && (
          <div className="badge badge-danger" style={{ display: 'block', padding: '0.75rem', marginBottom: '1rem', width: '100%', borderRadius: 'var(--radius-sm)' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem 0' }}>
            <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
            <span style={{ marginLeft: '10px', color: 'var(--text-secondary)' }}>Calculating achievements...</span>
          </div>
        ) : (
          <div>
            {/* Streak Hero Section */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(239, 68, 68, 0.1))',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
              textAlign: 'center',
              marginBottom: '2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem'
            }}>
              <div style={{ position: 'relative' }}>
                <Flame size={72} color="var(--color-warning)" fill="var(--color-warning)" style={{ animation: 'float-calm 3s ease-in-out infinite' }} />
                <div style={{ 
                  position: 'absolute', 
                  bottom: '-5px', 
                  right: '-5px', 
                  background: 'var(--color-primary)', 
                  borderRadius: '50%', 
                  width: '32px', 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 'bold', 
                  fontSize: '0.9rem',
                  border: '2px solid var(--bg-gradient-start)'
                }}>
                  {streakCount}
                </div>
              </div>
              
              <h3 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-family-heading)' }}>
                {streakCount} Day Streak
              </h3>
              
              <p style={{ fontSize: '1.1rem', maxWidth: '600px', lineHeight: '1.6' }}>
                {getStreakMessage()}
              </p>
            </div>

            {/* Statistics Grid */}
            <h3 style={{ marginBottom: '1rem', fontFamily: 'var(--font-family-heading)' }}>Cumulative Impact</h3>
            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
              <div className="stat-item">
                <div className="stat-value" style={{ color: 'var(--color-primary)' }}>{totalDistance} km</div>
                <div className="stat-label">Total Distance Traced</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{totalCarbonEmitted} kg</div>
                <div className="stat-label">Total Carbon Emitted</div>
              </div>
              <div className="stat-item" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                <div className="stat-value" style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Leaf size={22} fill="var(--color-success)" />
                  <span>{totalSaved} kg</span>
                </div>
                <div className="stat-label">Carbon Saved vs Car</div>
              </div>
            </div>

            {/* Persona tips */}
            <div className="fact-card" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--card-border)' }}>
              <h4 className="fact-card-title" style={{ color: 'var(--color-primary)' }}>
                <Calendar size={18} />
                <span>Habit Building Tip</span>
              </h4>
              <p className="fact-card-body" style={{ color: 'var(--text-secondary)' }}>
                {profile.persona === 'kid' ? (
                  "Try walking or cycling to school or the park! It's like playing a game where you gain zero carbon points and make the sky happy!"
                ) : profile.persona === 'elder' ? (
                  "Whenever we prepare to travel, taking a quiet moment to consider if a journey can be walked or shared allows us to walk more gently on our landscape."
                ) : (
                  "Even shifting one car ride per week to train or active travel makes a noticeable dent in your monthly footprint. Keep up the consistent logging!"
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
