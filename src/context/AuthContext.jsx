import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink, 
  onAuthStateChanged, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Firebase User object or Mock User object
  const [profile, setProfile] = useState(null); // { name, persona, createdAt }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signInSentEmail, setSignInSentEmail] = useState(null);

  // Helper to fetch user profile from Firestore (or mock storage)
  const fetchProfile = async (uid) => {
    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
          return docSnap.data();
        }
      } catch (err) {
        console.error('Error fetching Firestore profile:', err);
      }
    } else {
      // Mock mode
      const mockProfiles = JSON.parse(localStorage.getItem('mock_firestore_users') || '{}');
      if (mockProfiles[uid]) {
        setProfile(mockProfiles[uid]);
        return mockProfiles[uid];
      }
    }
    setProfile(null);
    return null;
  };

  // Listen to Auth State
  useEffect(() => {
    if (isFirebaseConfigured) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setLoading(true);
        if (firebaseUser) {
          setUser(firebaseUser);
          await fetchProfile(firebaseUser.uid);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // Mock Mode Auth Restore
      const savedMockUser = localStorage.getItem('mock_auth_user');
      if (savedMockUser) {
        const parsedUser = JSON.parse(savedMockUser);
        setUser(parsedUser);
        fetchProfile(parsedUser.uid);
      }
      setLoading(false);
    }
  }, []);

  // Check for email link sign-in on mount
  useEffect(() => {
    const handleEmailLinkSignIn = async () => {
      if (isFirebaseConfigured) {
        if (isSignInWithEmailLink(auth, window.location.href)) {
          setLoading(true);
          try {
            let email = window.localStorage.getItem('emailForSignIn');
            if (!email) {
              email = window.prompt('Please provide your email for confirmation:');
            }
            if (email) {
              const result = await signInWithEmailLink(auth, email, window.location.href);
              window.localStorage.removeItem('emailForSignIn');
              setUser(result.user);
              await fetchProfile(result.user.uid);
              // Clear query params from URL
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          } catch (err) {
            console.error('Error signing in with email link:', err);
            setError(err.message);
          } finally {
            setLoading(false);
          }
        }
      } else {
        // Mock link handler: check if url has mock sign-in params
        const params = new URLSearchParams(window.location.search);
        const mockEmail = params.get('mock_email');
        if (mockEmail) {
          setLoading(true);
          // Simulate network delay
          setTimeout(async () => {
            const uid = `mock-uid-${btoa(mockEmail).substring(0, 10)}`;
            const mockUser = { uid, email: mockEmail, displayName: mockEmail.split('@')[0] };
            localStorage.setItem('mock_auth_user', JSON.stringify(mockUser));
            setUser(mockUser);
            await fetchProfile(uid);
            // Clear query params
            window.history.replaceState({}, document.title, window.location.pathname);
            setLoading(false);
          }, 800);
        }
      }
    };

    handleEmailLinkSignIn();
  }, []);

  // Send sign in link
  const login = async (email) => {
    setError(null);
    if (isFirebaseConfigured) {
      const actionCodeSettings = {
        url: window.location.origin,
        handleCodeInApp: true,
      };
      try {
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', email);
        setSignInSentEmail(email);
        return true;
      } catch (err) {
        console.error('Error sending email link:', err);
        setError(err.message);
        throw err;
      }
    } else {
      // Mock mode: generate mock link
      setSignInSentEmail(email);
      const mockLink = `${window.location.origin}?mock_email=${encodeURIComponent(email)}`;
      console.log('Mock Sign-in Link:', mockLink);
      return mockLink; // Return link so UI can show it to user
    }
  };

  // Complete profile setup
  const completeProfile = async (name, persona) => {
    if (!user) throw new Error('No user is currently logged in.');
    setError(null);

    const profileData = {
      name,
      persona,
      createdAt: isFirebaseConfigured ? serverTimestamp() : new Date().toISOString()
    };

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, 'users', user.uid);
        await setDoc(docRef, profileData);
        // Fetch it back to update the state with proper timestamp
        await fetchProfile(user.uid);
      } catch (err) {
        console.error('Error saving profile:', err);
        setError(err.message);
        throw err;
      }
    } else {
      // Mock Firestore
      const mockProfiles = JSON.parse(localStorage.getItem('mock_firestore_users') || '{}');
      mockProfiles[user.uid] = profileData;
      localStorage.setItem('mock_firestore_users', JSON.stringify(mockProfiles));
      setProfile(profileData);
    }
  };

  // Sign out
  const logout = async () => {
    setError(null);
    if (isFirebaseConfigured) {
      try {
        await firebaseSignOut(auth);
        setUser(null);
        setProfile(null);
      } catch (err) {
        console.error('Error logging out:', err);
        setError(err.message);
        throw err;
      }
    } else {
      localStorage.removeItem('mock_auth_user');
      setUser(null);
      setProfile(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      error,
      signInSentEmail,
      login,
      completeProfile,
      logout,
      isMockMode: !isFirebaseConfigured
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
