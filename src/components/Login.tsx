import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Mail, Lock, Chrome, AlertTriangle, X, Send, CheckCircle } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthProvider';

export default function Login() {
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Forgot Password States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && user) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি।');
      } else if (err.code === 'auth/wrong-password') {
        setError('ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('এই লগইন পদ্ধতিটি এখনো সক্রিয় করা হয়নি। অনুগ্রহ করে এডমিনের সাথে যোগাযোগ করুন।');
      } else {
        setError('লগইন ব্যর্থ হয়েছে: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    
    setForgotLoading(true);
    setForgotError('');
    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      setForgotSuccess(true);
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotSuccess(false);
        setForgotEmail('');
      }, 3000);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setForgotError('এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি।');
      } else {
        setForgotError('রিসেট ইমেইল পাঠানো ব্যর্থ হয়েছে।');
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      // Try popup first
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user profile exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Create new user profile
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          createdAt: new Date().toISOString(),
          balance: 0, // Initialize balance for new users
          role: 'user'
        });
      } else {
        // Update existing user profile basic info without touching balance
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || userSnap.data().displayName,
        }, { merge: true });
      }

      navigate('/');
    } catch (err: any) {
      console.error('Google Login Error:', err);
      if (err.code === 'auth/popup-blocked') {
        setError('ব্রাউজার পপআপ ব্লক করেছে! আমরা রিডাইরেক্ট মেথড ট্রাই করছি...');
        // Fallback to redirect if popup is blocked
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr: any) {
          setError('লগইন ব্যর্থ হয়েছে। অনুগ্রহ করে ব্রাউজার সেটিংস থেকে পপআপ এলাউ করুন।');
        }
      } else if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        // Ignore user cancellation or manual popup close
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('গুগল লগইন এখনো সক্রিয় করা হয়নি। অনুগ্রহ করে এডমিনের সাথে যোগাযোগ করুন।');
      } else {
        setError('গুগল লগইন ব্যর্থ হয়েছে: ' + err.message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-[90vh] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-gold/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[#39FF14]/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          
          <div className="text-center mb-10 relative">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center justify-center mb-2"
            >
              <img 
                src="https://storage.googleapis.com/static-content-ais-hta6vjobfnvwsgluw3262p/melody.ananta112@gmail.com/721399942253/hta6vjobfnvwsgluw3262p/1742183908235.png" 
                alt="Boosting World Logo" 
                className="h-24 w-auto object-contain drop-shadow-[0_0_20px_rgba(255,215,0,0.4)]"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://i.ibb.co/JRx6tQtL/logo.png";
                }}
              />
            </motion.div>
            <div className="flex flex-col -space-y-2 mb-6">
              <span className="text-3xl font-display font-black tracking-tighter text-gold leading-none drop-shadow-[0_0_10px_rgba(255,215,0,0.4)]">
                BOOSTING
              </span>
              <span className="text-3xl font-display font-black tracking-tighter text-[#39FF14] leading-none drop-shadow-[0_0_12px_rgba(57,255,20,0.4)] animate-pulse">
                WORLD
              </span>
            </div>
            <h2 className="text-4xl font-display font-black text-white mb-3 tracking-tight drop-shadow-[0_0_10px_rgba(57,255,20,0.5)]">
              Welcome <span className="text-[#39FF14]">Back</span>
            </h2>
            <p className="text-gray-400 font-medium">Access your <span className="text-gold">Boosting World</span> dashboard</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-2xl flex items-center space-x-3"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#39FF14]/70 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#39FF14] transition-colors" size={20} />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#39FF14]/50 focus:bg-[#39FF14]/5 transition-all duration-300"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-[#39FF14]/70 uppercase tracking-widest">Password</label>
                <button 
                  type="button" 
                  onClick={() => {
                    console.log('Forgot password clicked');
                    setShowForgotModal(true);
                  }}
                  className="text-[11px] font-bold text-[#39FF14] uppercase tracking-wider hover:text-white transition-colors cursor-pointer relative z-50"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#39FF14] transition-colors" size={20} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#39FF14]/50 focus:bg-[#39FF14]/5 transition-all duration-300"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#39FF14] to-[#059669] text-black font-black py-4.5 rounded-2xl hover:shadow-[0_0_30px_rgba(57,255,20,0.4)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 uppercase tracking-widest text-sm mt-4"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </div>
              ) : 'Login to Account'}
            </button>
          </form>

          <div className="mt-10">
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
                <span className="px-4 bg-black/40 backdrop-blur-xl text-gray-500">Quick Access</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center space-x-3 bg-white/5 border border-[#39FF14]/20 text-white py-4 rounded-2xl hover:bg-[#39FF14]/10 hover:border-[#39FF14]/50 transition-all duration-300 group disabled:opacity-50 cursor-pointer relative z-10 shadow-[0_0_15px_rgba(57,255,20,0.1)] hover:shadow-[0_0_25px_rgba(57,255,20,0.2)]"
            >
              {googleLoading ? (
                <div className="flex items-center space-x-2 pointer-events-none">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="text-sm font-bold">Connecting...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3 pointer-events-none">
                  <Chrome size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold tracking-wide">Connect with Google</span>
                </div>
              )}
            </button>

            <p className="mt-10 text-center text-gray-500 text-sm font-medium relative z-10">
              New to the platform?{' '}
              <Link to="/signup" className="text-gold font-bold hover:text-white transition-colors underline underline-offset-4 decoration-gold/30 cursor-pointer">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>

    <AnimatePresence>
      {showForgotModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !forgotLoading && setShowForgotModal(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          ></motion.div>
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl overflow-hidden z-[1000]"
          >
            <div className="absolute top-0 right-0 p-6">
              <button 
                onClick={() => setShowForgotModal(false)}
                className="text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gold/20">
                <Lock className="text-gold w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Forgot Password?</h3>
              <p className="text-gray-400 text-sm">অ্যাকাউন্টের ইমেইল দিন, আমরা পাসওয়ার্ড রিসেট লিঙ্ক পাঠিয়ে দেব।</p>
            </div>

            {forgotSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                  <CheckCircle className="text-emerald-500 w-8 h-8" />
                </div>
                <h4 className="text-emerald-500 font-bold mb-2">ইমেইল পাঠানো হয়েছে!</h4>
                <p className="text-gray-400 text-sm">আপনার ইনবক্স চেক করুন।</p>
              </motion.div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gold transition-colors" size={20} />
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-gold/50 focus:bg-white/10 transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                {forgotError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl flex items-center space-x-2">
                    <AlertTriangle size={14} />
                    <span>{forgotError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={forgotLoading || !forgotEmail}
                  className="w-full bg-gold text-black font-black py-4 rounded-2xl hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all duration-300 disabled:opacity-50 uppercase tracking-widest text-xs flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {forgotLoading ? (
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Send Reset Link</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
