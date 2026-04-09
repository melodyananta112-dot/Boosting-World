import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, History, Wallet, MessageSquare, UserCog, Coins, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthProvider';

export default function DashboardActions() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [showOrderWarning, setShowOrderWarning] = React.useState(false);

  const actions = [
    {
      title: 'New Order',
      icon: <ShoppingCart className="w-6 h-6" />,
      emoji: '🛒',
      link: '/new-order',
      color: 'from-gold to-gold-dark',
      textColor: 'text-black',
      description: 'Start a new growth campaign'
    },
    {
      title: 'Order History',
      icon: <History className="w-6 h-6" />,
      emoji: '🔎',
      link: '/orders',
      color: 'from-blue-500 to-blue-700',
      textColor: 'text-white',
      description: 'Track your growth progress'
    },
    {
      title: 'Deposit',
      icon: <Wallet className="w-6 h-6" />,
      emoji: '৳',
      link: '/deposit',
      color: 'from-green-500 to-green-700',
      textColor: 'text-white',
      description: 'Refuel your account balance'
    },
    {
      title: 'Support Chat',
      icon: <MessageSquare className="w-6 h-6" />,
      emoji: '💬',
      link: 'https://wa.me/8801783707137',
      isExternal: true,
      color: 'from-purple-500 to-purple-700',
      textColor: 'text-white',
      description: 'Get 24/7 expert assistance'
    },
    {
      title: 'Update Info',
      icon: <UserCog className="w-6 h-6" />,
      emoji: '🔄',
      link: '/profile',
      color: 'from-orange-500 to-orange-700',
      textColor: 'text-white',
      description: 'Manage your profile settings'
    }
  ];

  return (
    <div className="space-y-8 mb-16">
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-[#39FF14] to-gold rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex flex-col md:flex-row items-center justify-between p-6 md:p-8 rounded-[2.5rem] bg-black border border-white/10 overflow-hidden">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-[#39FF14]/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-gold/10 rounded-full blur-3xl"></div>
            
            <div className="flex items-center space-x-6 mb-6 md:mb-0 relative z-10">
              <div className="p-4 bg-[#39FF14]/10 rounded-2xl border border-[#39FF14]/20">
                <Coins className="w-10 h-10 text-[#39FF14] drop-shadow-[0_0_10px_rgba(57,255,20,0.5)]" />
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1 opacity-80">
                  <span className="text-[10px] font-black text-gold uppercase tracking-[0.2em]">Welcome Back,</span>
                  <span className="text-xs font-black text-white uppercase tracking-widest">{userProfile?.displayName || 'Member'}</span>
                </div>
                <div className="flex items-baseline space-x-4">
                  <div className="flex flex-col">
                    <h3 className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-1">Current Balance</h3>
                    <span className="text-4xl md:text-5xl font-display font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                      ৳{userProfile?.balance || 0}
                    </span>
                  </div>
                  <div className="flex flex-col border-l border-white/10 pl-4 h-10 justify-center">
                    <span className="text-[9px] font-black text-[#39FF14] uppercase tracking-[0.2em]">Available</span>
                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">BDT Account</span>
                  </div>
                </div>
              </div>
            </div>

            <Link
              to="/deposit"
              className="relative z-10 flex items-center space-x-4 bg-[#39FF14] text-black px-10 py-5 rounded-3xl font-black text-lg uppercase tracking-[0.15em] hover:shadow-[0_0_40px_rgba(57,255,20,0.8)] transition-all group/btn active:scale-95 animate-pulse hover:animate-none"
            >
              <Wallet className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
              <span>Add Funds</span>
            </Link>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showOrderWarning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOrderWarning(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            ></motion.div>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#0a0a0a] border border-gold/30 rounded-[2.5rem] p-8 md:p-10 shadow-[0_0_50px_rgba(255,215,0,0.15)] overflow-hidden"
            >
              <button 
                onClick={() => setShowOrderWarning(false)}
                className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <div className="flex flex-col items-center text-center space-y-8">
                <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center border border-gold/20">
                  <AlertTriangle className="text-gold w-10 h-10 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
                </div>

                <div className="space-y-6">
                  <p className="text-xl md:text-2xl font-black text-white leading-relaxed">
                    ‼️ আপনার সঠিক লিংক ও পরিমান যাচাই করে অর্ডার সাবমিট করুন
                  </p>
                  <p className="text-lg font-bold text-red-500 leading-relaxed">
                    ভূল তথ্য দিলে Boosting World - কর্তৃপক্ষ দায়ী থাকবে না । ধন্যবাদ
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowOrderWarning(false);
                    navigate('/new-order');
                  }}
                  className="w-full bg-gold text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-all"
                >
                  I Understand & Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {actions.map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="relative group"
          >
            {action.isExternal ? (
              <a
                href={action.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-br ${action.color} ${action.textColor} shadow-xl transition-all duration-300 h-full border border-white/10`}
              >
                <div className="mb-3 p-3 bg-white/20 rounded-2xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                  {action.icon}
                </div>
                <span className="text-sm font-black uppercase tracking-widest text-center">{action.title}</span>
                <span className="absolute top-2 right-2 text-lg opacity-40">{action.emoji}</span>
              </a>
            ) : (
              <button
                onClick={() => {
                  if (action.title === 'New Order') {
                    setShowOrderWarning(true);
                  } else {
                    navigate(action.link);
                  }
                }}
            className={`w-full flex flex-col items-center justify-center p-6 md:p-8 rounded-[2.5rem] bg-gradient-to-br ${action.color} ${action.textColor} shadow-2xl transition-all duration-500 h-full border border-white/10 ${action.title === 'Deposit' ? 'scale-110 ring-4 ring-gold/40 shadow-gold/30 z-20' : 'hover:scale-105'}`}
              >
                <div className="mb-3 p-3 bg-white/20 rounded-2xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                  {action.icon}
                </div>
                <span className="text-sm font-black uppercase tracking-widest text-center">{action.title}</span>
                <span className="absolute top-2 right-2 text-lg opacity-40">{action.emoji}</span>
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
