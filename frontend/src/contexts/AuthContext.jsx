'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { chatAPI } from '@/lib/api';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModule, setAuthModule] = useState(null);
  const [authInstance, setAuthInstance] = useState(null);

  useEffect(() => {
    // Dynamically import Firebase only on client side
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const initFirebase = async () => {
      try {
        const { auth } = await import('@/lib/firebase');
        const authFunctions = await import('firebase/auth');
        
        setAuthModule(authFunctions);
        setAuthInstance(auth);

        if (!auth) {
          setLoading(false);
          return;
        }

        const unsubscribe = authFunctions.onAuthStateChanged(auth, async (user) => {
          setUser(user);
          
          // Verify token with backend
          if (user) {
            try {
              const token = await user.getIdToken();
              await chatAPI.verifyToken(token);
            } catch (error) {
              console.error('Token verification failed:', error);
            }
          }
          
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Firebase initialization error:', error);
        setLoading(false);
      }
    };

    initFirebase();
  }, []);

  const signIn = async (email, password) => {
    if (!authInstance || !authModule) throw new Error('Firebase not initialized');
    await authModule.signInWithEmailAndPassword(authInstance, email, password);
  };

  const signUp = async (email, password, displayName) => {
    if (!authInstance || !authModule) throw new Error('Firebase not initialized');
    const result = await authModule.createUserWithEmailAndPassword(authInstance, email, password);
    
    if (displayName && result.user) {
      await authModule.updateProfile(result.user, { displayName });
    }
  };

  const signInWithGoogle = async () => {
    if (!authInstance || !authModule) throw new Error('Firebase not initialized');
    const provider = new authModule.GoogleAuthProvider();
    await authModule.signInWithPopup(authInstance, provider);
  };

  const signOut = async () => {
    if (!authInstance || !authModule) throw new Error('Firebase not initialized');
    await authModule.signOut(authInstance);
  };

  const resetPassword = async (email) => {
    if (!authInstance || !authModule) throw new Error('Firebase not initialized');
    await authModule.sendPasswordResetEmail(authInstance, email);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
