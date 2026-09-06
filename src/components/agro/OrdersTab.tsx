import React, { useState } from 'react';
import { 
  ClipboardList, Search, Plus, Filter, Calendar, 
  ChevronRight, ArrowUpRight, ArrowDownLeft, X,
  CheckCircle2, Clock, Ban, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../lib/firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { AgroState, AgroOrder } from './types';
import { handleFirestoreError, OperationType } from '../../lib/firebase';
import { LoadingSpinner } from './ui/LoadingSpinner';

export const OrdersTab: React.FC<{ state: AgroState; shopId: string | null }> = ({ state, shopId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [newOrder, setNewOrder] = useState<Partial<AgroOrder>>({
    type: 'Sale',
    partyName: '',
    items: [],
    totalAmount: 0,
    status: 'Pending',
    date: new Date().toISOString().split('T')[0]
  });

  const filteredOrders = state.orders
    .filter(o => 
      o.partyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      o.orderNo?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(o => statusFilter === 'All' || o.status === statusFilter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;
    setIsProcessing(true);
    
    try {
      const orderNo = `ORD-${Date.now().toString().slice(-6)}`;
      await addDoc(collection(db, 'agro_shops', shopId, 'orders'), {
        ...newOrder,
        orderNo,
        createdAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      setNewOrder({
        type: 'Sale',
        partyName: '',
        items: [],
        totalAmount: 0,
        status: 'Pending',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `agro_shops/${shopId}/orders`);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateStatus = async (orderId: string, status: AgroOrder['status']) => {
    if (!shopId) return;
    try {
      await updateDoc(doc(db, 'agro_shops', shopId, 'orders', orderId), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `agro_shops/${shopId}/orders/${orderId}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'text-emerald-500 bg-emerald-50';
      case 'Cancelled': return 'text-red-500 bg-red-50';
      case 'Confirmed': return 'text-blue-500 bg-blue-50';
      default: return 'text-orange-500 bg-orange-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Delivered': return <CheckCircle2 size={14} />;
      case 'Cancelled': return <Ban size={14} />;
      case 'Confirmed': return <Package size={14} />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase italic">Orders & <span className="text-primary italic">Booking</span></h2>
          <p className="text-gray-500 text-xs font-black uppercase tracking-widest mt-1">Manage customer and supplier orders</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-4 bg-primary text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-2 hover:bg-black transition-all"
        >
          <Plus size={18} />
          Create Order
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search orders, parties, numbers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-gray-900 border-none rounded-[2rem] pl-16 pr-8 py-5 text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-primary/5 transition-all"
          />
        </div>
        <div className="md:col-span-4 flex gap-2">
          <div className="flex-1 relative">
            <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" size={16} />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border-none rounded-[2rem] pl-14 pr-8 py-5 text-xs font-black uppercase tracking-widest shadow-sm outline-none appearance-none"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {state.loading ? (
        <LoadingSpinner label="Fetching Live Orders..." />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Info</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Party Name</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredOrders.length > 0 ? filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${o.type === 'Sale' ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500'}`}>
                          {o.type === 'Sale' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">{o.orderNo}</p>
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                            <Calendar size={10} /> {o.date}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-tight">{o.partyName}</p>
                      <p className="text-[8px] font-medium text-gray-400 mt-0.5">{o.type === 'Sale' ? 'Customer' : 'Supplier'}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <p className="text-[12px] font-black text-gray-900 dark:text-white font-mono italic">₹{o.totalAmount.toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center">
                        <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 ${getStatusColor(o.status)}`}>
                          {getStatusIcon(o.status)} {o.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-end gap-2">
                        {o.status === 'Pending' && (
                          <>
                            <button 
                              onClick={() => updateStatus(o.id, 'Confirmed')}
                              className="p-2 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-100 transition-colors"
                              title="Confirm Order"
                            >
                              <Package size={16} />
                            </button>
                            <button 
                              onClick={() => updateStatus(o.id, 'Cancelled')}
                              className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                              title="Cancel Order"
                            >
                              <Ban size={16} />
                            </button>
                          </>
                        )}
                        {o.status === 'Confirmed' && (
                          <button 
                            onClick={() => updateStatus(o.id, 'Delivered')}
                            className="p-2 bg-emerald-50 text-emerald-500 rounded-xl hover:bg-emerald-100 transition-colors"
                            title="Mark Delivered"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <ClipboardList size={48} className="mx-auto text-gray-200 mb-4" />
                      <p className="text-sm font-black text-gray-400 uppercase tracking-widest italic">No orders found matching filters</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-[3.5rem] shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleCreateOrder} className="p-10">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase italic">Create New <span className="text-primary italic">Order</span></h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Enter booking details</p>
                  </div>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-2xl hover:text-red-500 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Order Type</label>
                      <select 
                        required
                        value={newOrder.type}
                        onChange={(e) => setNewOrder({ ...newOrder, type: e.target.value as any })}
                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/5 appearance-none"
                      >
                        <option value="Sale">Sale (Customer)</option>
                        <option value="Purchase">Purchase (Supplier)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Order Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input 
                            required
                            type="date"
                            value={newOrder.date}
                            onChange={(e) => setNewOrder({ ...newOrder, date: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl pl-14 pr-6 py-4 text-xs font-black outline-none focus:ring-4 focus:ring-primary/5"
                          />
                        </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Party Name</label>
                    <input 
                      required
                      type="text"
                      placeholder="Enter customer or supplier name..."
                      value={newOrder.partyName}
                      onChange={(e) => setNewOrder({ ...newOrder, partyName: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/5 italic"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Estimated Total Amount</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                      <input 
                        required
                        type="number"
                        placeholder="0.00"
                        value={newOrder.totalAmount || ''}
                        onChange={(e) => setNewOrder({ ...newOrder, totalAmount: Number(e.target.value) })}
                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl pl-10 pr-6 py-4 text-xs font-black outline-none focus:ring-4 focus:ring-primary/5 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                  <button 
                    disabled={isProcessing}
                    className="w-full py-5 bg-primary text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isProcessing ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <ClipboardList size={18} />}
                    Create Order Entry
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
