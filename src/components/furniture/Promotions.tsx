import React, { useState } from 'react';
import { 
  Megaphone, Ticket, Users, MessageSquare, Star, 
  Plus, Search, Filter, Trash2, Edit3, 
  Gift, Heart, TrendingUp, Send, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Promotions = () => {
  const [activeTab, setActiveTab] = useState<'coupons' | 'loyalty' | 'feedback'>('coupons');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
         <div className="flex items-center gap-2 p-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
            {[
              { id: 'coupons', label: 'Campaigns', icon: Megaphone },
              { id: 'loyalty', label: 'Loyalty Tiers', icon: Heart },
              { id: 'feedback', label: 'Customer Reviews', icon: MessageSquare }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
                  activeTab === tab.id ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
         </div>

         <button 
           className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all font-sans"
         >
           <Plus size={18} />
           Create {activeTab === 'coupons' ? 'Offer' : activeTab === 'loyalty' ? 'Tier' : 'Broadcast'}
         </button>
      </div>

      {activeTab === 'coupons' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[
             { code: 'WINTER50', type: 'Percentage', val: '50% OFF', category: 'Furniture', used: 142, status: 'Active' },
             { code: 'DIWALI2023', type: 'Flat', val: '₹5,000 OFF', category: 'Electronics', used: 89, status: 'Active' },
             { code: 'BUN_FURNI', type: 'Bundle', val: 'Combo Deal', category: 'Global', used: 12, status: 'Expired' },
           ].map((c, i) => (
             <div key={i} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className={`absolute top-0 right-0 p-4 font-black uppercase text-[10px] tracking-widest ${
                   c.status === 'Active' ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'
                }`}>
                   {c.status}
                </div>
                
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                   <Ticket size={32} />
                </div>
                
                <h3 className="text-2xl font-black text-gray-900 mb-1">{c.code}</h3>
                <p className="text-primary font-black text-lg mb-4">{c.val}</p>
                
                <div className="space-y-3 pt-6 border-t border-gray-50">
                   <div className="flex justify-between text-xs font-bold">
                      <span className="text-gray-400">Target</span>
                      <span className="text-gray-900">{c.category}</span>
                   </div>
                   <div className="flex justify-between text-xs font-bold">
                      <span className="text-gray-400">Total Uses</span>
                      <span className="text-gray-900">{c.used} Users</span>
                   </div>
                </div>

                <div className="mt-8 flex gap-2">
                   <button className="flex-1 py-3 bg-gray-50 text-gray-900 rounded-xl font-bold text-xs hover:bg-gray-100 transition-all">Analytics</button>
                   <button className="w-12 h-12 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:text-red-500 hover:bg-red-50"><Trash2 size={18}/></button>
                </div>
             </div>
           ))}
        </div>
      )}

      {activeTab === 'loyalty' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {[
             { name: 'Silver Elite', points: '1,000 - 5,000', perk: '5% extra Cashback', color: 'bg-gray-400', font: 'text-gray-400' },
             { name: 'Gold Prestige', points: '5,000 - 20,000', perk: 'Free Home Delivery + Installation', color: 'bg-yellow-500', font: 'text-yellow-600' },
             { name: 'Platinum Privé', points: '20,000+', perk: 'Priority Support + 12 Month Extra Warranty', color: 'bg-indigo-600', font: 'text-indigo-600' },
           ].map((tier, i) => (
             <div key={i} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm text-center flex flex-col items-center">
                <div className={`w-20 h-20 ${tier.color} rounded-full flex items-center justify-center text-white shadow-xl mb-6`}>
                   <Star size={32} />
                </div>
                <h3 className={`text-2xl font-black mb-2 ${tier.font}`}>{tier.name}</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-[2px] mb-8">{tier.points} Points</p>
                
                <div className="bg-gray-50 p-6 rounded-3xl w-full text-left mb-8">
                   <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2">Key Privileges</span>
                   <p className="text-sm font-medium text-gray-900 leading-relaxed">{tier.perk}</p>
                </div>

                <button className="w-full py-4 border-2 border-gray-100 text-gray-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:border-primary hover:text-primary transition-all">
                   Manage Members
                </button>
             </div>
           ))}
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
           <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black text-gray-900">Recent Customer Reviews</h3>
              <div className="flex items-center gap-2">
                 <span className="text-2xl font-black text-gray-900">4.8</span>
                 <div className="flex text-orange-400"><Star size={18}/><Star size={18}/><Star size={18}/><Star size={18}/><Star size={18}/></div>
                 <span className="text-xs font-bold text-gray-400 ml-2">(1,240 Total)</span>
              </div>
           </div>

           <div className="space-y-6">
              {[
                { user: 'Rahul Sharma', rating: 5, comment: 'Purchased a Sofa last month. The quality is exceptional and the delivery team was very professional!', time: '2 hours ago', product: 'Premium Sofa' },
                { user: 'Sonia Verma', rating: 4, comment: 'Good smart TV, but the installation was delayed by one day. Overall satisfied with the product.', time: '1 day ago', product: 'OLED TV 55' },
              ].map((rev, i) => (
                <div key={i} className="p-8 bg-gray-50 rounded-[2.5rem] border border-transparent hover:border-gray-200 transition-all">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-primary border border-gray-100 shadow-sm">{rev.user[0]}</div>
                         <div>
                            <p className="font-bold text-gray-900">{rev.user}</p>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{rev.time} • Bought {rev.product}</span>
                         </div>
                      </div>
                      <div className="flex gap-1 text-orange-400">
                         {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < rev.rating ? 'currentColor' : 'none'} />)}
                      </div>
                   </div>
                   <p className="text-gray-600 font-medium leading-relaxed italic">"{rev.comment}"</p>
                   
                   <div className="mt-6 flex gap-4">
                      <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Reply to Customer</button>
                      <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:underline">Feature on Store</button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};
