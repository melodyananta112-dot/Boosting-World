import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Menu, LogOut, LogIn, ShieldCheck, LayoutDashboard, Wallet } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from './AuthProvider';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const Navbar: React.FC = () => {
  const { user, userProfile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-5 group">
              <div className="relative">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -inset-4 bg-gold/30 rounded-full blur-2xl"
                ></motion.div>
                <motion.img 
                  animate={{ 
                    y: [0, -5, 0],
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  src="https://storage.googleapis.com/static-content-ais-hta6vjobfnvwsgluw3262p/melody.ananta112@gmail.com/721399942253/hta6vjobfnvwsgluw3262p/1742183908235.png" 
                  alt="Boosting World Original Logo" 
                  className="h-16 w-auto object-contain relative z-10 drop-shadow-[0_0_20px_rgba(255,215,0,0.6)] group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://i.ibb.co/JRx6tQtL/logo.png";
                  }}
                />
              </div>
              <div className="flex flex-col -space-y-2 relative">
                <span className="text-3xl font-display font-black tracking-tighter text-white leading-none group-hover:text-gold transition-colors duration-300">
                  BOOSTING
                </span>
                <span className="text-3xl font-display font-black tracking-tighter text-[#39FF14] leading-none drop-shadow-[0_0_15px_rgba(57,255,20,0.6)] animate-pulse">
                  WORLD
                </span>
              </div>

              {/* Total Customer Badge - Premium Style */}
              <div className="hidden lg:flex items-center ml-6 pl-6 border-l border-white/10">
                <div className="relative group/badge">
                  <div className="absolute -inset-2 bg-gold/20 rounded-xl blur-lg opacity-0 group-hover/badge:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative bg-black/40 border border-gold/30 rounded-xl px-4 py-2 flex flex-col items-center justify-center backdrop-blur-md">
                    <span className="text-[8px] font-black text-gold uppercase tracking-[0.3em] leading-none mb-1">Total Customer</span>
                    <div className="flex items-center space-x-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#39FF14] animate-pulse shadow-[0_0_8px_#39FF14]"></div>
                      <span className="text-lg font-display font-black text-white tracking-tighter leading-none">ID 234</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-4">
            {isAdmin && (
              <Link to="/admin" className="p-2.5 text-gold hover:text-white transition-all duration-300 group" title="Admin Panel">
                <ShieldCheck className="h-6 w-6 group-hover:scale-110 transition-transform" />
              </Link>
            )}

            {user && (
              <Link to="/" className="p-2.5 text-gray-400 hover:text-gold transition-all duration-300 group" title="Dashboard">
                <LayoutDashboard className="h-6 w-6 group-hover:scale-110 transition-transform" />
              </Link>
            )}

            {user ? (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="flex flex-col items-end">
                  <span className="hidden sm:block text-sm font-black text-gold uppercase tracking-widest mb-0.5">
                    {userProfile?.displayName || 'Member'}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg sm:text-xl text-[#39FF14] font-black drop-shadow-[0_0_10px_rgba(57,255,20,0.4)]">৳{userProfile?.balance || 0}</span>
                    <span className="hidden sm:block text-[10px] text-gray-500 font-bold">• ACTIVE</span>
                  </div>
                </div>
                <Link 
                  to="/deposit"
                  className="hidden sm:flex items-center space-x-3 bg-gradient-to-r from-gold/20 to-gold/40 hover:from-gold/40 hover:to-gold/60 text-gold border border-gold/50 px-6 py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] active:scale-95"
                >
                  <Wallet className="h-4 w-4" />
                  <span>Deposit</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="p-2.5 text-gray-400 hover:text-red-500 transition-all duration-300 group"
                  title="Logout"
                >
                  <LogOut className="h-6 w-6 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Link to="/login" className="flex items-center space-x-2 p-2.5 text-gray-400 hover:text-gold transition-all duration-300 group">
                  <LogIn className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline text-sm font-bold uppercase tracking-widest">Login</span>
                </Link>
                <Link 
                  to="/signup" 
                  className="bg-gold text-black px-6 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-all active:scale-95"
                >
                  Join Now
                </Link>
              </div>
            )}

            {user && (
              <Link 
                to="/deposit" 
                className="flex items-center justify-center w-12 h-12 bg-gold/20 text-gold rounded-2xl border border-gold/30 shadow-[0_0_15px_rgba(212,175,55,0.2)] active:scale-90 transition-all md:hidden" 
                title="Add Funds"
              >
                <Wallet className="h-6 w-6" />
              </Link>
            )}

            <button className="p-2.5 text-gray-400 hover:text-gold transition-all duration-300 md:hidden">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
