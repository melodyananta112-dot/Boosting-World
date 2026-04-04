import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const FloatingWhatsApp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('https://wa.me/8801783707137');

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'site'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.whatsappLink) {
          setWhatsappLink(data.whatsappLink);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    const encodedMessage = encodeURIComponent(message);
    const baseUrl = whatsappLink.split('?')[0];
    window.open(`${baseUrl}?text=${encodedMessage}`, '_blank');
    setMessage('');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-[350px] bg-[#1a1a1a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="bg-[#25D366] p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <MessageCircle className="text-white h-6 w-6" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-white rounded-full border-2 border-[#25D366]"></div>
                </div>
                <div>
                  <h3 className="text-white font-black text-lg leading-none">WhatsApp Chat</h3>
                  <p className="text-white/80 text-xs font-bold mt-1 uppercase tracking-widest">Online Support</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Chat Body */}
            <div className="p-6 h-[250px] bg-black/40 overflow-y-auto flex flex-col justify-end">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-bl-none max-w-[85%]">
                <p className="text-gray-300 text-sm leading-relaxed">
                  Hi there! 👋 How can we help you boost your social media today?
                </p>
                <span className="text-[10px] text-gray-500 font-bold mt-2 block uppercase tracking-tighter">Support Team</span>
              </div>
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white/5 border-t border-white/10 flex items-center space-x-3">
              <input
                type="text"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#25D366] transition-colors"
              />
              <button 
                type="submit"
                className="bg-[#25D366] text-white p-3 rounded-xl hover:scale-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(37,211,102,0.3)]"
              >
                <Send size={20} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-16 h-16 rounded-full shadow-[0_10px_30px_rgba(37,211,102,0.4)] hover:scale-110 transition-all duration-300 relative ${
          isOpen ? 'bg-white text-black' : 'bg-[#25D366] text-white'
        }`}
      >
        {isOpen ? <X size={32} /> : <MessageCircle size={32} className="fill-current" />}
        
        {!isOpen && (
          <>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-black flex items-center justify-center text-[10px] font-black">1</span>
            <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20"></span>
          </>
        )}
      </button>
    </div>
  );
};

export default FloatingWhatsApp;
