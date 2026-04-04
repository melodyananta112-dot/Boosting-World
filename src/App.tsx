import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from './components/Navbar';
import WelcomeModal from './components/WelcomeModal';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import Login from './components/Login';
import Signup from './components/Signup';
import AdminPanel from './components/AdminPanel';
import DashboardActions from './components/DashboardActions';
import OrderHistory from './components/OrderHistory';
import AddFunds from './components/AddFunds';
import Profile from './components/Profile';
import NewOrder from './components/NewOrder';
import SidebarNotice from './components/SidebarNotice';
import { AuthProvider } from './components/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <WelcomeModal />
        <FloatingWhatsApp />
        <div className="min-h-screen flex flex-col boost-bg">
          <Navbar />
          
          {/* Scrolling Marquee */}
          <div className="bg-black/40 border-b border-[#39FF14]/10 py-4 overflow-hidden relative z-40">
            <div className="flex whitespace-nowrap animate-marquee">
              <span className="text-[#39FF14] font-bold text-lg md:text-xl px-8 drop-shadow-[0_0_10px_rgba(57,255,20,0.5)] uppercase tracking-wide">
                🚀 Boosting World- হলো একটি বিশ্বস্ত ও প্রফেশনাল ডিজিটাল গ্রোথ প্ল্যাটফর্ম, যেখানে আমরা আপনার বিজনেস, ব্র্যান্ড বা পার্সোনাল অ্যাকাউন্টকে দ্রুত, নিরাপদ এবং কার্যকরভাবে গ্রো করতে সাহায্য করি 🚀 । বর্তমান ডিজিটাল যুগে শুধু একটি পেজ বা অ্যাকাউন্ট থাকলেই হয় না—সঠিক অডিয়েন্স, এনগেজমেন্ট এবং সঠিক স্ট্র্যাটেজি প্রয়োজন, আর এই জায়গাতেই আমরা আপনার সবচেয়ে নির্ভরযোগ্য সঙ্গী 💯 । আমরা Facebook, YouTube, TikTok, Instagram এবং Telegram সোশ্যাল মিডিয়া প্ল্যাটফর্মে সার্ভিস প্রদান করি । আমরা সবসময় নিরাপদ ও সুরক্ষিত পদ্ধতি ব্যবহার করি, তাই আপনার অ্যাকাউন্ট থাকে সম্পূর্ণ সেফ—কোনো পাসওয়ার্ড প্রয়োজন হয় না এবং পুরো প্রসেসটি ঝুঁকিমুক্ত 🔒
              </span>
              {/* Duplicate for seamless loop */}
              <span className="text-[#39FF14] font-bold text-lg md:text-xl px-8 drop-shadow-[0_0_10px_rgba(57,255,20,0.5)] uppercase tracking-wide">
                🚀 Boosting World- হলো একটি বিশ্বস্ত ও প্রফেশনাল ডিজিটাল গ্রোথ প্ল্যাটফর্ম, যেখানে আমরা আপনার বিজনেস, ব্র্যান্ড বা পার্সোনাল অ্যাকাউন্টকে দ্রুত, নিরাপদ এবং কার্যকরভাবে গ্রো করতে সাহায্য করি 🚀 । বর্তমান ডিজিটাল যুগে শুধু একটি পেজ বা অ্যাকাউন্ট থাকলেই হয় না—সঠিক অডিয়েন্স, এনগেজমেন্ট এবং সঠিক স্ট্র্যাটেজি প্রয়োজন, আর এই জায়গাতেই আমরা আপনার সবচেয়ে নির্ভরযোগ্য সঙ্গী 💯 । আমরা Facebook, YouTube, TikTok, Instagram এবং Telegram সোশ্যাল মিডিয়া প্ল্যাটফর্মে সার্ভিস প্রদান করি । আমরা সবসময় নিরাপদ ও সুরক্ষিত পদ্ধতি ব্যবহার করি, তাই আপনার অ্যাকাউন্ট থাকে সম্পূর্ণ সেফ—কোনো পাসওয়ার্ড প্রয়োজন হয় না এবং পুরো প্রসেসটি ঝুঁকিমুক্ত 🔒
              </span>
            </div>
          </div>
          
          <main className="flex-grow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="lg:grid lg:grid-cols-12 lg:gap-12">
                <div className="lg:col-span-8">
                  <AnimatePresence mode="wait">
                    <Routes>
                      <Route
                        path="/"
                        element={
                          <ProtectedRoute>
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <div className="mb-16 text-center relative">
                                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none"></div>
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.8 }}
                                >
                                  <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-6 tracking-tight leading-tight">
                                    👑 Premium Boosting <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-light to-gold drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]">Starts Here</span> 💚👑
                                  </h1>
                                  <div className="text-xl md:text-3xl font-bold text-[#39FF14] mb-8 drop-shadow-[0_0_10px_rgba(57,255,20,0.4)] flex items-center justify-center space-x-3">
                                    <span>🚀</span>
                                    <span>Grow Your Social Presence Instantly</span>
                                  </div>
                                </motion.div>
                                <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-12">
                                  The ultimate high-performance growth engine for social media dominance. 
                                  Fast, secure, and engineered for results.
                                </p>

                                <DashboardActions />
                              </div>
                            </motion.div>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/new-order"
                        element={
                          <ProtectedRoute>
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <NewOrder />
                            </motion.div>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/login"
                        element={
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <Login />
                          </motion.div>
                        }
                      />
                      <Route
                        path="/signup"
                        element={
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <Signup />
                          </motion.div>
                        }
                      />
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute adminOnly>
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <AdminPanel />
                            </motion.div>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/orders"
                        element={
                          <ProtectedRoute>
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <OrderHistory />
                            </motion.div>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/deposit"
                        element={
                          <ProtectedRoute>
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <AddFunds />
                            </motion.div>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <Profile />
                            </motion.div>
                          </ProtectedRoute>
                        }
                      />
                    </Routes>
                  </AnimatePresence>
                </div>
                <SidebarNotice />
              </div>
            </div>
          </main>

          <footer className="bg-black border-t border-gold/10 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="relative">
                      <motion.div 
                        animate={{ 
                          scale: [1, 1.1, 1],
                          opacity: [0.2, 0.4, 0.2]
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute -inset-4 bg-gold/20 rounded-full blur-xl"
                      ></motion.div>
                      <motion.img 
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 5, repeat: Infinity }}
                        src="https://storage.googleapis.com/static-content-ais-hta6vjobfnvwsgluw3262p/melody.ananta112@gmail.com/721399942253/hta6vjobfnvwsgluw3262p/1742183908235.png" 
                        alt="Boosting World Original Logo" 
                        className="h-20 w-auto object-contain relative z-10 drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://i.ibb.co/JRx6tQtL/logo.png";
                        }}
                      />
                    </div>
                    <div className="flex flex-col -space-y-2">
                      <span className="text-3xl font-display font-black tracking-tighter text-gold leading-none drop-shadow-[0_0_10px_rgba(255,215,0,0.4)]">
                        BOOSTING
                      </span>
                      <span className="text-3xl font-display font-black tracking-tighter text-[#39FF14] leading-none drop-shadow-[0_0_12px_rgba(57,255,20,0.4)] animate-pulse">
                        WORLD
                      </span>
                    </div>

                    {/* Total Customer Badge - Footer */}
                    <div className="hidden sm:flex items-center ml-4 pl-4 border-l border-white/10">
                      <div className="bg-gold/5 border border-gold/20 rounded-lg px-3 py-1.5 flex flex-col items-center">
                        <span className="text-[7px] font-black text-gold uppercase tracking-[0.2em] leading-none mb-0.5">Total Customer</span>
                        <span className="text-sm font-display font-black text-white tracking-tighter leading-none">ID 234</span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-gray-400 max-w-xs leading-relaxed">
                    The world's leading social media growth platform. Elevate your digital presence with real results, real fast.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gold uppercase tracking-wider mb-4">Support</h4>
                  <ul className="space-y-2 text-sm text-gray-500">
                    <li><a href="#" className="hover:text-gold transition-colors">Shipping Policy</a></li>
                    <li><a href="#" className="hover:text-gold transition-colors">Returns & Exchanges</a></li>
                    <li><a href="#" className="hover:text-gold transition-colors">Contact Us</a></li>
                  </ul>
                </div>
              </div>
              <div className="mt-12 pt-8 border-t border-gold/10 flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center space-x-3 mb-4 md:mb-0">
                  <img 
                    src="https://storage.googleapis.com/static-content-ais-hta6vjobfnvwsgluw3262p/melody.ananta112@gmail.com/721399942253/hta6vjobfnvwsgluw3262p/1742183908235.png" 
                    alt="Logo" 
                    className="h-10 w-auto object-contain opacity-90"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://i.ibb.co/JRx6tQtL/logo.png";
                    }}
                  />
                  <p className="text-xs text-gray-500">
                    © 2026 Boosting World. All rights reserved.
                  </p>
                </div>
                <div className="flex space-x-6">
                  <a href="#" className="text-gray-500 hover:text-gold transition-colors text-xs">Privacy Policy</a>
                  <a href="#" className="text-gray-500 hover:text-gold transition-colors text-xs">Terms of Service</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}
