import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import LogTripPage from './pages/LogTripPage';
import HistoryPage from './pages/HistoryPage';
import StreaksPage from './pages/StreaksPage';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  // Cold launch splash screen timer (2 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Show splash screen on cold launch or while authenticating
  if (loading || showSplash) {
    return (
      <div className="splash-container">
        <h1 className="splash-title">3040 Self</h1>
        <p className="splash-sub">Tracking & reducing carbon step by step</p>
        <div style={{ marginTop: '2.5rem' }}>
          <Loader2 className="animate-spin" size={32} color="#10b981" />
        </div>
      </div>
    );
  }

  // Redirect to AuthPage if user is not logged in or profile is incomplete
  const isAuthenticated = !!(user && profile);

  return (
    <div className="app-container">
      {isAuthenticated && <Navbar />}
      <main className="main-content">
        <Routes>
          {isAuthenticated ? (
            <>
              <Route path="/" element={<LogTripPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/streaks" element={<StreaksPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
