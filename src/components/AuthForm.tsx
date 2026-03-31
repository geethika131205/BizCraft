import React, { useState } from 'react';
import { auth } from '../firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, Mail, Lock, Github, Loader2, ArrowRight, AlertCircle, Key } from 'lucide-react';

interface Props {
  onSuccess: () => void;
}

export default function AuthForm({ onSuccess }: Props) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onSuccess();
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError("EMAIL_AUTH_DISABLED: Please enable 'Email/Password' in your Firebase Console > Authentication > Sign-in method.");
      } else if (err.code === 'auth/invalid-credential') {
        setError("INVALID_CREDENTIALS: The email or password provided is incorrect. If you haven't created an account yet, please click 'Create New Profile?' below.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setError("Password reset email sent!");
      setShowReset(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-8 game-card border-neon-green/30 p-8">
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <Rocket className="w-16 h-16 text-neon-green mx-auto animate-bounce" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-neon-pink animate-ping rounded-full" />
        </div>
        <div className="space-y-1">
          <h1 className="text-5xl font-black tracking-tighter uppercase neon-glow text-neon-green italic">BizCraft</h1>
          <p className="text-[10px] font-bold tracking-[0.3em] text-zinc-500 uppercase">Secure Auth Protocol v2.0</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-500/10 border border-red-500/50 p-3 flex items-start gap-3 text-[10px] uppercase font-bold text-red-500"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {/* Social Login */}
        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 border-2 border-zinc-800 hover:border-neon-blue hover:bg-neon-blue/10 transition-all group disabled:opacity-50"
        >
          <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-black font-bold text-[10px]">G</div>
          <span className="text-[11px] font-black uppercase tracking-widest group-hover:text-neon-blue">Connect with Google</span>
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
          <div className="relative flex justify-center text-[8px] uppercase font-bold tracking-[0.5em] text-zinc-700 bg-retro-card px-4">OR</div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-neon-green transition-colors" />
              <input 
                type="email"
                placeholder="EMAIL_ADDRESS"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-800 py-3 pl-10 pr-4 text-[11px] font-bold uppercase tracking-widest focus:border-neon-green outline-none transition-all"
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-neon-green transition-colors" />
              <input 
                type="password"
                placeholder="ACCESS_KEY"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-800 py-3 pl-10 pr-4 text-[11px] font-bold uppercase tracking-widest focus:border-neon-green outline-none transition-all"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full game-button border-2 border-neon-green text-neon-green hover:bg-neon-green hover:text-black neon-glow transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isLogin ? '[ INITIALIZE_SESSION ]' : '[ REGISTER_IDENTITY ]'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-zinc-600 hover:text-neon-pink transition-colors"
          >
            {isLogin ? 'Create New Profile?' : 'Existing User?'}
          </button>
          <button 
            onClick={() => setShowReset(!showReset)}
            className="text-zinc-600 hover:text-neon-blue transition-colors flex items-center gap-1"
          >
            <Key className="w-3 h-3" />
            Lost Key?
          </button>
        </div>

        {showReset && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border border-neon-blue/30 bg-neon-blue/5 space-y-3"
          >
            <p className="text-[9px] text-neon-blue font-bold uppercase tracking-widest">Reset protocol will be sent to your email.</p>
            <button 
              onClick={handleResetPassword}
              className="w-full py-2 border border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black text-[9px] font-black uppercase tracking-widest transition-all"
            >
              Confirm Reset
            </button>
          </motion.div>
        )}
      </div>

      <div className="pt-4 text-center">
        <p className="text-[8px] text-zinc-700 uppercase font-bold tracking-widest">v2.0.1 - Multi-Provider Auth Enabled</p>
      </div>
    </div>
  );
}
