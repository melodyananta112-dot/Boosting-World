import React from 'react';
import { motion } from 'motion/react';
import { Product } from '../types';
import { MessageCircle, Rocket } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { user, userProfile } = useAuth();

  const handleOrder = async () => {
    try {
      // Save order to Firestore for Admin Panel tracking
      if (user) {
        await addDoc(collection(db, 'orders'), {
          userId: user.uid,
          items: [{ id: product.id, name: product.name, quantity: 1, price: product.price }],
          totalAmount: product.price,
          status: 'pending',
          createdAt: new Date().toISOString(),
          customerPhone: userProfile?.phoneNumber || '',
          customerName: userProfile?.displayName || user.displayName || 'Anonymous',
        });
      }

      const message = `New Order from Boosting World:%0A%0A` + 
        `- ${product.name}: $${product.price}` + 
        `%0A%0A*Total: $${product.price}*`;
      window.open(`https://wa.me/8801783707137?text=${message}`, '_blank');
    } catch (error) {
      console.error('Error processing order:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden neon-border hover:border-gold/40 transition-all duration-500 group"
    >
      <div className="aspect-square overflow-hidden relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
      </div>
      <div className="p-6 relative">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-[10px] font-bold text-[#39FF14] uppercase tracking-[0.2em] mb-1.5 drop-shadow-[0_0_8px_rgba(57,255,20,0.4)]">
              {product.platform} // {product.category}
            </p>
            <h3 className="text-xl font-bold text-white leading-tight group-hover:text-gold transition-colors duration-300">
              {product.name}
            </h3>
          </div>
          <div className="text-right">
            <p className="text-xl font-black text-gold drop-shadow-[0_0_10px_rgba(255,215,0,0.4)]">
              ${product.price}
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-400 line-clamp-2 mb-6 font-medium">
          {product.description}
        </p>
        <div className="flex space-x-3">
          <button
            onClick={handleOrder}
            className="flex-1 bg-gradient-to-r from-gold to-gold-dark text-black py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Order Now</span>
          </button>
          <button 
            onClick={handleOrder}
            className="px-5 bg-white/5 text-[#39FF14] py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#39FF14]/10 transition-all border border-[#39FF14]/20 flex items-center space-x-2"
          >
            <Rocket className="h-4 w-4" />
            <span>Boost</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
