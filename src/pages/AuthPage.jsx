import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { user, profile, requestEmailOtp, signInWithGoogle, completeProfile, error } = useAuth();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [persona, setPersona] = useState('friend');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [linkSent, setLinkSent] = useState(false);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setLocalError('');
    try {
      await requestEmailOtp(email);
      setLinkSent(true);
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    setLocalError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!name) return;
    setSubmitting(true);
    setLocalError('');
    try {
      await completeProfile(name, persona);
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || error;

  if (user && !profile) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-leaf-icon">🌱</div>
            <h2>Complete Your Profile</h2>
          </div>
          {displayError && <div className="auth-error">{displayError}</div>}
          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="name-input">Display Name</label>
              <input id="name-input" type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required disabled={submitting} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="persona-select">Voice Tone</label>
              <select id="persona-select" className="form-input" value={persona} onChange={(e) => setPersona(e.target.value)} disabled={submitting}>
                <option value="kid">🧒 Kid</option>
                <option value="friend">🤝 Friend</option>
                <option value="elder">🧓 Elder</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !name}>
              {submitting ? 'Saving...' : 'Save & Get Started'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-leaf-icon">🌿</div>
          <h2>3040 Self</h2>
          <p>Track & reduce your carbon footprint, one journey at a time.</p>
        </div>

        {displayError && <div className="auth-error">{displayError}</div>}

        {linkSent ? (
          <div className="card-success" style={{ padding: '1rem', textAlign: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: '#166534', marginBottom: '0.5rem' }}>Check your email!</h3>
            <p>We've sent a login link to <strong>{email}</strong>.</p>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }} onClick={() => setLinkSent(false)}>
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleEmailAuth}>
            <div className="form-group">
              <label className="form-label" htmlFor="email-input">Email</label>
              <input id="email-input" type="email" className="form-input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={submitting} />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Sending link...' : 'Send Magic Link'}
            </button>
          </form>
        )}

        <div className="auth-divider"><span>or</span></div>

        <button onClick={handleGoogleSignIn} className="btn btn-google btn-block" disabled={submitting} type="button">
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <span>Sign in with Google</span>
        </button>
      </div>
    </div>
  );
}
