import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, BOOTSTRAP_ADMIN_EMAIL, db, handleFirestoreError, OperationType } from '../firebase/config';
import { ensureUserDocument } from '../firebase/services';
import { UserProfile } from '../types';

export type AuthModalMode = 'login' | 'register' | 'forgot';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  authReady: boolean;
  authModalOpen: boolean;
  authModalMode: AuthModalMode;
  openAuthModal: (mode?: AuthModalMode) => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdminDoc, setIsAdminDoc] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('login');

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;
    let unsubAdmin: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubProfile) unsubProfile();
      if (unsubAdmin) unsubAdmin();

      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setIsAdminDoc(false);
        setAuthReady(true);
        return;
      }

      try {
        await ensureUserDocument({
          uid: firebaseUser.uid,
          fullName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'La Casa Customer',
          email: firebaseUser.email || '',
          phone: firebaseUser.phoneNumber || '',
        });
      } catch {
        // Handled by Firestore error boundary or listener
      }

      const userPath = `users/${firebaseUser.uid}`;
      unsubProfile = onSnapshot(
        doc(db, 'users', firebaseUser.uid),
        (snap) => {
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          }
          setAuthReady(true);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, userPath);
        }
      );

      unsubAdmin = onSnapshot(
        doc(db, 'admins', firebaseUser.uid),
        (snap) => {
          setIsAdminDoc(snap.exists());
        },
        () => {
          setIsAdminDoc(false);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
      if (unsubAdmin) unsubAdmin();
    };
  }, []);

  const isAdmin = Boolean(
    user &&
      (isAdminDoc ||
        profile?.role === 'admin' ||
        (user.email === BOOTSTRAP_ADMIN_EMAIL && user.emailVerified))
  );

  const openAuthModal = (mode: AuthModalMode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => setAuthModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        authReady,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
