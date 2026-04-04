import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { UserPlus, Mail, Lock, Chrome, Phone, User as UserIcon } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthProvider';

export default function Signup() {
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && user) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, location]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        phoneNumber: phone,
        displayName: displayName,
        balance: 0,
        role: 'user',
        createdAt: new Date().toISOString(),
      });

      navigate('/');
    } catch (err: any) {
      console.error('Signup Error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('এই ইমেইলটি ইতিমধ্যে ব্যবহার করা হয়েছে। অন্য ইমেইল চেষ্টা করুন।');
      } else if (err.code === 'auth/invalid-email') {
        setError('অনুগ্রহ করে একটি সঠিক ইমেইল এড্রেস দিন।');
      } else if (err.code === 'auth/weak-password') {
        setError('পাসওয়ার্ডটি অন্তত ৬ অক্ষরের হতে হবে।');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('এই রেজিস্ট্রেশন পদ্ধতিটি এখনো সক্রিয় করা হয়নি। অনুগ্রহ করে এডমিনের সাথে যোগাযোগ করুন।');
      } else if (err.code === 'permission-denied') {
        setError('সার্ভার পারমিশন ডিনাইড! অনুগ্রহ করে এডমিনের সাথে যোগাযোগ করুন।');
      } else {
        setError('অ্যাকাউন্ট তৈরি করতে ব্যর্থ হয়েছে: ' + err.message);
      }
    } finally {
      setLoading(false);
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
          balance: 0,
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
      console.error('Google Signup Error:', err);
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
        setError('গুগল সাইনআপ এখনো সক্রিয় করা হয়নি। অনুগ্রহ করে এডমিনের সাথে যোগাযোগ করুন।');
      } else {
        setError('গুগল সাইনআপ ব্যর্থ হয়েছে: ' + err.message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-gold/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-[#39FF14]/5 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#39FF14]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

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

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#39FF14]/70 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#39FF14] transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#39FF14]/50 focus:bg-[#39FF14]/5 transition-all duration-300"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#39FF14]/70 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#39FF14] transition-colors" size={18} />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#39FF14]/50 focus:bg-[#39FF14]/5 transition-all duration-300"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#39FF14]/70 uppercase tracking-widest ml-1">Phone Number</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#39FF14] transition-colors" size={18} />
                <input
                  type="tel"
                  placeholder="+880 1XXX XXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#39FF14]/50 focus:bg-[#39FF14]/5 transition-all duration-300"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#39FF14]/70 uppercase tracking-widest ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#39FF14] transition-colors" size={18} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#39FF14]/50 focus:bg-[#39FF14]/5 transition-all duration-300"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#39FF14]/70 uppercase tracking-widest ml-1">Confirm</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#39FF14] transition-colors" size={18} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#39FF14]/50 focus:bg-[#39FF14]/5 transition-all duration-300"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#39FF14] to-[#059669] text-black font-black py-4 rounded-2xl hover:shadow-[0_0_30px_rgba(57,255,20,0.4)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 uppercase tracking-widest text-sm mt-6"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </div>
              ) : 'Create New Account'}
            </button>
          </form>

          <div className="mt-10">
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
                <span className="px-4 bg-black/40 backdrop-blur-xl text-gray-500">Social Connect</span>
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
              Already a member?{' '}
              <Link to="/login" className="text-gold font-bold hover:text-white transition-colors underline underline-offset-4 decoration-gold/30 cursor-pointer">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
