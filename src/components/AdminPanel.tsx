import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, orderBy, getDoc, setDoc, addDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from './AuthProvider';
import { motion, AnimatePresence } from 'motion/react';
import { Users, ShoppingBag, Trash2, CheckCircle, Clock, AlertCircle, Wallet, Settings, Plus, Edit2, Save, X, Package, Copy, ExternalLink, Search } from 'lucide-react';

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

export default function AdminPanel() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'orders' | 'deposits' | 'services' | 'settings'>('orders');
  const [depositSearch, setDepositSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [depositToDelete, setDepositToDelete] = useState<string | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Service Modal State
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    price: '',
    category: '',
    platform: '',
    description: '',
    averageTime: '',
    image: ''
  });

  useEffect(() => {
    if (!isAdmin) return;

    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const depositsQuery = query(collection(db, 'deposits'), orderBy('createdAt', 'desc'));
    const servicesQuery = query(collection(db, 'services'), orderBy('name', 'asc'));

    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      console.log('AdminPanel: Orders snapshot received, size:', snapshot.size);
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error('AdminPanel: Orders snapshot error:', error);
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    const unsubDeposits = onSnapshot(depositsQuery, (snapshot) => {
      setDeposits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'deposits'));

    const unsubServices = onSnapshot(servicesQuery, (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'services'));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'site'), (doc) => {
      if (doc.exists()) {
        setSiteSettings(doc.data());
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/site'));

    return () => {
      unsubUsers();
      unsubOrders();
      unsubDeposits();
      unsubServices();
      unsubSettings();
    };
  }, [isAdmin]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await transaction.get(orderRef);
        
        if (!orderSnap.exists()) {
          throw new Error('Order not found');
        }
        
        const oldStatus = orderSnap.data().status || 'Pending';
        const numericId = orderSnap.data().numericId;
        
        // Prepare counter read if needed
        let counterSnap = null;
        const isCompleting = newStatus.toLowerCase() === 'completed' && oldStatus.toLowerCase() !== 'completed' && numericId;
        
        if (isCompleting) {
          const counterRef = doc(db, 'counters', 'orderConfig');
          counterSnap = await transaction.get(counterRef);
        }
        
        // ALL WRITES MUST COME AFTER ALL READS
        transaction.update(orderRef, { 
          status: newStatus,
          updatedAt: serverTimestamp()
        });
        
        if (isCompleting && counterSnap) {
          const counterRef = doc(db, 'counters', 'orderConfig');
          let availableIds: number[] = [];
          let nextId = 1;

          if (counterSnap.exists()) {
            availableIds = counterSnap.data().availableIds || [];
            nextId = counterSnap.data().nextId || 1;
          }
          
          // Add to pool if not already there
          if (!availableIds.includes(numericId)) {
            availableIds.push(numericId);
            availableIds.sort((a, b) => a - b);
            
            transaction.set(counterRef, { 
              availableIds,
              nextId // Keep nextId
            }, { merge: true });
          }
        }
      });
      setToast({ message: `Order status updated to ${newStatus}`, type: 'success' });
    } catch (error) {
      console.error('Error updating order status:', error);
      setToast({ 
        message: error instanceof Error && error.message.includes('permission') 
          ? 'Permission denied. You might not have admin rights.' 
          : 'Failed to update order status', 
        type: 'error' 
      });
    }
  };

  const approveDeposit = async (deposit: any) => {
    if (deposit.status !== 'pending') return;
    
    try {
      await updateDoc(doc(db, 'deposits', deposit.id), { status: 'approved' });
      const userRef = doc(db, 'users', deposit.userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const currentBalance = userSnap.data().balance || 0;
        await updateDoc(userRef, { balance: currentBalance + deposit.amount });
      } else {
        await setDoc(userRef, { 
          uid: deposit.userId, 
          balance: deposit.amount,
          createdAt: new Date().toISOString()
        }, { merge: true });
      }
      setToast({ message: 'Deposit approved and balance updated!', type: 'success' });
    } catch (error) {
      console.error('Error approving deposit:', error);
      setToast({ message: 'Failed to approve deposit.', type: 'error' });
    }
  };

  const rejectDeposit = async (depositId: string) => {
    try {
      await updateDoc(doc(db, 'deposits', depositId), { status: 'rejected' });
      setToast({ message: 'Deposit rejected.', type: 'success' });
    } catch (error) {
      console.error('Error rejecting deposit:', error);
      setToast({ message: 'Failed to reject deposit.', type: 'error' });
    }
  };

  const deleteDeposit = async (depositId: string) => {
    try {
      await deleteDoc(doc(db, 'deposits', depositId));
      setDepositToDelete(null);
      setToast({ message: 'Deposit record deleted.', type: 'success' });
    } catch (error) {
      console.error('Error deleting deposit:', error);
      handleFirestoreError(error, OperationType.DELETE, `deposits/${depositId}`);
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      setOrderToDelete(null);
    } catch (error) {
      console.error('Error deleting order:', error);
      handleFirestoreError(error, OperationType.DELETE, `orders/${orderId}`);
    }
  };

  // Service Management
  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...serviceForm,
        price: parseFloat(serviceForm.price)
      };

      if (editingService) {
        await updateDoc(doc(db, 'services', editingService.id), data);
      } else {
        await addDoc(collection(db, 'services'), data);
      }
      setIsServiceModalOpen(false);
      setEditingService(null);
      setServiceForm({ name: '', price: '', category: '', platform: '', description: '', averageTime: '', image: '' });
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const deleteService = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'services', id));
      setServiceToDelete(null);
      setToast({ message: 'Service deleted successfully!', type: 'success' });
    } catch (error) {
      console.error('Error deleting service:', error);
      setToast({ message: 'Failed to delete service.', type: 'error' });
    }
  };

  // Settings Management
  const updateSettings = async (field: string, value: string) => {
    try {
      await setDoc(doc(db, 'settings', 'site'), { [field]: value }, { merge: true });
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  // User Management
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userBalanceForm, setUserBalanceForm] = useState('');

  const handleUpdateBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await updateDoc(doc(db, 'users', editingUser.id), {
        balance: parseFloat(userBalanceForm)
      });
      setEditingUser(null);
      setUserBalanceForm('');
      setToast({ message: 'Balance updated successfully!', type: 'success' });
    } catch (error) {
      console.error('Error updating balance:', error);
      setToast({ message: 'Failed to update balance.', type: 'error' });
    }
  };

  const filteredDeposits = deposits.filter(deposit => 
    deposit.transactionId?.toLowerCase().includes(depositSearch.toLowerCase()) ||
    deposit.userId?.toLowerCase().includes(depositSearch.toLowerCase())
  );

  if (authLoading) return <div className="text-white text-center py-20">Loading...</div>;
  if (!isAdmin) return <div className="text-red-500 text-center py-20 font-bold">ACCESS DENIED. ADMINS ONLY.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-6">
        <h1 className="text-4xl font-display font-black text-white tracking-tighter">
          ADMIN <span className="text-gold">PANEL</span>
        </h1>
        
        <div className="flex flex-wrap bg-white/5 p-1 rounded-2xl border border-white/10">
          {[
            { id: 'orders', icon: ShoppingBag, label: 'Orders' },
            { id: 'users', icon: Users, label: 'Users' },
            { id: 'deposits', icon: Wallet, label: 'Deposits' },
            { id: 'services', icon: Package, label: 'Services' },
            { id: 'settings', icon: Settings, label: 'Settings' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all text-sm ${
                activeTab === tab.id ? 'bg-gold text-black shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon size={18} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        {activeTab === 'orders' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gold uppercase tracking-widest">Order ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-gold uppercase tracking-widest">Customer</th>
                  <th className="px-6 py-4 text-xs font-bold text-gold uppercase tracking-widest">Service & Link</th>
                  <th className="px-6 py-4 text-xs font-bold text-gold uppercase tracking-widest text-center">Quantity</th>
                  <th className="px-6 py-4 text-xs font-bold text-gold uppercase tracking-widest">Total</th>
                  <th className="px-6 py-4 text-xs font-bold text-gold uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gold uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order) => (
                  <tr 
                    key={order.id} 
                    className={`transition-all duration-500 ${
                      order.status?.toLowerCase() === 'completed' || order.status?.toLowerCase() === 'delivered' 
                        ? 'bg-green-500/10 shadow-[inset_0_0_20px_rgba(34,197,94,0.1)] border-l-4 border-green-500' 
                        : 'hover:bg-white/5 border-l-4 border-transparent'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-gray-400 mb-1">{order.orderNumber || `#${order.id.slice(0, 8)}`}</div>
                      <div className="text-[8px] text-gray-600 uppercase tracking-widest">Serial ID</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-white">
                        {order.userName || users.find(u => u.id === order.userId)?.displayName || order.userEmail || 'Anonymous'}
                      </div>
                      <div className="text-[10px] text-gray-500">{order.userEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[10px] text-[#39FF14] font-black uppercase tracking-tighter mb-2 bg-[#39FF14]/5 inline-block px-2 py-0.5 rounded border border-[#39FF14]/10">{order.serviceName}</div>
                      <div className="flex items-center gap-2 group/link mb-2">
                        <div className="text-[10px] text-gray-400 truncate max-w-[150px] font-mono">{order.link}</div>
                        <div className="flex items-center gap-1 opacity-0 group-hover/link:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(order.link);
                              // Simple visual feedback could be added here if needed
                            }}
                            className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-gold transition-all"
                            title="Copy Link"
                          >
                            <Copy size={12} />
                          </button>
                          <a 
                            href={order.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-gold transition-all"
                            title="Open Link"
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                      {order.customComments && (
                        <div className="p-2 bg-gold/5 border border-gold/20 rounded-xl">
                          <div className="text-[8px] font-black text-gold uppercase tracking-widest mb-1">Custom Comments</div>
                          <div className="text-[10px] text-gray-300 whitespace-pre-wrap break-words max-h-24 overflow-y-auto">
                            {order.customComments}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-base font-black text-white">{order.quantity.toLocaleString()}</div>
                      <div className="text-[8px] text-gray-500 uppercase tracking-[0.2em] font-bold">Quantity</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-black text-gold drop-shadow-[0_0_8px_rgba(255,215,0,0.3)]">৳{order.charge?.toFixed(2)}</div>
                      <div className="text-[8px] text-gray-600 uppercase tracking-widest">Total Cost</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                        order.status?.toLowerCase() === 'delivered' || order.status?.toLowerCase() === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]' :
                        order.status?.toLowerCase() === 'cancelled' || order.status?.toLowerCase() === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        'bg-gold/10 text-gold border-gold/20 shadow-[0_0_15px_rgba(255,215,0,0.1)]'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                          order.status?.toLowerCase() === 'delivered' || order.status?.toLowerCase() === 'completed' ? 'bg-green-500 animate-pulse' :
                          order.status?.toLowerCase() === 'cancelled' || order.status?.toLowerCase() === 'rejected' ? 'bg-red-500' :
                          'bg-gold animate-pulse'
                        }`}></div>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <select
                          value={order.status?.charAt(0).toUpperCase() + order.status?.slice(1).toLowerCase()}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="bg-black/40 border border-white/10 rounded-lg text-xs text-white p-1 focus:outline-none focus:border-gold"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        {order.status?.toLowerCase() !== 'completed' && (
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'Completed')}
                            className="px-3 py-1 bg-green-500/20 text-green-500 rounded-lg border border-green-500/30 hover:bg-green-500 hover:text-black transition-all duration-300 text-[10px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(34,197,94,0.2)] hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]"
                          >
                            Complete
                          </button>
                        )}
                        <button onClick={() => setOrderToDelete(order.id)} className="text-gray-500 hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-20" />
                      <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No orders found in the system</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'users' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gold uppercase tracking-widest">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gold uppercase tracking-widest">Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-gold uppercase tracking-widest">Phone</th>
                  <th className="px-6 py-4 text-xs font-bold text-gold uppercase tracking-widest">Balance</th>
                  <th className="px-6 py-4 text-xs font-bold text-gold uppercase tracking-widest">Joined</th>
                  <th className="px-6 py-4 text-xs font-bold text-gold uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-white">{user.displayName || 'Unnamed'}</div>
                      {user.role === 'admin' && (
                        <span className="text-[10px] bg-gold text-black px-2 py-0.5 rounded-full font-black uppercase">Admin</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{user.phoneNumber || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm font-black text-[#39FF14]">৳{user.balance || 0}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => {
                          setEditingUser(user);
                          setUserBalanceForm((user.balance || 0).toString());
                        }}
                        className="p-2 text-gold hover:bg-gold/10 rounded-lg transition-all"
                        title="Edit Balance"
                      >
                        <Edit2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'deposits' ? (
          <div className="space-y-4">
            <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex items-center">
              <div className="relative flex-grow max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  placeholder="Search by TrxID or UserID..."
                  value={depositSearch}
                  onChange={(e) => setDepositSearch(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-gold"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gold uppercase tracking-widest">Method</th>
                    <th className="px-6 py-4 text-xs font-bold text-gold uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-xs font-bold text-gold uppercase tracking-widest">TrxID</th>
                    <th className="px-6 py-4 text-xs font-bold text-gold uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gold uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredDeposits.map((deposit) => (
                    <tr key={deposit.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-white uppercase">{deposit.method}</div>
                        <div className="text-[10px] text-gray-500">{deposit.userId}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-[#39FF14]">৳{deposit.amount}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">{deposit.transactionId}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          deposit.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                          deposit.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                          'bg-gold/10 text-gold'
                        }`}>
                          {deposit.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {deposit.status === 'pending' && (
                            <>
                              <button onClick={() => approveDeposit(deposit)} className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition-all">
                                <CheckCircle size={18} />
                              </button>
                              <button onClick={() => rejectDeposit(deposit.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                                <X size={18} />
                              </button>
                            </>
                          )}
                          <button onClick={() => setDepositToDelete(deposit.id)} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'services' ? (
          <div className="p-6">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Manage Services</h3>
              <button
                onClick={() => {
                  setEditingService(null);
                  setServiceForm({ name: '', price: '', category: '', platform: '', description: '', averageTime: '', image: '' });
                  setIsServiceModalOpen(true);
                }}
                className="flex items-center space-x-2 bg-gold text-black px-4 py-2 rounded-xl font-black uppercase tracking-widest text-xs hover:shadow-lg transition-all"
              >
                <Plus size={16} />
                <span>Add Service</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div key={service.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-gold/30 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] font-black text-gold uppercase tracking-widest bg-gold/10 px-2 py-0.5 rounded mb-2 inline-block">
                        {service.platform}
                      </span>
                      <h4 className="text-white font-bold">{service.name}</h4>
                    </div>
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingService(service);
                          setServiceForm({
                            name: service.name,
                            price: service.price.toString(),
                            category: service.category,
                            platform: service.platform,
                            description: service.description,
                            averageTime: service.averageTime || '',
                            image: service.image || ''
                          });
                          setIsServiceModalOpen(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gold"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => setServiceToDelete(service.id)} className="p-1.5 text-gray-400 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                    <span className="text-xs text-gray-500">{service.category}</span>
                    <span className="text-sm font-black text-[#39FF14]">${service.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 space-y-8">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Site Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="block text-xs font-black text-gold uppercase tracking-widest">bKash Personal Number</label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    defaultValue={siteSettings?.bkashNumber || '01783707137'}
                    onBlur={(e) => updateSettings('bkashNumber', e.target.value)}
                    className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold"
                  />
                  <button className="p-3 bg-gold/10 text-gold rounded-xl border border-gold/20">
                    <Save size={20} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-black text-gold uppercase tracking-widest">Nagad Personal Number</label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    defaultValue={siteSettings?.nagadNumber || '01783707137'}
                    onBlur={(e) => updateSettings('nagadNumber', e.target.value)}
                    className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold"
                  />
                  <button className="p-3 bg-gold/10 text-gold rounded-xl border border-gold/20">
                    <Save size={20} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-black text-gold uppercase tracking-widest">WhatsApp Support Link</label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    defaultValue={siteSettings?.whatsappLink || 'https://wa.me/8801783707137'}
                    onBlur={(e) => updateSettings('whatsappLink', e.target.value)}
                    className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold"
                  />
                  <button className="p-3 bg-gold/10 text-gold rounded-xl border border-gold/20">
                    <Save size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 right-8 z-[200] px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 border ${
              toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="font-bold text-sm uppercase tracking-widest">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {orderToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOrderToDelete(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            ></motion.div>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 shadow-2xl text-center"
            >
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Delete Order?</h3>
              <p className="text-gray-400 mb-8">This action cannot be undone. Are you sure you want to delete this order?</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setOrderToDelete(null)}
                  className="py-4 rounded-xl font-black uppercase tracking-widest text-xs border border-white/10 text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteOrder(orderToDelete)}
                  className="py-4 rounded-xl font-black uppercase tracking-widest text-xs bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deposit Delete Confirmation Modal */}
      <AnimatePresence>
        {depositToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDepositToDelete(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            ></motion.div>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 shadow-2xl text-center"
            >
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Delete Deposit?</h3>
              <p className="text-gray-400 mb-8">This action cannot be undone. Are you sure you want to delete this deposit record?</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDepositToDelete(null)}
                  className="py-4 rounded-xl font-black uppercase tracking-widest text-xs border border-white/10 text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteDeposit(depositToDelete)}
                  className="py-4 rounded-xl font-black uppercase tracking-widest text-xs bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {serviceToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setServiceToDelete(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            ></motion.div>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 shadow-2xl text-center"
            >
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Delete Service?</h3>
              <p className="text-gray-400 mb-8">This action cannot be undone. Are you sure you want to delete this service?</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setServiceToDelete(null)}
                  className="py-4 rounded-xl font-black uppercase tracking-widest text-xs border border-white/10 text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteService(serviceToDelete)}
                  className="py-4 rounded-xl font-black uppercase tracking-widest text-xs bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Balance Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingUser(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            ></motion.div>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Edit Balance</h3>
                <button onClick={() => setEditingUser(null)} className="text-gray-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-1">Editing balance for:</p>
                <p className="text-lg font-bold text-white">{editingUser.displayName || editingUser.email}</p>
              </div>

              <form onSubmit={handleUpdateBalance} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">New Balance (৳)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={userBalanceForm}
                    onChange={(e) => setUserBalanceForm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold"
                  />
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full bg-gold text-black py-4 rounded-xl font-black uppercase tracking-widest hover:shadow-lg transition-all">
                    Update Balance
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Service Modal */}
      <AnimatePresence>
        {isServiceModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsServiceModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            ></motion.div>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                  {editingService ? 'Edit Service' : 'Add New Service'}
                </h3>
                <button onClick={() => setIsServiceModalOpen(false)} className="text-gray-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleServiceSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gold uppercase tracking-widest">Service Name</label>
                  <input
                    required
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gold uppercase tracking-widest">Price ($ per 1k)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({...serviceForm, price: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gold uppercase tracking-widest">Platform</label>
                  <select
                    required
                    value={serviceForm.platform}
                    onChange={(e) => setServiceForm({...serviceForm, platform: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold"
                  >
                    <option value="">Select Platform</option>
                    <option value="Facebook">Facebook</option>
                    <option value="YouTube">YouTube</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Telegram">Telegram</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gold uppercase tracking-widest">Category</label>
                  <input
                    required
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({...serviceForm, category: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-gold uppercase tracking-widest">Description</label>
                  <textarea
                    required
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold h-24 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gold uppercase tracking-widest">Average Delivery Time</label>
                  <input
                    value={serviceForm.averageTime}
                    onChange={(e) => setServiceForm({...serviceForm, averageTime: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gold uppercase tracking-widest">Image URL</label>
                  <input
                    value={serviceForm.image}
                    onChange={(e) => setServiceForm({...serviceForm, image: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold"
                  />
                </div>
                <div className="md:col-span-2 pt-4">
                  <button type="submit" className="w-full bg-gold text-black py-4 rounded-xl font-black uppercase tracking-widest hover:shadow-lg transition-all">
                    {editingService ? 'Update Service' : 'Create Service'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
