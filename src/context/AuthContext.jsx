import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signInWithPopup,
  onAuthStateChanged,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async (uid) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        return data;
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
    setProfile(null);
    return null;
  };

  useEffect(() => {
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

    // Check if the user is returning from the email link
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(async (result) => {
            window.localStorage.removeItem('emailForSignIn');
            setUser(result.user);
            await fetchProfile(result.user.uid);
          })
          .catch((err) => {
            console.error('Error signing in with email link:', err);
            setError(err.message);
          });
      }
    }

    return unsubscribe;
  }, []);

  const requestEmailOtp = async (email) => {
    setError(null);
    const actionCodeSettings = {
      url: window.location.origin, 
      handleCodeInApp: true,
    };
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      console.log('OTP Link sent to:', email);
    } catch (err) {
      console.error('OTP request error:', err);
      setError(err.message);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      return result.user;
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(err.message);
      throw err;
    }
  };

  const completeProfile = async (name, persona) => {
    if (!user) throw new Error('No authenticated user.');
    setError(null);
    const profileData = { name, persona, email: user.email, createdAt: serverTimestamp() };
    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, profileData);
      await fetchProfile(user.uid);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Error logging out:', err);
      setError(err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{
      user, profile, loading, error, requestEmailOtp, signInWithGoogle, completeProfile, logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
