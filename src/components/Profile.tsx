import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { User, Mail, Phone, Shield, Save, AlertCircle } from 'lucide-react';

export default function Profile() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phoneNumber || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName,
        phoneNumber,
        updatedAt: new Date().toISOString()
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return <div className="text-white text-center py-20">Loading Profile...</div>;
  if (!user) return <div className="text-red-500 text-center py-20 font-bold uppercase tracking-widest">Please login to view profile</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-20">
      <h1 className="text-4xl font-display font-black text-white mb-12 tracking-tighter">
        USER <span className="text-gold">PROFILE</span> // SETTINGS
      </h1>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl"
      >
        <div className="flex items-center space-x-6 mb-10">
          <div className="w-24 h-24 bg-gold/10 rounded-3xl flex items-center justify-center border border-gold/20">
            <User className="text-gold w-12 h-12" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">{userProfile?.displayName || 'Anonymous'}</h2>
            <p className="text-gray-500 flex items-center space-x-2">
              <Shield size={14} className="text-gold" />
              <span className="text-[10px] font-black uppercase tracking-widest">Rank: {userProfile?.role || 'User'}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-gold uppercase tracking-widest mb-2 ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-gold transition-all"
                placeholder="Enter your name"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gold uppercase tracking-widest mb-2 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="email"
                value={user.email || ''}
                disabled
                className="w-full bg-black/20 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gold uppercase tracking-widest mb-2 ml-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-gold transition-all"
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          {message.text && (
            <div className={`p-4 rounded-xl flex items-center space-x-3 ${
              message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}>
              <AlertCircle size={18} />
              <p className="text-xs font-bold uppercase tracking-widest">{message.text}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gold text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:shadow-[0_0_30px_rgba(255,215,0,0.3)] transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
          >
            <Save size={20} />
            <span>{saving ? 'UPDATING...' : 'SAVE CHANGES'}</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
}
