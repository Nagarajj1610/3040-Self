import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { calculateStreak } from '../utils/streakCalc';

export default function StreaksPage() {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState({ current: 0, longest: 0, lastLogDate: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStreak = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
        const q = query(
          collection(db, 'trips'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const dates = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.timestamp) {
            const dateObj = typeof data.timestamp.toDate === 'function' ? data.timestamp.toDate() : new Date(data.timestamp);
            dates.push(dateObj);
          }
        });

        const calc = calculateStreak(dates);
        setStreakData(calc);
      } catch (err) {
        console.error('Error calculating streak:', err);
        setError('Could not load streak data. Firestore indexes may still be building.');
      } finally {
        setLoading(false);
      }
    };

    fetchStreak();
  }, [user]);

  const today = new Date();
  const lastLog = streakData.lastLogDate ? new Date(streakData.lastLogDate) : null;
  const isLoggedToday = lastLog && 
    lastLog.getDate() === today.getDate() && 
    lastLog.getMonth() === today.getMonth() && 
    lastLog.getFullYear() === today.getFullYear();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="card">
        <h2 className="card-title">
          <span className="card-icon">🔥</span>
          Your Streaks
        </h2>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading-state">
            <div className="gemini-spinner"></div>
            <span>Calculating your consistency...</span>
          </div>
        ) : (
          <div className="dashboard-grid">
            <div className="card" style={{ background: 'linear-gradient(135deg, #fef3c7, #fffbeb)', border: '1px solid #fde68a' }}>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ color: '#b45309', marginBottom: '0.5rem' }}>Current Streak</h3>
                <div style={{ fontSize: '4rem', fontWeight: 'bold', color: '#d97706' }}>
                  {streakData.current} <span style={{ fontSize: '2rem' }}>days</span>
                </div>
                <p style={{ marginTop: '1rem', color: '#92400e', fontWeight: '500' }}>
                  {isLoggedToday ? "🔥 You've logged a trip today!" : "⚠️ Log a trip today to keep it going!"}
                </p>
              </div>
            </div>

            <div className="card" style={{ background: '#f8fafc' }}>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Longest Streak</h3>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                  {streakData.longest} <span style={{ fontSize: '1.5rem' }}>days</span>
                </div>
                <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
                  Your all-time best record!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
