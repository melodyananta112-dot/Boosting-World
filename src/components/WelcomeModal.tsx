import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, MessageCircle } from 'lucide-react';

const WelcomeModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show modal after a short delay when the page loads
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const closeModal = () => setIsOpen(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-[#0a0a0a] border border-gold/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(255,215,0,0.15)]"
          >
            {/* Header with Icon */}
            <div className="bg-gradient-to-r from-gold/20 to-transparent p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gold/10 rounded-xl">
                  <Bell className="h-6 w-6 text-gold" />
                </div>
                <h2 className="text-xl font-display font-black text-white tracking-tight uppercase">
                  গুরুত্বপূর্ণ নোটিশ
                </h2>
              </div>
              <button 
                onClick={closeModal}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="space-y-6 text-gray-300 leading-relaxed">
                <p className="text-lg font-medium text-white/90">
                  আমাদের সকল সার্ভিস নিয়মিত ও নির্ভরযোগ্যভাবে চালু রয়েছে। প্রতিটি সার্ভিসের নির্দিষ্ট ডেলিভারি সময় আছে—অর্ডার করার আগে অনুগ্রহ করে সেটি যাচাই করুন।
                </p>
                
                <a 
                  href="https://wa.me/8801783707137" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-start space-x-4 hover:bg-white/10 transition-colors group"
                >
                  <div className="p-2 bg-[#39FF14]/10 rounded-lg shrink-0 group-hover:bg-[#39FF14]/20 transition-colors">
                    <MessageCircle className="h-5 w-5 text-[#39FF14]" />
                  </div>
                  <p className="text-sm">
                    কোনো প্রশ্ন থাকলে আমাদের <span className="text-[#39FF14] font-bold underline underline-offset-4">WhatsApp</span> সাপোর্টে যোগাযোগ করুন।
                  </p>
                </a>

                <p className="text-center pt-4 border-t border-white/5 text-gold font-bold italic">
                  আপনার বিশ্বাসই আমাদের শক্তি। ধন্যবাদ। 💚
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={closeModal}
                className="w-full mt-8 bg-gradient-to-r from-gold to-gold-dark text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:shadow-[0_0_30px_rgba(255,215,0,0.3)] transition-all duration-300 transform active:scale-[0.98]"
              >
                OK
              </button>
            </div>

            {/* Decorative Grid Pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-5">
              <div className="absolute inset-0" style={{ 
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}></div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeModal;
