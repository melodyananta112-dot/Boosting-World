import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from './AuthProvider';
import { motion } from 'motion/react';
import { ShoppingBag, Clock, CheckCircle, XCircle, Package } from 'lucide-react';

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

export default function OrderHistory() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    return () => unsubscribe();
  }, [user]);

  if (authLoading || loading) return <div className="text-white text-center py-20">Loading Order Data...</div>;
  if (!user) return <div className="text-red-500 text-center py-20 font-bold uppercase tracking-widest">Please login to view order history</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <h1 className="text-4xl font-display font-black text-white mb-12 tracking-tighter">
        ORDER <span className="text-gold">HISTORY</span> // ORDERS
      </h1>

      <div className="space-y-6">
        {orders.map((order) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={order.id}
            className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 hover:border-gold/30 transition-all group relative overflow-hidden"
          >
            {/* Order ID Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gold animate-pulse"></div>
                <span className="text-[11px] font-black text-gold uppercase tracking-[0.2em] bg-gold/10 px-4 py-1.5 rounded-xl border border-gold/20 shadow-[0_0_15px_rgba(255,215,0,0.1)]">
                  ORDER ID: {order.orderNumber || `#${order.id.slice(0, 8)}`}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                <Clock size={12} className="text-gold/50" />
                <span>{order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleString() : 'Processing...'}</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-gradient-to-br from-gold/20 to-gold/5 rounded-2xl border border-gold/10 group-hover:scale-110 transition-transform duration-500">
                  <Package className="text-gold w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-black text-lg tracking-tight group-hover:text-gold transition-colors">{order.serviceName}</h3>
                  <p className="text-[10px] text-gold font-bold mt-1 truncate max-w-[200px] bg-gold/5 inline-block px-2 py-0.5 rounded border border-gold/10">{order.link}</p>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Total Charge</div>
                  <span className="text-2xl font-black text-white drop-shadow-[0_0_10px_rgba(255,215,0,0.2)]">৳{order.charge?.toFixed(2)}</span>
                </div>
                <span className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${
                  order.status?.toLowerCase() === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                  order.status?.toLowerCase() === 'cancelled' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                  'bg-gold/10 text-gold border-gold/20'
                }`}>
                  {order.status?.toLowerCase() === 'completed' ? <CheckCircle size={14} /> : 
                   order.status?.toLowerCase() === 'cancelled' ? <XCircle size={14} /> : 
                   <Clock size={14} className="animate-spin-slow" />}
                  <span>{order.status}</span>
                </span>
              </div>
            </div>

            <div className="mt-8 mb-6">
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2"></div>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ 
                    width: order.status?.toLowerCase() === 'pending' ? '0%' : 
                           order.status?.toLowerCase() === 'processing' ? '50%' : 
                           order.status?.toLowerCase() === 'completed' ? '100%' : '0%' 
                  }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className={`absolute top-1/2 left-0 h-0.5 -translate-y-1/2 ${
                    order.status?.toLowerCase() === 'cancelled' ? 'bg-red-500/50' : 'bg-gold/50'
                  }`}
                />

                {/* Status Steps */}
                <div className="relative flex justify-between items-center">
                  {[
                    { id: 'pending', label: 'Pending', icon: Clock },
                    { id: 'processing', label: 'Processing', icon: Package },
                    { id: 'completed', label: 'Completed', icon: CheckCircle }
                  ].map((step, index) => {
                    const isCompleted = order.status?.toLowerCase() === 'completed';
                    const isProcessing = order.status?.toLowerCase() === 'processing';
                    const isCancelled = order.status?.toLowerCase() === 'cancelled';

                    let stepStatus = 'upcoming';
                    if (index === 0) stepStatus = 'active'; 
                    if (index === 1 && (isProcessing || isCompleted)) stepStatus = 'active';
                    if (index === 2 && isCompleted) stepStatus = 'active';
                    if (isCancelled) stepStatus = 'cancelled';

                    return (
                      <div key={step.id} className="flex flex-col items-center">
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: index * 0.2 }}
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 z-10 ${
                            stepStatus === 'active' ? 'bg-black border-gold text-gold shadow-[0_0_20px_rgba(255,215,0,0.4)]' :
                            stepStatus === 'cancelled' ? 'bg-black border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]' :
                            'bg-black border-white/10 text-gray-600'
                          }`}
                        >
                          {isCancelled && index === 0 ? (
                            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                              <XCircle size={20} />
                            </motion.div>
                          ) : (
                            <step.icon size={20} className={stepStatus === 'active' ? 'animate-pulse' : ''} />
                          )}
                        </motion.div>
                        <span className={`mt-3 text-[10px] font-black uppercase tracking-widest ${
                          stepStatus === 'active' ? 'text-gold' : 
                          stepStatus === 'cancelled' ? 'text-red-500' : 
                          'text-gray-600'
                        }`}>
                          {isCancelled && index === 0 ? 'Cancelled' : step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {order.customComments && (
              <div className="mt-4 p-4 bg-gold/5 border border-gold/10 rounded-2xl">
                <div className="text-[10px] font-black text-gold uppercase tracking-widest mb-2">Custom Comments</div>
                <div className="text-xs text-gray-400 whitespace-pre-wrap break-words italic">
                  "{order.customComments}"
                </div>
              </div>
            )}

            <div className="border-t border-white/5 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 uppercase text-[10px] font-black tracking-widest">Quantity:</span>
                <span className="text-white font-bold">{order.quantity}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500 uppercase text-[10px] font-black tracking-widest">Category:</span>
                <span className="text-gold font-bold">{order.category}</span>
              </div>
            </div>
          </motion.div>
        ))}

        {orders.length === 0 && (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 font-bold uppercase tracking-widest">No orders executed yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
