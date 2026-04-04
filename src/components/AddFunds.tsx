import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Send, MessageSquare, AlertCircle, History, Trash2, CheckSquare, Square, CheckCircle } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { db } from '../firebase';
import { collection, addDoc, doc, onSnapshot, query, where, orderBy, deleteDoc, writeBatch } from 'firebase/firestore';
import { auth } from '../firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function AddFunds() {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showMinDepositModal, setShowMinDepositModal] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [selectedDeposits, setSelectedDeposits] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [siteSettings, setSiteSettings] = useState({
    bkashNumber: '01783707137',
    nagadNumber: '01783707137',
    whatsappLink: 'https://wa.me/8801783707137'
  });

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'deposits'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDeposits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'deposits'));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'site'), (doc) => {
      if (doc.exists()) {
        setSiteSettings(doc.data() as any);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/site'));

    return () => {
      unsubscribe();
      unsubSettings();
    };
  }, [user]);

  const toggleSelect = (id: string) => {
    setSelectedDeposits(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedDeposits.length === deposits.length) {
      setSelectedDeposits([]);
    } else {
      setSelectedDeposits(deposits.map(d => d.id));
    }
  };

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const ToastContainer = () => (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: 50 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`fixed bottom-8 right-8 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md border ${
            toast.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle size={20} className="drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
          ) : (
            <AlertCircle size={20} className="drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]" />
          )}
          <span className="font-bold tracking-tight">{toast.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const handleDeleteSelected = async () => {
    if (selectedDeposits.length === 0) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    try {
      const batch = writeBatch(db);
      selectedDeposits.forEach(id => {
        batch.delete(doc(db, 'deposits', id));
      });
      await batch.commit();
      setSelectedDeposits([]);
      setToast({ message: `Successfully deleted ${selectedDeposits.length} records`, type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'deposits');
      setToast({ message: 'Failed to delete records', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!amount) {
      setError('⚠️ দয়া করে টাকার পরিমাণ দিন ।');
      return;
    }
    if (!transactionId) {
      setError('⚠️ দয়া করে Transaction ID / Last 4 Digit দিন ।');
      return;
    }

    const depositAmount = parseFloat(amount);
    if (depositAmount < 200) {
      setShowMinDepositModal(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await addDoc(collection(db, 'deposits'), {
        userId: user.uid,
        amount: depositAmount,
        method,
        transactionId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      setSuccess(true);
      setAmount('');
      setTransactionId('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'deposits');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/5 border border-[#39FF14]/20 rounded-3xl p-12 backdrop-blur-xl"
        >
          <div className="w-20 h-20 bg-[#39FF14]/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="text-[#39FF14] w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tight">Request Submitted</h2>
          <p className="text-gray-400 mb-10 leading-relaxed">
            ✅ আপনার ডিপোজিট টি সম্পূর্ণ হয়েছে । দয়া করে অপেক্ষা করুন খুব দ্রুত আপনার একাউন্টে ব্যালেন্স যোগ করা হবে  । ধন্যবাদ আমাদের সাথে থাকার জন্য💚🌹
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="w-full bg-[#39FF14] text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(57,255,20,0.3)] transition-all"
          >
            OK
          </button>
        </motion.div>
      </div>
    );
  }

  if (!acceptedTerms) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8 backdrop-blur-xl"
        >
          <div className="flex items-center space-x-4 mb-6">
            <AlertCircle className="text-red-500 w-8 h-8" />
            <h3 className="text-xl font-black text-white uppercase tracking-tight">
              ⛔ Add Fund নিয়ম নীতি ( ব্যালেন্স যোগ করার আগে অবশ্যই পড়ুন )
            </h3>
          </div>
          
          <div className="space-y-6 text-gray-300 leading-relaxed">
            <div className="h-px bg-red-500/20 w-full mb-6"></div>
            
            <p className="flex items-start space-x-3">
              <span className="text-red-500 mt-1">⛔</span>
              <span>আপনি যদি টাকা এড করতে চান তাহলে অবশ্যই খরচ সহ পাঠাবেন,নতুবা খরচ কেটে অবশিষ্ট টাকা এড করা হবে । সর্বশেষ ৪ ডিজিট বা Tansaction id উল্লেখ করুন ।</span>
            </p>

            <p className="flex items-start space-x-3">
              <span className="text-red-500 mt-1">⛔</span>
              <span>ম্যানুয়ালি ব্যালেন্স যুক্ত হতে 0-২ ঘন্টা পর্যন্ত সময় লাগতে পারে। এসময়ের মধ্যে কোন দ্বিতীয় বার Add Fund Submit করবেন না।</span>
            </p>

            <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/10">
              <p className="mb-4">আমাদের সার্ভিস এবং ব্যালেন্স সংক্রান্ত যেকোন ব্যাপারে এজেন্টে সঙ্গে কথা বললে অবশ্যই ভদ্রভাবে কথা বলতে হবে।</p>
              <p className="flex items-start space-x-3">
                <span className="text-red-500 mt-1">⛔</span>
                <span>সাপোর্ট এজেন্টের সঙ্গে কোন খারাপ শব্দ ব্যবহার করলে কিংবা অভদ্রচিত কোন আচরণ করলে আপনার অ্যাকাউন্ট স্থায়ীভাবে বন্ধ করে দেয়া হবে  আপনি আমাদের সার্ভিস ব্যবহার করছেনই সমস্ত টার্মস এবং কন্ডিশন মেনে নিয়ে।</span>
              </p>
            </div>

            <p className="flex items-start space-x-3">
              <span className="text-red-500 mt-1">⛔</span>
              <span>আমরা আপনাদের সর্বোচ্চ সেবা দিতে বদ্ধ পরিকর, তবে আপনাদের কাছ থেকে অসহযোগীতা পেলে সেটি সম্ভবপর হবে না। আমাদের প্রতিটি কাস্টমার সার্ভিস এজেন্ট আমাদের কাছে পরিবারের মত, আর পরিবারের কারো সঙ্গে খারাপ শব্দ ব্যবহার আমরা মেনে নেই না।</span>
            </p>

            <p className="flex items-start space-x-3 font-bold text-white">
              <span className="text-red-500 mt-1">⛔</span>
              <span>বর্তমানে সর্বনিম্ন ২০০ টাকা থেকে সর্বোচ্চ আপনার পেমেন্ট মেথডের উপর নির্ভর করে ব্যালেন্স যুক্ত করা যায়।</span>
            </p>
          </div>

          <button
            onClick={() => setAcceptedTerms(true)}
            className="mt-10 w-full bg-[#39FF14] text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:shadow-[0_0_30px_rgba(57,255,20,0.4)] transition-all flex items-center justify-center space-x-3"
          >
            <span>OK, I UNDERSTAND</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-4xl font-display font-black text-white tracking-tighter">
          DEPOSIT <span className="text-gold">FUNDS</span>
        </h1>
        <button 
          onClick={() => setAcceptedTerms(false)}
          className="text-xs font-black text-red-500 uppercase tracking-widest hover:underline"
        >
          View Rules
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl"
          >
            <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-tight flex items-center space-x-3">
              <Wallet className="text-gold" />
              <span>Manual Deposit</span>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-[#39FF14] uppercase tracking-widest mb-3 drop-shadow-[0_0_8px_rgba(57,255,20,0.5)]">Select Method</label>
                <div className="grid grid-cols-2 gap-4">
                  {(['bkash', 'nagad'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center space-y-2 ${
                        method === m 
                          ? 'bg-gold/10 border-gold text-gold shadow-[0_0_15px_rgba(255,215,0,0.2)]' 
                          : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                      }`}
                    >
                      <img 
                        src={m === 'bkash' 
                          ? "https://www.logo.wine/a/logo/BKash/BKash-Logo.wine.svg" 
                          : "https://download.logo.wine/logo/Nagad/Nagad-Logo.wine.png"
                        } 
                        alt={m} 
                        className="h-12 w-auto object-contain" 
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest">{m}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-4 p-4 bg-[#39FF14]/5 border border-[#39FF14]/20 rounded-xl text-center">
                  <span className="text-3xl md:text-4xl font-black text-[#39FF14] drop-shadow-[0_0_15px_rgba(57,255,20,0.8)] animate-pulse">
                    💰 {method === 'bkash' ? siteSettings.bkashNumber : siteSettings.nagadNumber}
                  </span>
                </div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Amount (BDT)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold font-black">৳</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-white focus:outline-none focus:border-gold transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Transaction ID / Last 4 Digit</label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter TrxID / Last 4 Digit"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-gold transition-all"
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center space-x-2 text-red-500 text-sm font-bold"
                  >
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send size={20} />
                    <span>Submit Deposit</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl"
          >
            <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight">Payment Instructions</h3>
            <div className="space-y-6">
              <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                <p className="text-[10px] font-black text-gold uppercase tracking-widest mb-2">Our Numbers</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">BKash (Personal)</span>
                    <span className="text-xl font-black text-white">{siteSettings.bkashNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Nagad (Personal)</span>
                    <span className="text-xl font-black text-white">{siteSettings.nagadNumber}</span>
                  </div>
                </div>
              </div>
              <ul className="space-y-4 text-sm text-gray-400">
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-black text-gold">1</span>
                  </div>
                  <span>Send money to any of our personal numbers above.</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-black text-gold">2</span>
                  </div>
                  <span>Copy the Transaction ID (TrxID) from the confirmation message.</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-black text-gold">3</span>
                  </div>
                  <span>Fill the form with the amount and TrxID and submit.</span>
                </li>
              </ul>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-blue-500/5 border border-blue-500/20 rounded-3xl p-8 backdrop-blur-xl"
          >
            <div className="flex items-center space-x-4 mb-4">
              <MessageSquare className="text-blue-500" />
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Need Help?</h3>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              If you face any issues or want to deposit via other methods, contact our 24/7 support.
            </p>
            <a
              href={siteSettings.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-blue-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all"
            >
              WhatsApp Support
            </a>
          </motion.div>
        </div>
      </div>

      {/* Deposit History Section */}
      <div className="mt-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center space-x-3">
            <History className="text-gold" />
            <span>Deposit History</span>
          </h2>
          
          {deposits.length > 0 && (
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSelectAll}
                className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gold transition-colors flex items-center space-x-2"
              >
                {selectedDeposits.length === deposits.length ? <CheckSquare size={16} /> : <Square size={16} />}
                <span>{selectedDeposits.length === deposits.length ? 'Deselect All' : 'Select All'}</span>
              </button>
              
              <AnimatePresence>
                {selectedDeposits.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onClick={handleDeleteSelected}
                    disabled={isDeleting}
                    className="flex items-center space-x-2 bg-red-500/10 text-red-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    <span>Delete Selected ({selectedDeposits.length})</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDeleteConfirm(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              ></motion.div>
              
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 shadow-2xl text-center"
              >
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Delete Records?</h3>
                <p className="text-gray-400 mb-8">Are you sure you want to delete {selectedDeposits.length} deposit records? This action cannot be undone.</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="py-4 rounded-xl font-black uppercase tracking-widest text-xs border border-white/10 text-white hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={isDeleting}
                    className="py-4 rounded-xl font-black uppercase tracking-widest text-xs bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          {deposits.map((deposit) => (
            <motion.div
              key={deposit.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white/5 border rounded-3xl p-6 transition-all relative group ${
                selectedDeposits.includes(deposit.id) ? 'border-gold/50 bg-gold/5' : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={() => toggleSelect(deposit.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      selectedDeposits.includes(deposit.id) ? 'text-gold' : 'text-gray-600 hover:text-gray-400'
                    }`}
                  >
                    {selectedDeposits.includes(deposit.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                  </button>
                  
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-2xl ${
                      deposit.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                      deposit.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                      'bg-gold/10 text-gold'
                    }`}>
                      <Wallet size={24} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <h4 className="text-white font-black">৳{deposit.amount}</h4>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          deposit.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                          deposit.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                          'bg-gold/10 text-gold'
                        }`}>
                          {deposit.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                        {deposit.method} • {deposit.transactionId}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    {new Date(deposit.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                    {new Date(deposit.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}

          {deposits.length === 0 && (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 font-bold uppercase tracking-widest">No deposit history found</p>
            </div>
          )}
        </div>
      </div>

      <ToastContainer />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            ></motion.div>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#0a0a0a] border border-red-500/30 rounded-[2.5rem] p-8 md:p-10 shadow-[0_0_50px_rgba(239,68,68,0.15)] overflow-hidden"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                  <Trash2 className="text-red-500 w-10 h-10 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Confirm Deletion</h3>
                  <p className="text-gray-400">Are you sure you want to delete {selectedDeposits.length} deposit records? This action cannot be undone.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-6 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-6 py-4 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Minimum Deposit Warning Modal */}
      <AnimatePresence>
        {showMinDepositModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMinDepositModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            ></motion.div>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#0a0a0a] border border-[#39FF14]/30 rounded-[2.5rem] p-8 md:p-10 shadow-[0_0_50px_rgba(57,255,20,0.15)] overflow-hidden"
            >
              <div className="flex flex-col items-center text-center space-y-8">
                <div className="w-20 h-20 bg-[#39FF14]/10 rounded-full flex items-center justify-center border border-[#39FF14]/20">
                  <AlertCircle className="text-[#39FF14] w-10 h-10 drop-shadow-[0_0_10px_rgba(57,255,20,0.5)]" />
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <p className="text-lg md:text-xl font-black text-white leading-relaxed flex items-start justify-center gap-3">
                      <span className="text-[#39FF14]">⚠️</span>
                      <span>দয়া করে আপনার একাউন্টে সর্বনিন্ম ২০০ ৳ ব্যালেন্স যোগ করুন ।</span>
                    </p>
                    <p className="text-lg md:text-xl font-black text-white leading-relaxed flex items-start justify-center gap-3">
                      <span className="text-[#39FF14]">✅</span>
                      <span>ব্যালেন্স যোগ করে আপনার প্রয়োজনীয় সার্ভিস বেছে নিন ।</span>
                    </p>
                    <p className="text-lg md:text-xl font-black text-white leading-relaxed flex items-start justify-center gap-3">
                      <span className="text-[#39FF14]">📞</span>
                      <span>ব্যালেন্স যোগ করতে কোনো কিছু বুজতে বা সমস্যা হলে সরাসরি এজেন্টের সাথে যোগাযোগ করুন । ধন্যবাদ</span>
                    </p>
                  </div>

                  <div className="py-6 border-t border-white/5">
                    <p className="text-sm font-bold text-[#39FF14]/80 flex items-center justify-center gap-2">
                      <span>💚</span>
                      <span>Boosting World নিরাপদ ও নীতিনিষ্ঠ ব্যবহার নিশ্চিত করতে প্রতিশ্রুতিবদ্ধ।</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowMinDepositModal(false)}
                  className="w-full bg-[#39FF14] text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] transition-all"
                >
                  OK, I UNDERSTAND
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
