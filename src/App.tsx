import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { doc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { UserProfile, LEVEL_NAMES } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, BookOpen, LogOut, Loader2, Zap, Trophy, LayoutGrid, Trash2, X, AlertTriangle } from 'lucide-react';
import BusinessMode from './components/BusinessMode';
import LearningMode from './components/LearningMode';
import ProfileSetup from './components/ProfileSetup';
import AuthForm from './components/AuthForm';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'business' | 'learning'>('business');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'userProfiles', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching profile:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleLogout = () => signOut(auth);

  const handleResetProgress = async () => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'userProfiles', user.uid));
      setShowResetConfirm(false);
    } catch (error) {
      console.error("Reset failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-retro-bg text-white">
        <Loader2 className="w-8 h-8 animate-spin text-neon-green" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-retro-bg flex flex-col items-center justify-center p-4 text-white font-mono">
        <AuthForm onSuccess={() => {}} />
        
        <div className="mt-12 text-[10px] font-bold text-zinc-800 uppercase tracking-[0.5em] animate-pulse">
          Insert Coin to Continue
        </div>
      </div>
    );
  }

  if (!profile) {
    return <ProfileSetup user={user} />;
  }

  return (
    <div className="min-h-screen bg-retro-bg text-zinc-300 font-mono">
      {/* Navigation */}
      <nav className="border-b border-zinc-800 bg-retro-bg/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-pink-500" />
              <button 
                onClick={() => setMode('business')}
                className={`text-sm font-bold uppercase tracking-widest transition-all ${mode === 'business' ? 'text-neon-green neon-glow' : 'text-zinc-600 hover:text-zinc-400'}`}
              >
                Business Mode
              </button>
            </div>
            
            <div className="hidden md:flex items-center gap-6 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-yellow-500" />
                <span className="text-white">{profile.xp || 0} XP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Trophy className="w-3 h-3 text-pink-500" />
                <span className="text-white">{profile.currentLevel - 1}/6</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-0.5">
              <button 
                onClick={() => setMode('business')}
                className={`p-1.5 transition-colors ${mode === 'business' ? 'bg-neon-green/20 text-neon-green' : 'text-zinc-700 hover:text-zinc-500'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setMode('learning')}
                className={`p-1.5 transition-colors ${mode === 'learning' ? 'bg-neon-pink/20 text-neon-pink' : 'text-zinc-700 hover:text-zinc-500'}`}
              >
                <Zap className="w-4 h-4" />
              </button>
            </div>
            
            <button 
              onClick={() => setShowResetConfirm(true)}
              className="p-2 text-zinc-700 hover:text-red-500 transition-colors"
              title="Reset Progress"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button onClick={handleLogout} className="p-2 text-zinc-600 hover:text-white transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Reset Confirmation Overlay */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-sm w-full bg-zinc-900 border-2 border-red-500 p-8 space-y-6 text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 border border-red-500 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black uppercase tracking-widest text-red-500">Wipe Database?</h2>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
                  This will permanently delete your startup profile, XP, and roadmap progress. This action cannot be undone.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="py-3 border border-zinc-700 text-zinc-500 hover:text-white hover:border-white text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleResetProgress}
                  className="py-3 bg-red-500 text-black hover:bg-red-600 text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Confirm Wipe
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-6xl mx-auto p-4 md:p-12">
        <AnimatePresence mode="wait">
          {mode === 'business' ? (
            <motion.div
              key="business"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <BusinessMode profile={profile} />
            </motion.div>
          ) : (
            <motion.div
              key="learning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LearningMode profile={profile} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Hint */}
      <footer className="fixed bottom-4 right-4 text-[10px] font-bold text-zinc-700 uppercase tracking-widest">
        MENTOR + SIMULATE to progress
      </footer>
    </div>
  );
}
