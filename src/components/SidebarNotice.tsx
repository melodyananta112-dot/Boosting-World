import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const SidebarNotice: React.FC = () => {
  return (
    <div className="lg:col-span-4 mt-12 lg:mt-0">
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="sticky top-24 p-8 rounded-[2rem] bg-black/40 border-2 border-[#39FF14] backdrop-blur-xl shadow-[0_0_30px_rgba(57,255,20,0.2)] overflow-hidden"
      >
        {/* Decorative Background Glows */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gold/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#39FF14]/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10">
          <div className="mb-6">
            <h3 className="text-xl font-black text-white mb-1">
              Welcome to | <span className="text-gold">Boosting World</span>
            </h3>
            <Link 
              to="/deposit" 
              className="inline-flex items-center text-[#39FF14] font-bold hover:underline group"
            >
              Add Funds - Click Here
              <motion.span 
                animate={{ x: [0, 5, 0] }} 
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="ml-2"
              >
                ➜
              </motion.span>
            </Link>
          </div>

          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6"></div>

          <div className="space-y-6">
            <div>
              <p className="text-gold font-bold text-sm uppercase tracking-widest mb-3">
                ⚠️ Important Rules
              </p>
              <p className="text-white/80 text-sm leading-relaxed italic">
                Please read the rules carefully before ordering any service
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-[#39FF14] text-sm leading-relaxed font-medium">
                Boosting World -এ রাজনৈতিক প্রচারণা, হেনস্থা, বা অন্যের ক্ষতি করতে পারে এমন কোনো কার্যকলাপ কঠোরভাবে নিষিদ্ধ।
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-white/60 text-xs font-bold uppercase">
                এ ধরনের কর্মকাণ্ডের প্রমাণ বা অভিযোগ পাওয়া গেলে—
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <span className="text-lg">🔴</span>
                  <p className="text-red-400 text-sm font-bold">অ্যাকাউন্ট স্থায়ীভাবে বন্ধ করা হবে</p>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <span className="text-lg">🔴</span>
                  <p className="text-red-400 text-sm font-bold">প্রয়োজন হলে ব্যবস্থা নেওয়া হবে</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <p className="text-gold text-xs font-bold text-center italic">
                Boosting World নিরাপদ ও নীতিনিষ্ঠ ব্যবহার নিশ্চিত করতে প্রতিশ্রুতিবদ্ধ।
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SidebarNotice;
