import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, User, ShieldAlert, Sparkles, Send } from 'lucide-react';

export default function AuthPage() {
  const { 
    user, 
    profile, 
    login, 
    completeProfile, 
    signInSentEmail, 
    error, 
    isMockMode 
  } = useAuth();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [persona, setPersona] = useState('friend');
  
  const [submitting, setSubmitting] = useState(false);
  const [mockLink, setMockLink] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle email login link submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setSuccessMsg('');
    setMockLink('');

    try {
      const result = await login(email);
      if (isMockMode) {
        setMockLink(result);
        setSuccessMsg(`Mock Mode: A simulation sign-in link has been generated!`);
      } else {
        setSuccessMsg(`We sent a sign-in link to ${email}. Please check your inbox!`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle profile completion
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!name || !persona) return;
    setSubmitting(true);
    try {
      await completeProfile(name, persona);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Rendering Helper
  return (
    <div style={{ maxWidth: '480px', margin: '4rem auto 0 auto', padding: '0 1rem' }}>
      
      {/* Missing Firebase configuration banner */}
      {isMockMode && !user && (
        <div className="alert-banner">
          <div className="alert-banner-title">
            <ShieldAlert size={18} />
            <span>Running in LocalStorage Mock Mode</span>
          </div>
          <div className="alert-banner-desc">
            Firebase config was not found in your environment variables. The app is simulating authentication and Firestore operations locally using LocalStorage.
          </div>
        </div>
      )}

      {/* Step 1: User is not authenticated. Show email input */}
      {!user && (
        <div className="card">
          <h2 style={{ marginBottom: '0.5rem', fontFamily: 'var(--font-family-heading)' }}>
            Welcome to 3040 Self
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Enter your email to sign in. We'll send you a passwordless sign-in link.
          </p>

          {error && (
            <div className="badge badge-danger" style={{ display: 'block', padding: '0.75rem', marginBottom: '1rem', width: '100%', borderRadius: 'var(--radius-sm)' }}>
              {error}
            </div>
          )}

          {successMsg && (
            <div className="badge badge-success" style={{ display: 'block', padding: '0.75rem', marginBottom: '1rem', width: '100%', borderRadius: 'var(--radius-sm)' }}>
              {successMsg}
            </div>
          )}

          {/* If in Mock Mode, show the generated click link directly so the user can easily log in */}
          {mockLink && (
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>Click below to simulate signing in via email:</p>
              <a href={mockLink} className="btn btn-primary" style={{ textDecoration: 'none' }}>
                <Sparkles size={16} />
                Confirm Sign In Link
              </a>
            </div>
          )}

          {!mockLink && (
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="email-input">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    id="email-input"
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem', width: '100%' }}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="btn btn-primary btn-block"
                disabled={submitting || !email}
              >
                <Send size={16} />
                {submitting ? 'Sending...' : 'Send Sign-In Link'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Step 2: User is authenticated but profile document doesn't exist yet */}
      {user && !profile && (
        <div className="card">
          <h2 style={{ marginBottom: '0.5rem', fontFamily: 'var(--font-family-heading)' }}>
            Complete Your Profile
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            We'd love to know your name and how you'd like your carbon companion to speak with you.
          </p>

          {error && (
            <div className="badge badge-danger" style={{ display: 'block', padding: '0.75rem', marginBottom: '1rem', width: '100%', borderRadius: 'var(--radius-sm)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="name-input">Display Name / Nickname</label>
              <div style={{ position: 'relative' }}>
                <User size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  id="name-input"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                  placeholder="Earth Ranger"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="persona-select">Voice Tone Persona</label>
              <select
                id="persona-select"
                className="form-input"
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                required
                disabled={submitting}
                style={{ background: 'var(--input-bg)' }}
              >
                <option value="kid">Kid (Fun, simple, exciting)</option>
                <option value="friend">Friend (Casual, conversational, encouraging)</option>
                <option value="elder">Elder (Polite, wise, reflective)</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={submitting || !name}
            >
              <Sparkles size={16} />
              {submitting ? 'Creating Profile...' : 'Save & Get Started'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
