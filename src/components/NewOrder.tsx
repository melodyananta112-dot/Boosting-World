import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Facebook, Youtube, Instagram, Send, Music2, LayoutGrid, AlertTriangle, CheckCircle2, Phone, X, AlertCircle } from 'lucide-react';
import { collection, query, onSnapshot, orderBy, doc, addDoc, updateDoc, serverTimestamp, runTransaction, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import ProductGrid from './ProductGrid';
import { Product } from '../types';
import { products as localProducts } from '../data/products';
import { useAuth } from './AuthProvider';
import { Link, useNavigate } from 'react-router-dom';

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

const NewOrder: React.FC = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>(localProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('Facebook');
  const [selectedCategory, setSelectedCategory] = useState<string>('Select Category');
  const [selectedService, setSelectedService] = useState<string>('Select Service');
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState<string>('');
  const [customComments, setCustomComments] = useState('');
  const [showLowBalanceModal, setShowLowBalanceModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const isCustomCommentService = selectedService === '#0036 Bangladeshi Page Review । Custom' || selectedService === '#0028 Bangladeshi Custom Comment' || selectedService === '#0084 YouTube Bangladeshi Custom Comment' || selectedService === '#0101 💬 Tiktok Custom Comment 💬' || selectedService === '#0113 💬 Instragram Custom Comment 💬';

  useEffect(() => {
    if (isCustomCommentService) {
      const lines = customComments.split('\n').filter(line => line.trim() !== '');
      setQuantity(lines.length > 0 ? lines.length.toString() : '');
    }
  }, [customComments, selectedService, isCustomCommentService]);

  const [submitting, setSubmitting] = useState(false);
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
          initial={{ opacity: 0, y: -50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`fixed top-10 left-1/2 z-[200] flex items-center gap-4 px-8 py-5 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.3)] backdrop-blur-xl border-2 min-w-[320px] max-w-[90vw] justify-center ${
            toast.type === 'success' 
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.3)]' 
              : 'bg-red-500/20 border-red-500/40 text-red-400 shadow-[0_0_40px_rgba(248,113,113,0.3)]'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={24} className="drop-shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
          ) : (
            <AlertCircle size={24} className="drop-shadow-[0_0_10px_rgba(248,113,113,0.6)]" />
          )}
          <span className="font-black text-lg tracking-tight text-center">{toast.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const [siteSettings, setSiteSettings] = useState({
    bkashNumber: '01783707137',
    whatsappLink: 'https://wa.me/8801783707137'
  });

  useEffect(() => {
    const q = query(collection(db, 'services'), orderBy('name', 'asc'));
    const unsubscribeServices = onSnapshot(q, (snapshot) => {
      const servicesData = snapshot.docs.map(doc => ({
        id: doc.id as any,
        ...doc.data()
      })) as Product[];
      
      if (servicesData.length > 0) {
        setProducts(servicesData);
      }
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'services'));

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'site'), (doc) => {
      if (doc.exists()) {
        setSiteSettings(doc.data() as any);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/site'));

    return () => {
      unsubscribeServices();
      unsubscribeSettings();
    };
  }, []);

  const platforms = [
    { 
      name: 'Facebook', 
      logo: 'https://img.icons8.com/color/48/facebook-new.png', 
      color: 'from-blue-600 to-blue-800' 
    },
    { 
      name: 'YouTube', 
      logo: 'https://img.icons8.com/color/48/youtube-play.png', 
      color: 'from-red-600 to-red-800' 
    },
    { 
      name: 'TikTok', 
      logo: 'https://img.icons8.com/color/48/tiktok--v1.png', 
      color: 'from-pink-400 to-rose-500' 
    },
    { 
      name: 'Instagram', 
      logo: 'https://img.icons8.com/color/48/instagram-new--v1.png', 
      color: 'from-orange-600 to-pink-600' 
    },
    { 
      name: 'Telegram', 
      logo: 'https://img.icons8.com/color/48/telegram-app.png', 
      color: 'from-sky-500 to-sky-700' 
    },
  ];

  const categories = [
    'Select Category',
    ...Array.from(new Set([
      ...(selectedPlatform === 'Facebook' ? [
        '👥 Bangladeshi Facebook Id Follower 👥',
        '👥 Bangladeshi Facebook Page Follower 👥',
        'Bangladeshi Single Any React👍❤️🥰😆😮😥😡',
        'Bangladeshi Mixed React',
        '👥Facebook Page Like + Follow ( Bangladeshi + MIxed )',
        '👥Facebook Page Like + Follower । World Wide',
        '🧐Facebook Page Review 🔥',
        '💬 Facebook / Page Bangladeshi Comment',
        '👀 Facebook View 👀🔥',
        '🔁 Facebook Share',
        'BOT Single Any React👍❤️🥰😆😮😥😡'
      ] : []),
      ...(selectedPlatform === 'TikTok' ? [
        '👥 Tiktok Follower 👥',
        '👥 Tiktok ( Target )Follower 👥',
        '👀  Tiktok Views  👀',
        '❤️ Tiktok Likes ❤️',
        '💬 Tiktok Comment 💬',
        '🔴 Tiktok Live Stream View 🔴',
        '🔁 Tiktok Share 🔁'
      ] : []),
      ...(selectedPlatform === 'Instagram' ? [
        '👥 Instragram Bangladeshi Follower 👥',
        '❤️ Instragram Likes ❤️',
        '🔁 Instragram Share 🔁',
        '💬 Instragram Comment 💬',
        '👀 Instragram View 👀',
        '⟳ Instragram Re-post ⟳',
        '👤 Instragram Profile Visit 👤'
      ] : []),
      ...(selectedPlatform === 'Telegram' ? [
        '👀 Telegram Post View 👀',
        '👀 Telegram Story View  👀',
        '⭐ Telegram Post Reaction ⭐',
        '🔁 Telegram Post  Share 🔁',
        '🙋🏻♂️ Telegram Member 🙋🏻♂️'
      ] : []),
      ...(selectedPlatform === 'YouTube' ? [
        '⌚YouTube Watch Time ⌚',
        '👀 YouTube Video View 👀',
        '👀 YouTube Native Ads View 👀',
        'YouTube Bangladeshi Subscriber',
        'YouTube Video Likes',
        'YouTube Targeted Video Likes',
        'YouTube Short Reels Like',
        '👀 YouTube LIve Stream Viewrs 👀',
        '🔁 YouTube VIdeo Share 🔁',
        '💬 YouTube Comment 💬'
      ] : []),
      ...products
        .filter(p => p.platform === selectedPlatform)
        .map(p => p.category)
    ]))
  ];

  const services = [
    'Select Service',
    ...Array.from(new Set([
      ...(selectedPlatform === 'Facebook' ? [
        ...(selectedCategory === '👥 Bangladeshi Facebook Id Follower 👥' || searchTerm ? ['#0001 👥 Bangladeshi Facebook Id Follower 👥'] : []),
        ...(selectedCategory === '👥 Bangladeshi Facebook Page Follower 👥' || searchTerm ? ['#0002 👥 Bangladeshi Facebook Page Follower 👥'] : []),
        ...(selectedCategory === 'Bangladeshi Single Any React👍❤️🥰😆😮😥😡' || searchTerm ? ['#0004 👥 Bangladeshi Single React 👍', '#0005 Bangladeshi Single React ❤️', '#0006 Bangladeshi Single React 🥰', '#0007 Bangladeshi Single React 😆', '#0008 Bangladeshi Single React 😮', '#0009 Bangladeshi Single React 😥', '#0010 Bangladeshi Single React 😡'] : []),
        ...(selectedCategory === 'Bangladeshi Mixed React' || searchTerm ? ['#0018 Bangladeshi Mixed React 👍🥰 ( Like + Care )', '#0019 Bangladeshi Mixed React 👍😆 ( Like + Haha )', '#0020 Bangladeshi Mixed React ❤️🥰 ( Love + Care )', '#0021 Bangladeshi Mixed React ❤️😮 ( Love + Wow )', '#0022 Bangladeshi Mixed React 👍❤️🥰 ( Like + Love + Care )', '#0023 Bangladeshi Mixed React 👍❤️😮 ( Like + Love + Wow )', '#0024 Bangladeshi Mixed React 👍❤️😥 ( Like + Love + Sad )', '#0025 Bangladeshi Mixed React 👍❤️🥰😆 ( Like + Love + Care + Haha )', '#0026 Bangladeshi Mixed React 👍❤️🥰😆😮 ( Like + Love + Care + Haha + Wow )'] : []),
        ...(selectedCategory === '👥Facebook Page Like + Follow ( Bangladeshi + MIxed )' || searchTerm ? ['#0027 👥Facebook Page Like + Follow ( Bangladeshi + MIxed )'] : []),
        ...(selectedCategory === '👥Facebook Page Like + Follower । World Wide' || searchTerm ? ['#0033 Facebook Page Likes । Only Like Button Page', '#0034 Facebook Page Like + Follower'] : []),
        ...(selectedCategory === '🧐Facebook Page Review 🔥' || searchTerm ? ['#0035 Bangladeshi Page Review । Random', '#0036 Bangladeshi Page Review । Custom'] : []),
        ...(selectedCategory === '💬 Facebook / Page Bangladeshi Comment' || searchTerm ? ['#0028 Bangladeshi Custom Comment', '#0029 Bangladeshi Random Comment', '#0030 Bangladeshi Random Positive Comment', '#0031 Bangladeshi Random Negetive Comment'] : []),
        ...(selectedCategory === 'BOT Single Any React👍❤️🥰😆😮😥😡' || searchTerm ? ['#0011 BOT Single Any React 👍', '#0012 BOT Single Any React ❤️', '#0013 BOT Single Any React 🥰', '#0014 BOT Single Any React 😆', '#0015 BOT Single Any React 😮', '#0016 BOT Single Any React 😥', '#0017 BOT Single Any React 😡'] : [])
      ] : []),
      ...(selectedPlatform === 'YouTube' ? [
        ...(selectedCategory === '⌚YouTube Watch Time ⌚' || searchTerm ? ['#0037 YouTube Watch Time'] : []),
        ...(selectedCategory === '👀 YouTube Video View 👀' || searchTerm ? ['#0038 👀 YouTube Video View 👀'] : []),
        ...(selectedCategory === '👀 YouTube Native Ads View 👀' || searchTerm ? ['#0039 👀 YouTube Native Ads View 👀'] : []),
        ...(selectedCategory === 'YouTube Bangladeshi Subscriber' || searchTerm ? ['#0040 YouTube Bangladeshi Subscriber'] : []),
        ...(selectedCategory === 'YouTube Video Likes' || searchTerm ? ['#0041 YouTube Video Likes'] : []),
        ...(selectedCategory === 'YouTube Targeted Video Likes' || searchTerm ? [
          '#0044 Video Likes  I  Bangladesh',
          '#0045 Video Likes  I UK',
          '#0046 Video Likes  I  USA',
          '#0047 Video Likes  I  France',
          '#0048 Video Likes  I  Germany',
          '#0049 Video Likes  I  Greece',
          '#0050 Video Likes  I  Albania',
          '#0051 Video Likes  I  Australia',
          '#0052 Video Likes  I  Brazil',
          '#0053 Video Likes  I  Canada',
          '#0054 Video Likes  I  Eygpt',
          '#0055 Video Likes  I  Indian',
          '#0056 Video Likes  I  Indonesia',
          '#0057 Video Likes  I  Italy',
          '#0058 Video Likes  I  Japan',
          '#0059 Video Likes  I  Malaysia',
          '#0060 Video Likes  I  Belgium',
          '#0061 Video Likes  I  Mexico',
          '#0062 Video Likes  I  Morocco',
          '#0063 Video Likes  I  Romania',
          '#0064 Video Likes  I Portugal',
          '#0065 Video Likes  I  Rassia',
          '#0066 Video Likes  I  Saudi Arabia',
          '#0067 Video Likes  I  Netherlands',
          '#0068 Video Likes  I  Pakistan',
          '#0069 Video Likes  I  Spain',
          '#0070 Video Likes  I  Sweden',
          '#0071 Video Likes  I  Azerbaijan',
          '#0072 Video Likes  I  Czech',
          '#0073 Video Likes  I  Poland'
        ] : []),
        ...(selectedCategory === '🔁 YouTube VIdeo Share 🔁' || searchTerm ? ['#0042 🔁 YouTube VIdeo Share 🔁'] : []),
        ...(selectedCategory === 'YouTube Short Reels Like' || searchTerm ? ['#0043 YouTube Short Reels Like'] : []),
        ...(selectedCategory === '👀 YouTube LIve Stream Viewrs 👀' || searchTerm ? [
          '#0074 YouTube Live Stream View I 15 Minitue',
          '#0075 YouTube Live Stream View I 30 Minitue',
          '#0076 YouTube Live Stream View I 60 Minitue',
          '#0077 YouTube Live Stream View I 90 Minitue',
          '#0078 YouTube Live Stream View I 120 Minitue',
          '#0079 YouTube Live Stream View I 150 Minitue',
          '#0080 YouTube Live Stream View I 180 Minitue',
          '#0081 YouTube Live Stream View I 360 Minitue',
          '#0082 YouTube Live Stream View I 720 Minitue',
          '#0083 YouTube Live Stream View I 1440 Minitue'
        ] : []),
        ...(selectedCategory === '💬 YouTube Comment 💬' || searchTerm ? [
          '#0084 YouTube Bangladeshi Custom Comment',
          '#0085 YouTube Bangladeshi Random Comment'
        ] : [])
      ] : []),
      ...(selectedPlatform === 'TikTok' ? [
        ...(selectedCategory === '👥 Tiktok Follower 👥' || searchTerm ? ['#0086 TikTok Follower'] : []),
        ...(selectedCategory === '👥 Tiktok ( Target )Follower 👥' || searchTerm ? [
          '#0087 TikTok Target Follower I Pakistan',
          '#0088 TikTok Target Follower I USA',
          '#0089 TikTok Target Follower I UK',
          '#0090 TikTok Target Follower I Turkey',
          '#0091 TikTok Target Follower I India',
          '#0092 TikTok Target Follower I Thailand',
          '#0093 TikTok Target Follower I Egypt',
          '#0094 TikTok Target Follower I Nigeria',
          '#0095 TikTok Target Follower I UAE',
          '#0096 TikTok Target Follower I Soudi Arabia',
          '#0097 TikTok Target Follower I Australia',
          '#0098 TikTok Target Follower I Canada'
        ] : []),
        ...(selectedCategory === '👀  Tiktok Views  👀' || searchTerm ? ['#0099 👀 Tiktok VIew 👀'] : []),
        ...(selectedCategory === '❤️ Tiktok Likes ❤️' || searchTerm ? ['#0100 ❤️ Tiktok Like ❤️'] : []),
        ...(selectedCategory === '💬 Tiktok Comment 💬' || searchTerm ? ['#0101 💬 Tiktok Custom Comment 💬'] : []),
        ...(selectedCategory === '🔴 Tiktok Live Stream View 🔴' || searchTerm ? [
          '#0102 TikTok Live Stream View I 15 Minitue',
          '#0103 TikTok Live Stream View I 30 Minitue',
          '#0104 TikTok Live Stream View I 60 Minitue',
          '#0105 TikTok Live Stream View I 90 Minitue',
          '#0106 TikTok Live Stream View I 120 Minitue',
          '#0107 TikTok Live Stream View I 180 Minitue'
        ] : []),
        ...(selectedCategory === '🔁 Tiktok Share 🔁' || searchTerm ? ['#0108 Tiktok Share'] : [])
      ] : []),
      ...(selectedPlatform === 'Instagram' ? [
        ...(selectedCategory === '👥 Instragram Bangladeshi Follower 👥' || searchTerm ? [
          '#0109 Instagram Bangladeshi Follower I 1 Day',
          '#0110 Instragram Bangladeshi + Mixed Follower'
        ] : []),
        ...(selectedCategory === '❤️ Instragram Likes ❤️' || searchTerm ? ['#0111 ❤️ Instragram Like ❤️'] : []),
        ...(selectedCategory === '🔁 Instragram Share 🔁' || searchTerm ? ['#0112 Instagram Share'] : []),
        ...(selectedCategory === '💬 Instragram Comment 💬' || searchTerm ? [
          '#0113 💬 Instragram Custom Comment 💬',
          '#0114 Instragram Random / Emoji Comment'
        ] : []),
        ...(selectedCategory === '👀 Instragram View 👀' || searchTerm ? [
          '#0115 Instagram Video View',
          '#0116 Instagram Reels View',
          '#0117 Instagram Photo View',
          '#0118 Instagram Reach + Profile Visit'
        ] : []),
        ...(selectedCategory === '⟳ Instragram Re-post ⟳' || searchTerm ? ['#0119 Instragram Re-Post'] : []),
        ...(selectedCategory === '👤 Instragram Profile Visit 👤' || searchTerm ? ['#0120 Instragram Profile Visit'] : [])
      ] : []),
      ...(selectedPlatform === 'Telegram' ? [
        ...(selectedCategory === '👀 Telegram Post View 👀' || searchTerm ? ['#0121 Telegram Post View ( Single Post )'] : []),
        ...(selectedCategory === '👀 Telegram Story View  👀' || searchTerm ? ['#0122 Telegram Story View'] : []),
        ...(selectedCategory === '🔁 Telegram Post  Share 🔁' || searchTerm ? ['#0139 Telegram Post Share'] : []),
        ...(selectedCategory === '⭐ Telegram Post Reaction ⭐' || searchTerm ? [
          '#0123 Telegram Post Reaction + Views | 👍 🎉 🔥 ❤️ 🥰 🤩 👏 |',
          '#0124 Telegram - Post Reaction + Views | 👎 💩 🤮 🤨 🤯 😁 😟 🤬 |',
          '#0125 Mix Positive Reactions [ 👍 ❤️ 🔥 🎉 😁 + Free Views',
          '#0126 Telegram Reaction Like 👍 + Free Views',
          '#0127 Telegram Reaction Fire 🔥 + Free Views',
          '#0128 Telegram Reactions Positive | 👍 ❤️ 👏 🔥 🥰 🤩 🎉 😁 | Fast |',
          '#0129 Telegram Reaction Heart ❤️ + Free Views',
          '#0130 Mix Negative Reactions [ 👎 😱 💩 😟 🤮 ] + Free Views',
          '#0131 Telegram Reaction DisLike 👎 + Free Views',
          '#0132 Telegram Reaction party 🎉 + Free Views',
          '#0133 Telegram Reaction 🥰 + Free Views',
          '#0134 Telegram Reaction screaming face 😱 + Free Views',
          '#0135 Telegram Reaction beaming face 😁 + Free Views',
          '#0136 Telegram Reaction crying face 😢 + Free Views',
          '#0137 Telegram Reaction pile of poo 💩 + Free Views',
          '#0138 Telegram Reaction face vomiting 🤮 + Free Views'
        ] : [])
      ] : []),
      ...products
        .filter(p => p.platform === selectedPlatform && (selectedCategory === 'Select Category' || p.category === selectedCategory || searchTerm))
        .map(p => p.name)
    ]))
    .filter(service => 
      service === 'Select Service' || 
      service.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ];

  useEffect(() => {
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      
      // 1. Search in current platform first
      const currentMatchingServices = services.filter(s => s !== 'Select Service' && s.toLowerCase().includes(term));
      if (currentMatchingServices.length === 1) {
        setSelectedService(currentMatchingServices[0]);
        return;
      }

      // 2. Search globally across all platforms
      const allPlatforms = ['Facebook', 'YouTube', 'TikTok', 'Instagram', 'Telegram'];
      let globalMatches: { platform: string; service: string }[] = [];

      allPlatforms.forEach(platform => {
        // Hardcoded services for each platform
        const hardcoded: string[] = [];
        if (platform === 'Facebook') {
          hardcoded.push(
            '#0001 👥 Bangladeshi Facebook Id Follower 👥',
            '#0002 👥 Bangladeshi Facebook Page Follower 👥',
            '#0004 👥 Bangladeshi Single React 👍', '#0005 Bangladeshi Single React ❤️', '#0006 Bangladeshi Single React 🥰', '#0007 Bangladeshi Single React 😆', '#0008 Bangladeshi Single React 😮', '#0009 Bangladeshi Single React 😥', '#0010 Bangladeshi Single React 😡',
            '#0018 Bangladeshi Mixed React 👍🥰 ( Like + Care )', '#0019 Bangladeshi Mixed React 👍😆 ( Like + Haha )', '#0020 Bangladeshi Mixed React ❤️🥰 ( Love + Care )', '#0021 Bangladeshi Mixed React ❤️😮 ( Love + Wow )', '#0022 Bangladeshi Mixed React 👍❤️🥰 ( Like + Love + Care )', '#0023 Bangladeshi Mixed React 👍❤️😮 ( Like + Love + Wow )', '#0024 Bangladeshi Mixed React 👍❤️😥 ( Like + Love + Sad )', '#0025 Bangladeshi Mixed React 👍❤️🥰😆 ( Like + Love + Care + Haha )', '#0026 Bangladeshi Mixed React 👍❤️🥰😆😮 ( Like + Love + Care + Haha + Wow )',
            '#0027 👥Facebook Page Like + Follow ( Bangladeshi + MIxed )',
            '#0033 Facebook Page Likes । Only Like Button Page', '#0034 Facebook Page Like + Follower',
            '#0035 Bangladeshi Page Review । Random', '#0036 Bangladeshi Page Review । Custom',
            '#0028 Bangladeshi Custom Comment', '#0029 Bangladeshi Random Comment', '#0030 Bangladeshi Random Positive Comment', '#0031 Bangladeshi Random Negetive Comment',
            '#0011 BOT Single Any React 👍', '#0012 BOT Single Any React ❤️', '#0013 BOT Single Any React 🥰', '#0014 BOT Single Any React 😆', '#0015 BOT Single Any React 😮', '#0016 BOT Single Any React 😥', '#0017 BOT Single Any React 😡'
          );
        } else if (platform === 'YouTube') {
          hardcoded.push(
            '#0037 YouTube Watch Time',
            '#0038 👀 YouTube Video View 👀',
            '#0039 👀 YouTube Native Ads View 👀',
            '#0040 YouTube Bangladeshi Subscriber',
            '#0041 YouTube Video Likes',
            '#0044 Video Likes  I  Bangladesh', '#0045 Video Likes  I UK', '#0046 Video Likes  I  USA', '#0047 Video Likes  I  France', '#0048 Video Likes  I  Germany', '#0049 Video Likes  I  Greece', '#0050 Video Likes  I  Albania', '#0051 Video Likes  I  Australia', '#0052 Video Likes  I  Brazil', '#0053 Video Likes  I  Canada', '#0054 Video Likes  I  Eygpt', '#0055 Video Likes  I  Indian', '#0056 Video Likes  I  Indonesia', '#0057 Video Likes  I  Italy', '#0058 Video Likes  I  Japan', '#0059 Video Likes  I  Malaysia', '#0060 Video Likes  I  Belgium', '#0061 Video Likes  I  Mexico', '#0062 Video Likes  I  Morocco', '#0063 Video Likes  I  Romania', '#0064 Video Likes  I Portugal', '#0065 Video Likes  I  Rassia', '#0066 Video Likes  I  Saudi Arabia', '#0067 Video Likes  I  Netherlands', '#0068 Video Likes  I  Pakistan', '#0069 Video Likes  I  Spain', '#0070 Video Likes  I  Sweden', '#0071 Video Likes  I  Azerbaijan', '#0072 Video Likes  I  Czech', '#0073 Video Likes  I  Poland',
            '#0042 🔁 YouTube VIdeo Share 🔁',
            '#0043 YouTube Short Reels Like',
            '#0084 YouTube Bangladeshi Custom Comment', '#0085 YouTube Bangladeshi Random Comment',
            '#0074 YouTube Live Stream View I 15 Minitue', '#0075 YouTube Live Stream View I 30 Minitue', '#0076 YouTube Live Stream View I 60 Minitue', '#0077 YouTube Live Stream View I 90 Minitue', '#0078 YouTube Live Stream View I 120 Minitue', '#0079 YouTube Live Stream View I 150 Minitue', '#0080 YouTube Live Stream View I 180 Minitue', '#0081 YouTube Live Stream View I 360 Minitue', '#0082 YouTube Live Stream View I 720 Minitue', '#0083 YouTube Live Stream View I 1440 Minitue'
          );
        } else if (platform === 'TikTok') {
          hardcoded.push(
            '#0086 TikTok Follower',
            '#0087 TikTok Target Follower I Pakistan', '#0088 TikTok Target Follower I USA', '#0089 TikTok Target Follower I UK', '#0090 TikTok Target Follower I Turkey', '#0091 TikTok Target Follower I India', '#0092 TikTok Target Follower I Thailand', '#0093 TikTok Target Follower I Egypt', '#0094 TikTok Target Follower I Nigeria', '#0095 TikTok Target Follower I UAE', '#0096 TikTok Target Follower I Soudi Arabia', '#0097 TikTok Target Follower I Australia', '#0098 TikTok Target Follower I Canada',
            '#0099 👀 Tiktok VIew 👀',
            '#0100 ❤️ Tiktok Like ❤️',
            '#0101 💬 Tiktok Custom Comment 💬',
            '#0102 TikTok Live Stream View I 15 Minitue', '#0103 TikTok Live Stream View I 30 Minitue', '#0104 TikTok Live Stream View I 60 Minitue', '#0105 TikTok Live Stream View I 90 Minitue', '#0106 TikTok Live Stream View I 120 Minitue', '#0107 TikTok Live Stream View I 180 Minitue',
            '#0108 Tiktok Share'
          );
        } else if (platform === 'Instagram') {
          hardcoded.push(
            '#0109 Instagram Bangladeshi Follower I 1 Day',
            '#0110 Instragram Bangladeshi + Mixed Follower',
            '#0111 ❤️ Instragram Like ❤️',
            '#0112 Instagram Share',
            '#0113 💬 Instragram Custom Comment 💬',
            '#0114 Instragram Random / Emoji Comment',
            '#0115 Instagram Video View',
            '#0116 Instagram Reels View',
            '#0117 Instagram Photo View',
            '#0118 Instagram Reach + Profile Visit',
            '#0119 Instragram Re-Post',
            '#0120 Instragram Profile Visit'
          );
        } else if (platform === 'Telegram') {
          hardcoded.push(
            '#0121 Telegram Post View ( Single Post )',
            '#0122 Telegram Story View',
            '#0123 Telegram Post Reaction + Views | 👍 🎉 🔥 ❤️ 🥰 🤩 👏 |',
            '#0124 Telegram - Post Reaction + Views | 👎 💩 🤮 🤨 🤯 😁 😟 🤬 |',
            '#0125 Mix Positive Reactions [ 👍 ❤️ 🔥 🎉 😁 + Free Views',
            '#0126 Telegram Reaction Like 👍 + Free Views',
            '#0127 Telegram Reaction Fire 🔥 + Free Views',
            '#0128 Telegram Reactions Positive | 👍 ❤️ 👏 🔥 🥰 🤩 🎉 😁 | Fast |',
            '#0129 Telegram Reaction Heart ❤️ + Free Views',
            '#0130 Mix Negative Reactions [ 👎 😱 💩 😟 🤮 ] + Free Views',
            '#0131 Telegram Reaction DisLike 👎 + Free Views',
            '#0132 Telegram Reaction party 🎉 + Free Views',
            '#0133 Telegram Reaction 🥰 + Free Views',
            '#0134 Telegram Reaction screaming face 😱 + Free Views',
            '#0135 Telegram Reaction beaming face 😁 + Free Views',
            '#0136 Telegram Reaction crying face 😢 + Free Views',
            '#0137 Telegram Reaction pile of poo 💩 + Free Views',
            '#0138 Telegram Reaction face vomiting 🤮 + Free Views',
            '#0139 Telegram Post Share'
          );
        }

        const platformProducts = products.filter(p => p.platform === platform).map(p => p.name);
        const allPlatformServices = Array.from(new Set([...hardcoded, ...platformProducts]));
        
        allPlatformServices.forEach(s => {
          if (s.toLowerCase().includes(term)) {
            globalMatches.push({ platform, service: s });
          }
        });
      });

      if (globalMatches.length === 1) {
        setSelectedPlatform(globalMatches[0].platform);
        setSelectedService(globalMatches[0].service);
      }
    }
  }, [searchTerm, products]);

  // Sync category when service is selected (especially via search)
  useEffect(() => {
    if (selectedService !== 'Select Service') {
      const product = products.find(p => p.name === selectedService && p.platform === selectedPlatform);
      if (product) {
        setSelectedCategory(product.category);
      } else {
        // Check hardcoded services
        if (selectedService.startsWith('#0001')) setSelectedCategory('👥 Bangladeshi Facebook Id Follower 👥');
        else if (selectedService.startsWith('#0002')) setSelectedCategory('👥 Bangladeshi Facebook Page Follower 👥');
        else if (selectedService.startsWith('#0004') || selectedService.startsWith('#0005') || selectedService.startsWith('#0006') || selectedService.startsWith('#0007') || selectedService.startsWith('#0008') || selectedService.startsWith('#0009') || selectedService.startsWith('#0010')) setSelectedCategory('Bangladeshi Single Any React👍❤️🥰😆😮😥😡');
        else if (selectedService.startsWith('#0018') || selectedService.startsWith('#0019') || selectedService.startsWith('#0020') || selectedService.startsWith('#0021') || selectedService.startsWith('#0022') || selectedService.startsWith('#0023') || selectedService.startsWith('#0024') || selectedService.startsWith('#0025') || selectedService.startsWith('#0026')) setSelectedCategory('Bangladeshi Mixed React');
        else if (selectedService.startsWith('#0027')) setSelectedCategory('👥Facebook Page Like + Follow ( Bangladeshi + MIxed )');
        else if (selectedService.startsWith('#0033') || selectedService.startsWith('#0034')) setSelectedCategory('👥Facebook Page Like + Follower । World Wide');
        else if (selectedService.startsWith('#0035') || selectedService.startsWith('#0036')) setSelectedCategory('🧐Facebook Page Review 🔥');
        else if (selectedService.startsWith('#0028') || selectedService.startsWith('#0029') || selectedService.startsWith('#0030') || selectedService.startsWith('#0031')) setSelectedCategory('💬 Facebook / Page Bangladeshi Comment');
        else if (selectedService.startsWith('#0011') || selectedService.startsWith('#0012') || selectedService.startsWith('#0013') || selectedService.startsWith('#0014') || selectedService.startsWith('#0015') || selectedService.startsWith('#0016') || selectedService.startsWith('#0017')) setSelectedCategory('BOT Single Any React👍❤️🥰😆😮😥😡');
        else if (selectedService.startsWith('#0037')) setSelectedCategory('⌚YouTube Watch Time ⌚');
        else if (selectedService.startsWith('#0038')) setSelectedCategory('👀 YouTube Video View 👀');
        else if (selectedService.startsWith('#0039')) setSelectedCategory('👀 YouTube Native Ads View 👀');
        else if (selectedService.startsWith('#0040')) setSelectedCategory('YouTube Bangladeshi Subscriber');
        else if (selectedService.startsWith('#0041')) setSelectedCategory('YouTube Video Likes');
        else if (selectedService.startsWith('#0042')) setSelectedCategory('🔁 YouTube VIdeo Share 🔁');
        else if (selectedService.startsWith('#0043')) setSelectedCategory('YouTube Short Reels Like');
        else if (selectedService.startsWith('#00') && parseInt(selectedService.substring(1, 5)) >= 44 && parseInt(selectedService.substring(1, 5)) <= 73) setSelectedCategory('YouTube Targeted Video Likes');
        else if (selectedService.startsWith('#00') && parseInt(selectedService.substring(1, 5)) >= 74 && parseInt(selectedService.substring(1, 5)) <= 83) setSelectedCategory('👀 YouTube LIve Stream Viewrs 👀');
        else if (selectedService.startsWith('#0084') || selectedService.startsWith('#0085')) setSelectedCategory('💬 YouTube Comment 💬');
        else if (selectedService.startsWith('#0086')) setSelectedCategory('👥 Tiktok Follower 👥');
        else if (selectedService.startsWith('#00') && parseInt(selectedService.substring(1, 5)) >= 87 && parseInt(selectedService.substring(1, 5)) <= 98) setSelectedCategory('👥 Tiktok ( Target )Follower 👥');
        else if (selectedService.startsWith('#0099')) setSelectedCategory('👀  Tiktok Views  👀');
        else if (selectedService.startsWith('#0100')) setSelectedCategory('❤️ Tiktok Likes ❤️');
        else if (selectedService.startsWith('#0101')) setSelectedCategory('💬 Tiktok Comment 💬');
        else if (selectedService.startsWith('#0102') || selectedService.startsWith('#0103') || selectedService.startsWith('#0104') || selectedService.startsWith('#0105') || selectedService.startsWith('#0106') || selectedService.startsWith('#0107')) setSelectedCategory('🔴 Tiktok Live Stream View 🔴');
        else if (selectedService.startsWith('#0108')) setSelectedCategory('🔁 Tiktok Share 🔁');
        else if (selectedService.startsWith('#0109') || selectedService.startsWith('#0110')) setSelectedCategory('👥 Instragram Bangladeshi Follower 👥');
        else if (selectedService.startsWith('#0111')) setSelectedCategory('❤️ Instragram Likes ❤️');
        else if (selectedService.startsWith('#0112')) setSelectedCategory('🔁 Instragram Share 🔁');
        else if (selectedService.startsWith('#0113') || selectedService.startsWith('#0114')) setSelectedCategory('💬 Instragram Comment 💬');
        else if (selectedService.startsWith('#0115') || selectedService.startsWith('#0116') || selectedService.startsWith('#0117') || selectedService.startsWith('#0118')) setSelectedCategory('👀 Instragram View 👀');
        else if (selectedService.startsWith('#0119')) setSelectedCategory('⟳ Instragram Re-post ⟳');
        else if (selectedService.startsWith('#0120')) setSelectedCategory('👤 Instragram Profile Visit 👤');
        else if (selectedService.startsWith('#0121')) setSelectedCategory('👀 Telegram Post View 👀');
        else if (selectedService.startsWith('#0122')) setSelectedCategory('👀 Telegram Story View  👀');
        else if (selectedService.startsWith('#0139')) setSelectedCategory('🔁 Telegram Post  Share 🔁');
        else if (selectedService.startsWith('#01') && parseInt(selectedService.substring(1, 5)) >= 123 && parseInt(selectedService.substring(1, 5)) <= 138) setSelectedCategory('⭐ Telegram Post Reaction ⭐');
      }
    }
  }, [selectedService, selectedPlatform, products]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = product.platform === selectedPlatform;
    const matchesCategory = selectedCategory === 'Select Category' || product.category === selectedCategory;
    const matchesService = selectedService === 'Select Service' || product.name === selectedService;
    return matchesSearch && matchesPlatform && matchesCategory && matchesService;
  });

  const activeProduct = products.find(p => p.name === selectedService && p.platform === selectedPlatform) || (
    selectedPlatform === 'Facebook' && selectedCategory === '👥 Bangladeshi Facebook Id Follower 👥' && selectedService === '#0001 👥 Bangladeshi Facebook Id Follower 👥' ? {
      name: '#0001 👥 Bangladeshi Facebook Id Follower 👥',
      category: '👥 Bangladeshi Facebook Id Follower 👥',
      platform: 'Facebook',
      price: 350,
      description: '#0001 👥 Bangladeshi Facebook Id Follower 👥\nPrice: 350৳ Per 1000',
      averageTime: '12-48 Hours'
    } : selectedPlatform === 'Facebook' && selectedCategory === '👥 Bangladeshi Facebook Page Follower 👥' && selectedService === '#0002 👥 Bangladeshi Facebook Page Follower 👥' ? {
      name: '#0002 👥 Bangladeshi Facebook Page Follower 👥',
      category: '👥 Bangladeshi Facebook Page Follower 👥',
      platform: 'Facebook',
      price: 300,
      description: '#0002 👥 Bangladeshi Facebook Page Follower 👥\nPrice: 300৳ Per 1000',
      averageTime: '12-48 Hours'
    } : selectedPlatform === 'Facebook' && selectedCategory === 'Bangladeshi Single Any React👍❤️🥰😆😮😥😡' && selectedService === '#0004 👥 Bangladeshi Single React 👍' ? {
      name: '#0004 👥 Bangladeshi Single React 👍',
      category: 'Bangladeshi Single Any React👍❤️🥰😆😮😥😡',
      platform: 'Facebook',
      price: 100,
      description: '#0004 👥 Bangladeshi Single React 👍\nPrice: 100৳ Per 1000',
      averageTime: '10-60 Minitue'
    } : selectedPlatform === 'Facebook' && selectedCategory === 'Bangladeshi Single Any React👍❤️🥰😆😮😥😡' && selectedService === '#0005 Bangladeshi Single React ❤️' ? {
      name: '#0005 Bangladeshi Single React ❤️',
      category: 'Bangladeshi Single Any React👍❤️🥰😆😮😥😡',
      platform: 'Facebook',
      price: 100,
      description: '#0005 Bangladeshi Single React ❤️\nPrice: 100৳ Per 1000',
      averageTime: '10-60 Minitue'
    } : selectedPlatform === 'Facebook' && selectedCategory === 'Bangladeshi Single Any React👍❤️🥰😆😮😥😡' && selectedService === '#0006 Bangladeshi Single React 🥰' ? {
      name: '#0006 Bangladeshi Single React 🥰',
      category: 'Bangladeshi Single Any React👍❤️🥰😆😮😥😡',
      platform: 'Facebook',
      price: 100,
      description: '#0006 Bangladeshi Single React 🥰\nPrice: 100৳ Per 1000',
      averageTime: '10-60 Minitue'
    } : selectedPlatform === 'Facebook' && selectedCategory === 'Bangladeshi Single Any React👍❤️🥰😆😮😥😡' && selectedService === '#0007 Bangladeshi Single React 😆' ? {
      name: '#0007 Bangladeshi Single React 😆',
      category: 'Bangladeshi Single Any React👍❤️🥰😆😮😥😡',
      platform: 'Facebook',
      price: 100,
      description: '#0007 Bangladeshi Single React 😆\nPrice: 100৳ Per 1000',
      averageTime: '10-60 Minitue'
    } : selectedPlatform === 'Facebook' && selectedCategory === 'Bangladeshi Single Any React👍❤️🥰😆😮😥😡' && selectedService === '#0008 Bangladeshi Single React 😮' ? {
      name: '#0008 Bangladeshi Single React 😮',
      category: 'Bangladeshi Single Any React👍❤️🥰😆😮😥😡',
      platform: 'Facebook',
      price: 100,
      description: '#0008 Bangladeshi Single React 😮\nPrice: 100৳ Per 1000',
      averageTime: '10-60 Minitue'
    } : selectedPlatform === 'Facebook' && selectedCategory === 'Bangladeshi Single Any React👍❤️🥰😆😮😥😡' && selectedService === '#0009 Bangladeshi Single React 😥' ? {
      name: '#0009 Bangladeshi Single React 😥',
      category: 'Bangladeshi Single Any React👍❤️🥰😆😮😥😡',
      platform: 'Facebook',
      price: 100,
      description: '#0009 Bangladeshi Single React 😥\nPrice: 100৳ Per 1000',
      averageTime: '10-60 Minitue'
    } : selectedPlatform === 'Facebook' && selectedCategory === 'Bangladeshi Single Any React👍❤️🥰😆😮😥😡' && selectedService === '#0010 Bangladeshi Single React 😡' ? {
      name: '#0010 Bangladeshi Single React 😡',
      category: 'Bangladeshi Single Any React👍❤️🥰😆😮😥😡',
      platform: 'Facebook',
      price: 100,
      description: '#0010 Bangladeshi Single React 😡\nPrice: 100৳ Per 1000',
      averageTime: '10-60 Minitue'
    } : selectedPlatform === 'Facebook' && selectedCategory === 'BOT Single Any React👍❤️🥰😆😮😥😡' && selectedService === '#0011 BOT Single Any React 👍' ? {
      name: '#0011 BOT Single Any React 👍',
      category: 'BOT Single Any React👍❤️🥰😆😮😥😡',
      platform: 'Facebook',
      price: 50,
      description: '#0011 BOT Single Any React 👍\nPrice: 50৳ Per 1000',
      averageTime: '10-60 Minitue'
    } : selectedPlatform === 'Facebook' && selectedCategory === 'BOT Single Any React👍❤️🥰😆😮😥😡' && selectedService === '#0012 BOT Single Any React ❤️' ? {
      name: '#0012 BOT Single Any React ❤️',
      category: 'BOT Single Any React👍❤️🥰😆😮😥😡',
      platform: 'Facebook',
      price: 50,
      description: '#0012 BOT Single Any React ❤️\nPrice: 50৳ Per 1000',
      averageTime: '10-60 Minitue'
    } : selectedPlatform === 'Facebook' && selectedCategory === 'BOT Single Any React👍❤️🥰😆😮😥😡' && selectedService === '#0013 BOT Single Any React 🥰' ? {
      name: '#0013 BOT Single Any React 🥰',
      category: 'BOT Single Any React👍❤️🥰😆😮😥😡',
      platform: 'Facebook',
      price: 50,
      description: '#0013 BOT Single Any React 🥰\nPrice: 50৳ Per 1000',
      averageTime: '10-60 Minitue'
    } : selectedPlatform === 'Facebook' && selectedCategory === 'BOT Single Any React👍❤️🥰😆😮😥😡' && selectedService === '#0014 BOT Single Any React 😆' ? {
      name: '#0014 BOT Single Any React 😆',
      category: 'BOT Single Any React👍❤️🥰😆😮😥😡',
      platform: 'Facebook',
      price: 50,
      description: '#0014 BOT Single Any React 😆\nPrice: 50৳ Per 1000',
      averageTime: '10-60 Minitue'
    } : selectedPlatform === 'Facebook' && selectedCategory === 'BOT Single Any React👍❤️🥰😆😮😥😡' && selectedService === '#0015 BOT Single Any React 😮' ? {
      name: '#0015 BOT Single Any React 😮',
      category: 'BOT Single Any React👍❤️🥰😆😮😥😡',
      platform: 'Facebook',
      price: 50,
      description: '#0015 BOT Single Any React 😮\nPrice: 50৳ Per 1000',
      averageTime: '10-60 Minitue'
    } : selectedPlatform === 'Facebook' && selectedCategory === 'BOT Single Any React👍❤️🥰😆😮😥😡' && selectedService === '#0016 BOT Single Any React 😥' ? {
      name: '#0016 BOT Single Any React 😥',
      category: 'BOT Single Any React👍❤️🥰😆😮😥😡',
      platform: 'Facebook',
      price: 50,
      description: '#0016 BOT Single Any React 😥\nPrice: 50৳ Per 1000',
      averageTime: '10-60 Minitue'
    } : selectedPlatform === 'Facebook' && selectedCategory === 'BOT Single Any React👍❤️🥰😆😮😥😡' && selectedService === '#0017 BOT Single Any React 😡' ? {
      name: '#0017 BOT Single Any React 😡',
      category: 'BOT Single Any React👍❤️🥰😆😮😥😡',
      platform: 'Facebook',
      price: 50,
      description: '#0017 BOT Single Any React 😡\nPrice: 50৳ Per 1000',
      averageTime: '10-60 Minitue'
    } : selectedPlatform === 'Facebook' && selectedCategory === 'Bangladeshi Mixed React' && selectedService === '#0018 Bangladeshi Mixed React 👍🥰 ( Like + Care )' ? {
      name: '#0018 Bangladeshi Mixed React 👍🥰 ( Like + Care )',
      category: 'Bangladeshi Mixed React',
      platform: 'Facebook',
      price: 250,
      description: '#0018 Bangladeshi Mixed React 👍🥰 ( Like + Care )\nPrice: 250৳ Per 1000',
      averageTime: '10-60 Minitue'
    } : selectedPlatform === 'Facebook' && selectedCategory === 'Bangladeshi Mixed React' && selectedService === '#0019 Bangladeshi Mixed React 👍😆 ( Like + Haha )' ? {
      name: '#0019 Bangladeshi Mixed React 👍😆 ( Like + Haha )',
      category: 'Bangladeshi Mixed React',
      platform: 'Facebook',
      price: 250,
      description: '#0019 Bangladeshi Mixed React 👍😆 ( Like + Haha )\nPrice: 250৳ Per 1000',
      averageTime: '10-60 Minitue'
    } : selectedPlatform === 'Facebook' && selectedCategory === 'Bangladeshi Mixed React' && selectedService === '#0020 Bangladeshi Mixed React ❤️🥰 ( Love + Care )' ? {
      name: '#0020 Bangladeshi Mixed React ❤️🥰 ( Love + Care )',
      category: 'Bangladeshi Mixed React',
      platform: 'Facebook',
      price: 250,
      description: '#0020 Bangladeshi Mixed React ❤️🥰 ( Love + Care )\nPrice: 250৳ Per 1000',
      averageTime: '10-60 Minitue'
    } : selectedPlatform === 'Facebook' && selectedCategory === 'Bangladeshi Mixed React' && selectedService === '#0021 Bangladeshi Mixed React ❤️😮 ( Love + Wow )' ? {
      name: '#0021 Bangladeshi Mixed React ❤️😮 ( Love + Wow )',
      category: 'Bangladeshi Mixed React',
      platform: 'Facebook',
      price: 250,
      description: '#0021 Bangladeshi Mixed React ❤️😮 ( Love + Wow )\nPrice: 250৳ Per 1000',
      averageTime: '10-60 Minitue'
    } : selectedPlatform === 'Facebook' && selectedCategory === 'Bangladeshi Mixed React' && selectedService === '#0022 Bangladeshi Mixed React 👍❤️🥰 ( Like + Love + Care )' ? {
      name: '#0022 Bangladeshi Mixed React 👍❤️🥰 ( Like + Love + Care )',
      category: 'Bangladeshi Mixed React',
      platform: 'Facebook',
      price: 250,
      description: '#0022 Bangladeshi Mixed React 👍❤️🥰 ( Like + Love + Care )\nPrice: 250৳ Per 1000',
      averageTime: '10-60 Minitue'
    } : selectedPlatform === 'Facebook' && selectedCategory === 'Bangladeshi Mixed React' && selectedService === '#0023 Bangladeshi Mixed React 👍❤️😮 ( Like + Love + Wow )' ? {
      name: '#0023 Bangladeshi Mixed React 👍❤️😮 ( Like + Love + Wow )',
      category: 'Bangladeshi Mixed React',
      platform: 'Facebook',
      price: 250,
      description: '#0023 Bangladeshi Mixed React 👍❤️😮 ( Like + Love + Wow )\nPrice: 250৳ Per 1000',
      averageTime: '10-60 Minitue'
    } : selectedPlatform === 'Facebook' && selectedCategory === 'Bangladeshi Mixed React' && selectedService === '#0024 Bangladeshi Mixed React 👍❤️😥 ( Like + Love + Sad )' ? {
      name: '#0024 Bangladeshi Mixed React 👍❤️😥 ( Like + Love + Sad )',
      category: 'Bangladeshi Mixed React',
      platform: 'Facebook',
      price: 250,
      description: '#0024 Bangladeshi Mixed React 👍❤️😥 ( Like + Love + Sad )\nPrice: 250৳ Per 1000',
      averageTime: '10-60 Minitue'
    } : selectedPlatform === 'Facebook' && selectedCategory === 'Bangladeshi Mixed React' && selectedService === '#0025 Bangladeshi Mixed React 👍❤️🥰😆 ( Like + Love + Care + Haha )' ? {
      name: '#0025 Bangladeshi Mixed React 👍❤️🥰😆 ( Like + Love + Care + Haha )',
      category: 'Bangladeshi Mixed React',
      platform: 'Facebook',
      price: 250,
      description: '#0025 Bangladeshi Mixed React 👍❤️🥰😆 ( Like + Love + Care + Haha )\nPrice: 250৳ Per 1000',
      averageTime: '10-60 Minitue'
    } : selectedPlatform === 'Facebook' && selectedCategory === 'Bangladeshi Mixed React' && selectedService === '#0026 Bangladeshi Mixed React 👍❤️🥰😆😮 ( Like + Love + Care + Haha + Wow )' ? {
      name: '#0026 Bangladeshi Mixed React 👍❤️🥰😆😮 ( Like + Love + Care + Haha + Wow )',
      category: 'Bangladeshi Mixed React',
      platform: 'Facebook',
      price: 250,
      description: '#0026 Bangladeshi Mixed React 👍❤️🥰😆😮 ( Like + Love + Care + Haha + Wow )\nPrice: 250৳ Per 1000',
      averageTime: '10-60 Minitue'
    } : selectedPlatform === 'Facebook' && selectedCategory === '👥Facebook Page Like + Follow ( Bangladeshi + MIxed )' && selectedService === '#0027 👥Facebook Page Like + Follow ( Bangladeshi + MIxed )' ? {
      name: '#0027 👥Facebook Page Like + Follow ( Bangladeshi + MIxed )',
      category: '👥Facebook Page Like + Follow ( Bangladeshi + MIxed )',
      platform: 'Facebook',
      price: 450,
      description: '#0027 👥Facebook Page Like + Follow ( Bangladeshi + MIxed )\nPrice: 450৳ Per 1000',
      averageTime: '12-48 Hours'
    } : selectedPlatform === 'Facebook' && selectedCategory === '💬 Facebook / Page Bangladeshi Comment' && selectedService === '#0028 Bangladeshi Custom Comment' ? {
      name: '#0028 Bangladeshi Custom Comment',
      category: '💬 Facebook / Page Bangladeshi Comment',
      platform: 'Facebook',
      price: 2000,
      description: '#0028 Bangladeshi Custom Comment\nPrice: 2000৳ Per 1000\nMinimum: 20',
      averageTime: '2-4 Hours'
    } : selectedPlatform === 'Facebook' && selectedCategory === '💬 Facebook / Page Bangladeshi Comment' && selectedService === '#0029 Bangladeshi Random Comment' ? {
      name: '#0029 Bangladeshi Random Comment',
      category: '💬 Facebook / Page Bangladeshi Comment',
      platform: 'Facebook',
      price: 500,
      description: '#0029 Bangladeshi Random Comment\nPrice: 500৳ Per 1000',
      averageTime: '2-4 Hours'
    } : selectedPlatform === 'Facebook' && selectedCategory === '💬 Facebook / Page Bangladeshi Comment' && selectedService === '#0030 Bangladeshi Random Positive Comment' ? {
      name: '#0030 Bangladeshi Random Positive Comment',
      category: '💬 Facebook / Page Bangladeshi Comment',
      platform: 'Facebook',
      price: 600,
      description: '#0030 Bangladeshi Random Positive Comment\nPrice: 600৳ Per 1000',
      averageTime: '2-4 Hours'
    } : selectedPlatform === 'Facebook' && selectedCategory === '💬 Facebook / Page Bangladeshi Comment' && selectedService === '#0031 Bangladeshi Random Negetive Comment' ? {
      name: '#0031 Bangladeshi Random Negetive Comment',
      category: '💬 Facebook / Page Bangladeshi Comment',
      platform: 'Facebook',
      price: 600,
      description: '#0031 Bangladeshi Random Negetive Comment\nPrice: 600৳ Per 1000',
      averageTime: '2-4 Hours'
    } : selectedPlatform === 'Facebook' && selectedCategory === '👥Facebook Page Like + Follower । World Wide' && selectedService === '#0033 Facebook Page Likes । Only Like Button Page' ? {
      name: '#0033 Facebook Page Likes । Only Like Button Page',
      category: '👥Facebook Page Like + Follower । World Wide',
      platform: 'Facebook',
      price: 180,
      description: '#0033 Facebook Page Likes । Only Like Button Page\nPrice: 180৳ Per 1000\nDelivery: 1-2 Hours\nMinimum: 500',
      averageTime: '1-2 Hours'
    } : selectedPlatform === 'Facebook' && selectedCategory === '👥Facebook Page Like + Follower । World Wide' && selectedService === '#0034 Facebook Page Like + Follower' ? {
      name: '#0034 Facebook Page Like + Follower',
      category: '👥Facebook Page Like + Follower । World Wide',
      platform: 'Facebook',
      price: 220,
      description: '#0034 Facebook Page Like + Follower\nPrice: 220৳ Per 1000\nDelivery: 1-2 Hours\nMinimum: 500',
      averageTime: '1-2 Hours'
    } : selectedPlatform === 'Facebook' && selectedCategory === '🧐Facebook Page Review 🔥' && selectedService === '#0035 Bangladeshi Page Review । Random' ? {
      name: '#0035 Bangladeshi Page Review । Random',
      category: '🧐Facebook Page Review 🔥',
      platform: 'Facebook',
      price: 3500,
      description: '#0035 Bangladeshi Page Review । Random\nPrice: 3500৳ Per 1000\nDelivery: 12-48 Hours\nMinimum: 20',
      averageTime: '12-48 Hours'
    } : selectedPlatform === 'Facebook' && selectedCategory === '🧐Facebook Page Review 🔥' && selectedService === '#0036 Bangladeshi Page Review । Custom' ? {
      name: '#0036 Bangladeshi Page Review । Custom',
      category: '🧐Facebook Page Review 🔥',
      platform: 'Facebook',
      price: 4000,
      description: '#0036 Bangladeshi Page Review । Custom\nPrice: 4000৳ Per 1000\nDelivery: 12-48 Hours\nMinimum: 20',
      averageTime: '12-48 Hours'
    } : selectedPlatform === 'Facebook' && selectedCategory === '👀 Facebook View 👀🔥' && selectedService === '🔥👀 Reels View 👀🔥' ? {
      name: '🔥👀 Reels View 👀🔥',
      category: '👀 Facebook View 👀🔥',
      platform: 'Facebook',
      price: 30,
      description: '🔥👀 Reels View 👀🔥\nPrice: 30৳ Per 1000\nMinimum: 100',
      averageTime: '1-2 Hours'
    } : selectedPlatform === 'Facebook' && selectedCategory === '👀 Facebook View 👀🔥' && selectedService === '👀 Video View' ? {
      name: '👀 Video View',
      category: '👀 Facebook View 👀🔥',
      platform: 'Facebook',
      price: 40,
      description: '👀 Video View\nPrice: 40৳ Per 1000\nMinimum: 100',
      averageTime: '1-2 Hours'
    } : selectedPlatform === 'YouTube' && selectedCategory === '⌚YouTube Watch Time ⌚' && selectedService === '#0037 YouTube Watch Time' ? {
      name: '#0037 YouTube Watch Time',
      category: '⌚YouTube Watch Time ⌚',
      platform: 'YouTube',
      price: 4200,
      description: '#0037 YouTube Watch Time\n🔴 60-Minute Plus Video 🔴\n🔴 LifeTime Gurantee 🔴',
      averageTime: '1-2 Hour'
    } : selectedPlatform === 'YouTube' && selectedCategory === '👀 YouTube Video View 👀' && selectedService === '#0038 👀 YouTube Video View 👀' ? {
      name: '#0038 👀 YouTube Video View 👀',
      category: '👀 YouTube Video View 👀',
      platform: 'YouTube',
      price: 180,
      description: '#0038 👀 YouTube Video View 👀\nPrice: 180৳ Per 1000\nMinimum: 100',
      averageTime: '1-2 Hours'
    } : selectedPlatform === 'YouTube' && selectedCategory === '👀 YouTube Native Ads View 👀' && selectedService === '#0039 👀 YouTube Native Ads View 👀' ? {
      name: '#0039 👀 YouTube Native Ads View 👀',
      category: '👀 YouTube Native Ads View 👀',
      platform: 'YouTube',
      price: 250,
      description: '#0039 👀 YouTube Native Ads View 👀\n🔴 Real Native Ads View 🔴\n🔴 Non-Drop 🔴',
      averageTime: '24-48 Hours'
    } : selectedPlatform === 'YouTube' && selectedCategory === 'YouTube Bangladeshi Subscriber' && selectedService === '#0040 YouTube Bangladeshi Subscriber' ? {
      name: '#0040 YouTube Bangladeshi Subscriber',
      category: 'YouTube Bangladeshi Subscriber',
      platform: 'YouTube',
      price: 1500,
      description: '#0040 YouTube Bangladeshi Subscriber\n🔴 Real Bangladeshi Subscriber 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 50 🔴',
      averageTime: '1 Hour'
    } : selectedPlatform === 'YouTube' && selectedCategory === 'YouTube Video Likes' && selectedService === '#0041 YouTube Video Likes' ? {
      name: '#0041 YouTube Video Likes',
      category: 'YouTube Video Likes',
      platform: 'YouTube',
      price: 120,
      description: '#0041 YouTube Video Likes\n🔴 High Quality Likes 🔴\n🔴 Non-Drop 🔴',
      averageTime: '1-6 Hours'
    } : selectedPlatform === 'YouTube' && selectedCategory === '🔁 YouTube VIdeo Share 🔁' && selectedService === '#0042 🔁 YouTube VIdeo Share 🔁' ? {
      name: '#0042 🔁 YouTube VIdeo Share 🔁',
      category: '🔁 YouTube VIdeo Share 🔁',
      platform: 'YouTube',
      price: 100,
      description: '#0042 🔁 YouTube VIdeo Share 🔁\nPrice: 100৳ Per 1000\n🔴 Fast Delivery 🔴\n🔴 Non-Drop 🔴',
      averageTime: '1-6 Hours'
    } : selectedPlatform === 'YouTube' && selectedCategory === 'YouTube Short Reels Like' && selectedService === '#0043 YouTube Short Reels Like' ? {
      name: '#0043 YouTube Short Reels Like',
      category: 'YouTube Short Reels Like',
      platform: 'YouTube',
      price: 150,
      description: '#0043 YouTube Short Reels Like\n🔴 YouTube Shorts Likes 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 10 🔴',
      averageTime: '1 Hour'
    } : selectedPlatform === 'YouTube' && selectedCategory === 'YouTube Targeted Video Likes' && selectedService.startsWith('#00') && parseInt(selectedService.substring(1, 5)) >= 44 && parseInt(selectedService.substring(1, 5)) <= 73 ? {
      name: selectedService,
      category: 'YouTube Targeted Video Likes',
      platform: 'YouTube',
      price: 250,
      description: `${selectedService}\n🔴 Targeted Country Likes 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 50 🔴`,
      averageTime: '1 Hour'
    } : selectedPlatform === 'YouTube' && selectedCategory === '👀 YouTube LIve Stream Viewrs 👀' && selectedService.startsWith('#00') && parseInt(selectedService.substring(1, 5)) >= 74 && parseInt(selectedService.substring(1, 5)) <= 83 ? {
      name: selectedService,
      category: '👀 YouTube LIve Stream Viewrs 👀',
      platform: 'YouTube',
      price: parseInt(selectedService.substring(1, 5)) === 74 ? 100 :
             parseInt(selectedService.substring(1, 5)) === 75 ? 150 :
             parseInt(selectedService.substring(1, 5)) === 76 ? 200 :
             parseInt(selectedService.substring(1, 5)) === 77 ? 270 :
             parseInt(selectedService.substring(1, 5)) === 78 ? 350 :
             parseInt(selectedService.substring(1, 5)) === 79 ? 400 :
             parseInt(selectedService.substring(1, 5)) === 80 ? 450 :
             parseInt(selectedService.substring(1, 5)) === 81 ? 850 :
             parseInt(selectedService.substring(1, 5)) === 82 ? 1700 :
             parseInt(selectedService.substring(1, 5)) === 83 ? 3300 : 800,
      description: `${selectedService}\n🔴 High Quality Live Stream Views 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 50 🔴`,
      averageTime: '25 Minitue'
    } : selectedPlatform === 'YouTube' && selectedCategory === '💬 YouTube Comment 💬' && selectedService === '#0084 YouTube Bangladeshi Custom Comment' ? {
      name: '#0084 YouTube Bangladeshi Custom Comment',
      category: '💬 YouTube Comment 💬',
      platform: 'YouTube',
      price: 1550,
      description: '#0084 YouTube Bangladeshi Custom Comment\n🔴 Real Bangladeshi Custom Comment 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 10 🔴',
      averageTime: '30 Minitue'
    } : selectedPlatform === 'YouTube' && selectedCategory === '💬 YouTube Comment 💬' && selectedService === '#0085 YouTube Bangladeshi Random Comment' ? {
      name: '#0085 YouTube Bangladeshi Random Comment',
      category: '💬 YouTube Comment 💬',
      platform: 'YouTube',
      price: 1400,
      description: '#0085 YouTube Bangladeshi Random Comment\n🔴 Real Bangladeshi Random Comment 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 10 🔴',
      averageTime: '30 Minitue'
    } : selectedPlatform === 'TikTok' && selectedCategory === '👥 Tiktok Follower 👥' && selectedService === '#0086 TikTok Follower' ? {
      name: '#0086 TikTok Follower',
      category: '👥 Tiktok Follower 👥',
      platform: 'TikTok',
      price: 400,
      description: '#0086 TikTok Follower\n🔴 High Quality Follower 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 10 🔴',
      averageTime: '1 Hour'
    } : selectedPlatform === 'TikTok' && selectedCategory === '👥 Tiktok ( Target )Follower 👥' && selectedService.startsWith('#00') && parseInt(selectedService.substring(1, 5)) >= 87 && parseInt(selectedService.substring(1, 5)) <= 98 ? {
      name: selectedService,
      category: '👥 Tiktok ( Target )Follower 👥',
      platform: 'TikTok',
      price: 1700,
      description: `${selectedService}\n🔴 Targeted Follower 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 10 🔴`,
      averageTime: '1 Day'
    } : selectedPlatform === 'TikTok' && selectedCategory === '👀  Tiktok Views  👀' && selectedService === '#0099 👀 Tiktok VIew 👀' ? {
      name: '#0099 👀 Tiktok VIew 👀',
      category: '👀  Tiktok Views  👀',
      platform: 'TikTok',
      price: 40,
      description: '#0099 👀 Tiktok VIew 👀\n🔴 High Quality Views 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 50 🔴',
      averageTime: '1 Hour'
    } : selectedPlatform === 'TikTok' && selectedCategory === '❤️ Tiktok Likes ❤️' && selectedService === '#0100 ❤️ Tiktok Like ❤️' ? {
      name: '#0100 ❤️ Tiktok Like ❤️',
      category: '❤️ Tiktok Likes ❤️',
      platform: 'TikTok',
      price: 40,
      description: '#0100 ❤️ Tiktok Like ❤️\n🔴 High Quality Likes 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 10 🔴',
      averageTime: '3 Hour'
    } : selectedPlatform === 'TikTok' && selectedCategory === '💬 Tiktok Comment 💬' && selectedService === '#0101 💬 Tiktok Custom Comment 💬' ? {
      name: '#0101 💬 Tiktok Custom Comment 💬',
      category: '💬 Tiktok Comment 💬',
      platform: 'TikTok',
      price: 700,
      description: '#0101 💬 Tiktok Custom Comment 💬\n🔴 High Quality Custom Comments 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 10 🔴',
      averageTime: '30 Minitue'
    } : selectedPlatform === 'TikTok' && selectedCategory === '🔴 Tiktok Live Stream View 🔴' && selectedService.startsWith('#01') && parseInt(selectedService.substring(1, 5)) >= 102 && parseInt(selectedService.substring(1, 5)) <= 107 ? {
      name: selectedService,
      category: '🔴 Tiktok Live Stream View 🔴',
      platform: 'TikTok',
      price: parseInt(selectedService.substring(1, 5)) === 102 ? 1100 :
             parseInt(selectedService.substring(1, 5)) === 103 ? 1300 :
             parseInt(selectedService.substring(1, 5)) === 104 ? 1900 :
             parseInt(selectedService.substring(1, 5)) === 105 ? 3800 :
             parseInt(selectedService.substring(1, 5)) === 106 ? 5600 : 7500,
      description: `${selectedService}\n🔴 High Quality Live Stream Views 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 20 🔴`,
      averageTime: '10 Minitue'
    } : selectedPlatform === 'TikTok' && selectedCategory === '🔁 Tiktok Share 🔁' && selectedService === '#0108 Tiktok Share' ? {
      name: '#0108 Tiktok Share',
      category: '🔁 Tiktok Share 🔁',
      platform: 'TikTok',
      price: 70,
      description: '#0108 Tiktok Share\n🔴 High Quality Shares 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 20 🔴',
      averageTime: '15 Minitue'
    } : selectedPlatform === 'Instagram' && selectedCategory === '👥 Instragram Bangladeshi Follower 👥' && selectedService === '#0109 Instagram Bangladeshi Follower I 1 Day' ? {
      name: '#0109 Instagram Bangladeshi Follower I 1 Day',
      category: '👥 Instragram Bangladeshi Follower 👥',
      platform: 'Instagram',
      price: 350,
      description: '#0109 Instagram Bangladeshi Follower I 1 Day\n🔴 Real Bangladeshi Follower 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 500 🔴',
      averageTime: '1 Day'
    } : selectedPlatform === 'Instagram' && selectedCategory === '👥 Instragram Bangladeshi Follower 👥' && selectedService === '#0110 Instragram Bangladeshi + Mixed Follower' ? {
      name: '#0110 Instragram Bangladeshi + Mixed Follower',
      category: '👥 Instragram Bangladeshi Follower 👥',
      platform: 'Instagram',
      price: 450,
      description: '#0110 Instragram Bangladeshi + Mixed Follower\n🔴 Real Bangladeshi + Mixed Follower 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 100 🔴',
      averageTime: '30 Minitue'
    } : selectedPlatform === 'Instagram' && selectedCategory === '❤️ Instragram Likes ❤️' && selectedService === '#0111 ❤️ Instragram Like ❤️' ? {
      name: '#0111 ❤️ Instragram Like ❤️',
      category: '❤️ Instragram Likes ❤️',
      platform: 'Instagram',
      price: 80,
      description: '#0111 ❤️ Instragram Like ❤️\n🔴 High Quality Likes 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 10 🔴',
      averageTime: '30 Minitue'
    } : selectedPlatform === 'Instagram' && selectedCategory === '🔁 Instragram Share 🔁' && selectedService === '#0112 Instagram Share' ? {
      name: '#0112 Instagram Share',
      category: '🔁 Instragram Share 🔁',
      platform: 'Instagram',
      price: 60,
      description: '#0112 Instagram Share\n🔴 High Quality Shares 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 100 🔴',
      averageTime: '2 Hour'
    } : selectedPlatform === 'Instagram' && selectedCategory === '💬 Instragram Comment 💬' && selectedService === '#0113 💬 Instragram Custom Comment 💬' ? {
      name: '#0113 💬 Instragram Custom Comment 💬',
      category: '💬 Instragram Comment 💬',
      platform: 'Instagram',
      price: 220,
      description: '#0113 💬 Instragram Custom Comment 💬\n🔴 Custom Comment Box 🔴\n🔴 Minimum: 30 🔴',
      averageTime: '1 Hour 30 Minitue'
    } : selectedPlatform === 'Instagram' && selectedCategory === '💬 Instragram Comment 💬' && selectedService === '#0114 Instragram Random / Emoji Comment' ? {
      name: '#0114 Instragram Random / Emoji Comment',
      category: '💬 Instragram Comment 💬',
      platform: 'Instagram',
      price: 160,
      description: '#0114 Instragram Random / Emoji Comment\n🔴 Random / Emoji Comment 🔴\n🔴 Minimum: 30 🔴',
      averageTime: '2 Hour'
    } : selectedPlatform === 'Instagram' && selectedCategory === '👀 Instragram View 👀' && selectedService === '#0115 Instagram Video View' ? {
      name: '#0115 Instagram Video View',
      category: '👀 Instragram View 👀',
      platform: 'Instagram',
      price: 30,
      description: '#0115 Instagram Video View\n🔴 High Quality Video Views 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 20 🔴',
      averageTime: '30 Minitue'
    } : selectedPlatform === 'Instagram' && selectedCategory === '👀 Instragram View 👀' && selectedService === '#0116 Instagram Reels View' ? {
      name: '#0116 Instagram Reels View',
      category: '👀 Instragram View 👀',
      platform: 'Instagram',
      price: 30,
      description: '#0116 Instagram Reels View\n🔴 High Quality Reels Views 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 20 🔴',
      averageTime: '30 Minitue'
    } : selectedPlatform === 'Instagram' && selectedCategory === '👀 Instragram View 👀' && selectedService === '#0117 Instagram Photo View' ? {
      name: '#0117 Instagram Photo View',
      category: '👀 Instragram View 👀',
      platform: 'Instagram',
      price: 30,
      description: '#0117 Instagram Photo View\n🔴 High Quality Photo Views 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 100 🔴',
      averageTime: '30 Minitue'
    } : selectedPlatform === 'Instagram' && selectedCategory === '👀 Instragram View 👀' && selectedService === '#0118 Instagram Reach + Profile Visit' ? {
      name: '#0118 Instagram Reach + Profile Visit',
      category: '👀 Instragram View 👀',
      platform: 'Instagram',
      price: 50,
      description: '#0118 Instagram Reach + Profile Visit\n🔴 High Quality Reach + Profile Visits 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 100 🔴',
      averageTime: '50 Minitue'
    } : selectedPlatform === 'Instagram' && selectedCategory === '⟳ Instragram Re-post ⟳' && selectedService === '#0119 Instragram Re-Post' ? {
      name: '#0119 Instragram Re-Post',
      category: '⟳ Instragram Re-post ⟳',
      platform: 'Instagram',
      price: 200,
      description: '#0119 Instragram Re-Post\n🔴 High Quality Re-Posts 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 10 🔴',
      averageTime: '10 Minitue'
    } : selectedPlatform === 'Instagram' && selectedCategory === '👤 Instragram Profile Visit 👤' && selectedService === '#0120 Instragram Profile Visit' ? {
      name: '#0120 Instragram Profile Visit',
      category: '👤 Instragram Profile Visit 👤',
      platform: 'Instagram',
      price: 200,
      description: '#0120 Instragram Profile Visit\n🔴 High Quality Profile Visits 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 100 🔴',
      averageTime: '30 Minitue'
    } : selectedPlatform === 'Telegram' && selectedCategory === '👀 Telegram Post View 👀' && selectedService === '#0121 Telegram Post View ( Single Post )' ? {
      name: '#0121 Telegram Post View ( Single Post )',
      category: '👀 Telegram Post View 👀',
      platform: 'Telegram',
      price: 30,
      description: '#0121 Telegram Post View ( Single Post )\n🔴 High Quality Post Views 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 10 🔴',
      averageTime: '20 Minitue'
    } : selectedPlatform === 'Telegram' && selectedCategory === '👀 Telegram Story View  👀' && selectedService === '#0122 Telegram Story View' ? {
      name: '#0122 Telegram Story View',
      category: '👀 Telegram Story View  👀',
      platform: 'Telegram',
      price: 50,
      description: '#0122 Telegram Story View\n🔴 High Quality Story Views 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 10 🔴',
      averageTime: '20 Minitue'
    } : selectedPlatform === 'Telegram' && selectedCategory === '⭐ Telegram Post Reaction ⭐' && selectedService === '#0123 Telegram Post Reaction + Views | 👍 🎉 🔥 ❤️ 🥰 🤩 👏 |' ? {
      name: '#0123 Telegram Post Reaction + Views | 👍 🎉 🔥 ❤️ 🥰 🤩 👏 |',
      category: '⭐ Telegram Post Reaction ⭐',
      platform: 'Telegram',
      price: 15,
      description: '#0123 Telegram Post Reaction + Views | 👍 🎉 🔥 ❤️ 🥰 🤩 👏 |\n🔴 High Quality Reactions + Views 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 10 🔴',
      averageTime: '30 Minitue'
    } : selectedPlatform === 'Telegram' && selectedCategory === '⭐ Telegram Post Reaction ⭐' && selectedService === '#0124 Telegram - Post Reaction + Views | 👎 💩 🤮 🤨 🤯 😁 😟 🤬 |' ? {
      name: '#0124 Telegram - Post Reaction + Views | 👎 💩 🤮 🤨 🤯 😁 😟 🤬 |',
      category: '⭐ Telegram Post Reaction ⭐',
      platform: 'Telegram',
      price: 15,
      description: '#0124 Telegram - Post Reaction + Views | 👎 💩 🤮 🤨 🤯 😁 😟 🤬 |\n🔴 High Quality Reactions + Views 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 10 🔴',
      averageTime: '1 Hour 30 Minitue'
    } : selectedPlatform === 'Telegram' && selectedCategory === '⭐ Telegram Post Reaction ⭐' && selectedService === '#0125 Mix Positive Reactions [ 👍 ❤️ 🔥 🎉 😁 + Free Views' ? {
      name: '#0125 Mix Positive Reactions [ 👍 ❤️ 🔥 🎉 😁 + Free Views',
      category: '⭐ Telegram Post Reaction ⭐',
      platform: 'Telegram',
      price: 80,
      description: '#0125 Mix Positive Reactions [ 👍 ❤️ 🔥 🎉 😁 + Free Views\n🔴 High Quality Reactions + Free Views 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 10 🔴',
      averageTime: '1 Hour'
    } : selectedPlatform === 'Telegram' && selectedCategory === '⭐ Telegram Post Reaction ⭐' && selectedService === '#0126 Telegram Reaction Like 👍 + Free Views' ? {
      name: '#0126 Telegram Reaction Like 👍 + Free Views',
      category: '⭐ Telegram Post Reaction ⭐',
      platform: 'Telegram',
      price: 80,
      description: '#0126 Telegram Reaction Like 👍 + Free Views\n🔴 High Quality Reactions + Free Views 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 10 🔴',
      averageTime: '1 Hour'
    } : selectedPlatform === 'Telegram' && selectedCategory === '⭐ Telegram Post Reaction ⭐' && selectedService === '#0127 Telegram Reaction Fire 🔥 + Free Views' ? {
      name: '#0127 Telegram Reaction Fire 🔥 + Free Views',
      category: '⭐ Telegram Post Reaction ⭐',
      platform: 'Telegram',
      price: 30,
      description: '#0127 Telegram Reaction Fire 🔥 + Free Views\n🔴 High Quality Reactions + Free Views 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 10 🔴',
      averageTime: '30 Minitue'
    } : selectedPlatform === 'Telegram' && selectedCategory === '⭐ Telegram Post Reaction ⭐' && selectedService === '#0128 Telegram Reactions Positive | 👍 ❤️ 👏 🔥 🥰 🤩 🎉 😁 | Fast |' ? {
      name: '#0128 Telegram Reactions Positive | 👍 ❤️ 👏 🔥 🥰 🤩 🎉 😁 | Fast |',
      category: '⭐ Telegram Post Reaction ⭐',
      platform: 'Telegram',
      price: 30,
      description: '#0128 Telegram Reactions Positive | 👍 ❤️ 👏 🔥 🥰 🤩 🎉 😁 | Fast |\n🔴 High Quality Reactions 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 10 🔴',
      averageTime: '30 Minitue'
    } : selectedPlatform === 'Telegram' && selectedCategory === '⭐ Telegram Post Reaction ⭐' && selectedService === '#0129 Telegram Reaction Heart ❤️ + Free Views' ? {
      name: '#0129 Telegram Reaction Heart ❤️ + Free Views',
      category: '⭐ Telegram Post Reaction ⭐',
      platform: 'Telegram',
      price: 40,
      description: '#0129 Telegram Reaction Heart ❤️ + Free Views\n🔴 High Quality Reactions + Free Views 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 10 🔴',
      averageTime: '20 Minitue'
    } : selectedPlatform === 'Telegram' && selectedCategory === '⭐ Telegram Post Reaction ⭐' && selectedService === '#0130 Mix Negative Reactions [ 👎 😱 💩 😟 🤮 ] + Free Views' ? {
      name: '#0130 Mix Negative Reactions [ 👎 😱 💩 😟 🤮 ] + Free Views',
      category: '⭐ Telegram Post Reaction ⭐',
      platform: 'Telegram',
      price: 40,
      description: '#0130 Mix Negative Reactions [ 👎 😱 💩 😟 🤮 ] + Free Views\n🔴 High Quality Reactions + Free Views 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 10 🔴',
      averageTime: '20 Minitue'
    } : selectedPlatform === 'Telegram' && selectedCategory === '⭐ Telegram Post Reaction ⭐' && selectedService === '#0131 Telegram Reaction DisLike 👎 + Free Views' ? {
      name: '#0131 Telegram Reaction DisLike 👎 + Free Views',
      category: '⭐ Telegram Post Reaction ⭐',
      platform: 'Telegram',
      price: 30,
      description: '#0131 Telegram Reaction DisLike 👎 + Free Views\n🔴 High Quality Reactions + Free Views 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 10 🔴',
      averageTime: '20 Minitue'
    } : selectedPlatform === 'Telegram' && selectedCategory === '⭐ Telegram Post Reaction ⭐' && selectedService === '#0132 Telegram Reaction party 🎉 + Free Views' ? {
      name: '#0132 Telegram Reaction party 🎉 + Free Views',
      category: '⭐ Telegram Post Reaction ⭐',
      platform: 'Telegram',
      price: 30,
      description: '#0132 Telegram Reaction party 🎉 + Free Views\n🔴 High Quality Reactions + Free Views 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 10 🔴',
      averageTime: '20 Minitue'
    } : selectedPlatform === 'Telegram' && selectedCategory === '⭐ Telegram Post Reaction ⭐' && selectedService === '#0133 Telegram Reaction 🥰 + Free Views' ? {
      name: '#0133 Telegram Reaction 🥰 + Free Views',
      category: '⭐ Telegram Post Reaction ⭐',
      platform: 'Telegram',
      price: 30,
      description: '#0133 Telegram Reaction 🥰 + Free Views\n🔴 High Quality Reactions + Free Views 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 10 🔴',
      averageTime: '20 Minitue'
    } : selectedPlatform === 'Telegram' && selectedCategory === '⭐ Telegram Post Reaction ⭐' && selectedService === '#0134 Telegram Reaction screaming face 😱 + Free Views' ? {
      name: '#0134 Telegram Reaction screaming face 😱 + Free Views',
      category: '⭐ Telegram Post Reaction ⭐',
      platform: 'Telegram',
      price: 30,
      description: '#0134 Telegram Reaction screaming face 😱 + Free Views\n🔴 High Quality Reactions + Free Views 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 10 🔴',
      averageTime: '20 Minitue'
    } : selectedPlatform === 'Telegram' && selectedCategory === '⭐ Telegram Post Reaction ⭐' && selectedService === '#0135 Telegram Reaction beaming face 😁 + Free Views' ? {
      name: '#0135 Telegram Reaction beaming face 😁 + Free Views',
      category: '⭐ Telegram Post Reaction ⭐',
      platform: 'Telegram',
      price: 40,
      description: '#0135 Telegram Reaction beaming face 😁 + Free Views\n🔴 High Quality Reactions + Free Views 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 10 🔴',
      averageTime: '20 Minitue'
    } : selectedPlatform === 'Telegram' && selectedCategory === '⭐ Telegram Post Reaction ⭐' && selectedService === '#0136 Telegram Reaction crying face 😢 + Free Views' ? {
      name: '#0136 Telegram Reaction crying face 😢 + Free Views',
      category: '⭐ Telegram Post Reaction ⭐',
      platform: 'Telegram',
      price: 30,
      description: '#0136 Telegram Reaction crying face 😢 + Free Views\n🔴 High Quality Reactions + Free Views 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 10 🔴',
      averageTime: '20 Minitue'
    } : selectedPlatform === 'Telegram' && selectedCategory === '⭐ Telegram Post Reaction ⭐' && selectedService === '#0137 Telegram Reaction pile of poo 💩 + Free Views' ? {
      name: '#0137 Telegram Reaction pile of poo 💩 + Free Views',
      category: '⭐ Telegram Post Reaction ⭐',
      platform: 'Telegram',
      price: 30,
      description: '#0137 Telegram Reaction pile of poo 💩 + Free Views\n🔴 High Quality Reactions + Free Views 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 10 🔴',
      averageTime: '20 Minitue'
    } : selectedPlatform === 'Telegram' && selectedCategory === '⭐ Telegram Post Reaction ⭐' && selectedService === '#0138 Telegram Reaction face vomiting 🤮 + Free Views' ? {
      name: '#0138 Telegram Reaction face vomiting 🤮 + Free Views',
      category: '⭐ Telegram Post Reaction ⭐',
      platform: 'Telegram',
      price: 30,
      description: '#0138 Telegram Reaction face vomiting 🤮 + Free Views\n🔴 High Quality Reactions + Free Views 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 10 🔴',
      averageTime: '20 Minitue'
    } : selectedPlatform === 'Telegram' && selectedCategory === '🔁 Telegram Post  Share 🔁' && selectedService === '#0139 Telegram Post Share' ? {
      name: '#0139 Telegram Post Share',
      category: '🔁 Telegram Post  Share 🔁',
      platform: 'Telegram',
      price: 40,
      description: '#0139 Telegram Post Share\n🔴 High Quality Post Share 🔴\n🔴 Non-Drop 🔴\n🔴 Minimum: 10 🔴',
      averageTime: '10 Minitue'
    } : null
  );

  const minQuantity = (selectedService.startsWith('#01') && parseInt(selectedService.substring(1, 5)) >= 121 && parseInt(selectedService.substring(1, 5)) <= 139) ? 10 : (selectedService === '#0120 Instragram Profile Visit') ? 100 : (selectedService === '#0119 Instragram Re-Post') ? 10 : (selectedService === '#0115 Instagram Video View' || selectedService === '#0116 Instagram Reels View') ? 20 : (selectedService === '#0117 Instagram Photo View' || selectedService === '#0118 Instagram Reach + Profile Visit') ? 100 : (selectedService === '#0113 💬 Instragram Custom Comment 💬' || selectedService === '#0114 Instragram Random / Emoji Comment') ? 30 : (selectedService === '#0112 Instagram Share') ? 100 : (selectedService === '#0111 ❤️ Instragram Like ❤️') ? 10 : (selectedService === '#0109 Instagram Bangladeshi Follower I 1 Day') ? 500 : (selectedService === '#0110 Instragram Bangladeshi + Mixed Follower') ? 100 : (selectedCategory === '🔴 Tiktok Live Stream View 🔴' || selectedCategory === '🔁 Tiktok Share 🔁') ? 20 : (selectedCategory === '💬 Facebook / Page Bangladeshi Comment' || selectedCategory === '🧐Facebook Page Review 🔥' || selectedCategory === '💬 YouTube Comment 💬' || selectedCategory === '👥 Tiktok Follower 👥' || selectedCategory === '👥 Tiktok ( Target )Follower 👥' || selectedCategory === '❤️ Tiktok Likes ❤️' || selectedCategory === '💬 Tiktok Comment 💬') ? 10 : (selectedCategory === '👀 Facebook View 👀🔥' || selectedCategory === '🔁 Facebook Share' || selectedCategory === '👀 YouTube Video Video 👀' || selectedCategory === '🔁 YouTube VIdeo Share 🔁') ? 100 : (selectedCategory === 'Bangladeshi Single Any React👍❤️🥰😆😮😥😡' || selectedCategory === 'Bangladeshi Mixed React' || selectedCategory === 'BOT Single Any React👍❤️🥰😆😮😥😡' || selectedService.toLowerCase().includes('react')) ? 200 : (selectedCategory === '⌚YouTube Watch Time ⌚' || selectedCategory === 'YouTube Targeted Video Likes' || selectedCategory === '👀 YouTube LIve Stream Viewrs 👀' || selectedCategory === 'YouTube Bangladeshi Subscriber' || selectedCategory === '👀  Tiktok Views  👀') ? 50 : selectedCategory === 'YouTube Short Reels Like' ? 10 : 500;

  const handleOrderSubmit = async () => {
    if (!user || !userProfile || !activeProduct || !quantity || !link) {
      setToast({ message: 'Please fill all fields correctly.', type: 'error' });
      return;
    }

    if (isCustomCommentService && !customComments.trim()) {
      setToast({ message: 'Please enter your custom comments.', type: 'error' });
      return;
    }

    if (Number(quantity) < minQuantity) {
      setToast({ message: `⚠️সর্বনিন্ম অর্ডার ${minQuantity} । ⚠️`, type: 'error' });
      return;
    }

    const totalCost = (activeProduct.price / 1000) * Number(quantity);
    
    if (userProfile.balance < totalCost) {
      setShowLowBalanceModal(true);
      return;
    }

    setSubmitting(true);
    try {
      try {
        const orderNumber = await runTransaction(db, async (transaction) => {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await transaction.get(userRef);
          
          if (!userSnap.exists()) {
            throw new Error("User profile not found");
          }

          const currentBalance = userSnap.data().balance;
          if (currentBalance < totalCost) {
            throw new Error("Insufficient balance");
          }

          // Get or create order counter
          const counterRef = doc(db, 'counters', 'orderConfig');
          const counterSnap = await transaction.get(counterRef);
          
          let nextId = 1;
          let availableIds: number[] = [];
          
          if (counterSnap.exists()) {
            const data = counterSnap.data();
            nextId = data.nextId || 1;
            availableIds = data.availableIds || [];
          }

          let numericId: number;
          if (availableIds.length > 0) {
            // Reuse an ID
            numericId = availableIds.shift()!;
          } else {
            // Use next sequential ID
            numericId = nextId;
            nextId++;
          }

          const randomId = Math.floor(1000 + Math.random() * 9000);
          const formattedId = `#${randomId}`;

          const newBalance = currentBalance - totalCost;
          
          // 1. Deduct balance
          transaction.update(userRef, {
            balance: newBalance,
            updatedAt: serverTimestamp()
          });

          // 2. Update counter (optional, but keeping it for structure)
          transaction.set(counterRef, {
            nextId,
            availableIds
          }, { merge: true });

          // 3. Create order
          const newOrderRef = doc(collection(db, 'orders'));
          transaction.set(newOrderRef, {
            userId: user.uid,
            userEmail: user.email,
            userName: userProfile.displayName || 'Anonymous',
            serviceName: activeProduct.name,
            category: activeProduct.category,
            platform: activeProduct.platform,
            link: link,
            quantity: Number(quantity),
            charge: totalCost,
            status: 'Pending',
            orderNumber: formattedId,
            numericId: randomId,
            customComments: isCustomCommentService ? customComments : null,
            createdAt: serverTimestamp()
          });

          return formattedId;
        });

        setOrderId(orderNumber);
        setRemainingBalance(userProfile.balance - totalCost);
        setShowSuccessModal(true);
        
        // Reset form
        setQuantity('');
        setLink('');
        setCustomComments('');
      } catch (error: any) {
        console.error('Order error:', error);
        if (error.message === "Insufficient balance") {
          setShowLowBalanceModal(true);
        } else {
          setToast({ message: `Error placing order: ${error.message}`, type: 'error' });
        }
      }
    } catch (error) {
      console.error('Order error:', error);
      setToast({ message: 'Something went wrong. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <ToastContainer />
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h2 className="text-3xl font-display font-black text-white mb-2 flex flex-wrap items-center gap-4">
            <span>🛒 Create <span className="text-gold">New Order</span></span>
            <span className="text-base md:text-xl font-bold text-[#39FF14] drop-shadow-[0_0_10px_rgba(57,255,20,0.7)] tracking-wide">
              আপনার অর্ডার প্লাটফর্ম বাছাই করুন
            </span>
          </h2>
          <p className="text-gray-400">Select a platform to boost your social presence.</p>
        </div>
      </div>

      {/* Platform Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
        {platforms.map((platform) => (
          <motion.button
            key={platform.name}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedPlatform(platform.name);
              if (platform.name === 'Facebook') {
                setSelectedCategory('👥 Bangladeshi Facebook Id Follower 👥');
                setSelectedService('#0001 👥 Bangladeshi Facebook Id Follower 👥');
              } else if (platform.name === 'YouTube') {
                setSelectedCategory('⌚YouTube Watch Time ⌚');
                setSelectedService('#0037 YouTube Watch Time');
              } else if (platform.name === 'TikTok') {
                setSelectedCategory('👥 Tiktok Follower 👥');
                setSelectedService('#0086 TikTok Follower');
              } else if (platform.name === 'Instagram') {
                setSelectedCategory('👥 Instragram Bangladeshi Follower 👥');
                setSelectedService('#0109 Instagram Bangladeshi Follower I 1 Day');
              } else if (platform.name === 'Telegram') {
                setSelectedCategory('👀 Telegram Post View 👀');
                setSelectedService('#0121 Telegram Post View ( Single Post )');
              } else {
                setSelectedCategory('Select Category');
                setSelectedService('Select Service');
              }
            }}
            className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all duration-300 ${
              selectedPlatform === platform.name
                ? `bg-gradient-to-br ${platform.color} border-white/20 text-white shadow-[0_0_25px_rgba(255,255,255,0.1)]`
                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:bg-white/10'
            }`}
          >
            <div className={`mb-3 w-12 h-12 flex items-center justify-center rounded-2xl ${selectedPlatform === platform.name ? 'bg-white/20' : 'bg-white/10'}`}>
              <img 
                src={platform.logo} 
                alt={platform.name} 
                className={`${platform.name === 'TikTok' ? 'w-10 h-10' : 'w-8 h-8'} object-contain transition-transform duration-300 group-hover:scale-110`}
                referrerPolicy="no-referrer"
                loading="eager"
              />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{platform.name}</span>
          </motion.button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <label className="block text-xs font-black uppercase tracking-widest text-gold mb-3 ml-1">
          🔍 Search Service Name / Code
        </label>
        <div className="relative group max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-primary group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search Service Name / Code"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-primary/30 rounded-2xl text-primary font-bold drop-shadow-[0_0_8px_rgba(57,255,20,0.5)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Category Selection Box */}
      <div className="mb-12">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-full max-w-md">
              <label className="block text-xs font-black uppercase tracking-widest text-gold mb-3 ml-1">
                📁 Category
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Filter className="h-5 w-5 text-gray-500 group-focus-within:text-gold transition-colors" />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    const newCategory = e.target.value;
                    setSelectedCategory(newCategory);
                    if (newCategory === '👥 Bangladeshi Facebook Id Follower 👥') {
                      setSelectedService('#0001 👥 Bangladeshi Facebook Id Follower 👥');
                    } else if (newCategory === '👥 Bangladeshi Facebook Page Follower 👥') {
                      setSelectedService('#0002 👥 Bangladeshi Facebook Page Follower 👥');
                    } else if (newCategory === '👥Facebook Page Like + Follow ( Bangladeshi + MIxed )') {
                      setSelectedService('#0027 👥Facebook Page Like + Follow ( Bangladeshi + MIxed )');
                    } else if (newCategory === '💬 Facebook / Page Bangladeshi Comment') {
                      setSelectedService('#0028 Bangladeshi Custom Comment');
                    } else if (newCategory === '⌚YouTube Watch Time ⌚') {
                      setSelectedService('#0037 YouTube Watch Time');
                    } else if (newCategory === '👀 YouTube Video View 👀') {
                      setSelectedService('#0038 👀 YouTube Video View 👀');
                    } else if (newCategory === '👀 YouTube Native Ads View 👀') {
                      setSelectedService('#0039 👀 YouTube Native Ads View 👀');
                    } else if (newCategory === 'YouTube Bangladeshi Subscriber') {
                      setSelectedService('#0040 YouTube Bangladeshi Subscriber');
                    } else if (newCategory === 'YouTube Video Likes') {
                      setSelectedService('#0041 YouTube Video Likes');
                    } else if (newCategory === '🔁 YouTube VIdeo Share 🔁') {
                      setSelectedService('#0042 🔁 YouTube VIdeo Share 🔁');
                    } else if (newCategory === 'YouTube Targeted Video Likes') {
                      setSelectedService('#0044 Video Likes  I  Bangladesh');
                    } else if (newCategory === 'YouTube Short Reels Like') {
                      setSelectedService('#0043 YouTube Short Reels Like');
                    } else if (newCategory === '👀 YouTube LIve Stream Viewrs 👀') {
                      setSelectedService('#0074 YouTube Live Stream View I 15 Minitue');
                    } else if (newCategory === '💬 YouTube Comment 💬') {
                      setSelectedService('#0084 YouTube Bangladeshi Custom Comment');
                    } else if (newCategory === '👥 Tiktok Follower 👥') {
                      setSelectedService('#0086 TikTok Follower');
                    } else if (newCategory === '👥 Tiktok ( Target )Follower 👥') {
                      setSelectedService('#0087 TikTok Target Follower I Pakistan');
                    } else if (newCategory === '👀  Tiktok Views  👀') {
                      setSelectedService('#0099 👀 Tiktok VIew 👀');
                    } else if (newCategory === '❤️ Tiktok Likes ❤️') {
                      setSelectedService('#0100 ❤️ Tiktok Like ❤️');
                    } else if (newCategory === '💬 Tiktok Comment 💬') {
                      setSelectedService('#0101 💬 Tiktok Custom Comment 💬');
                    } else if (newCategory === '🔴 Tiktok Live Stream View 🔴') {
                      setSelectedService('#0102 TikTok Live Stream View I 15 Minitue');
                    } else if (newCategory === '🔁 Tiktok Share 🔁') {
                      setSelectedService('#0108 Tiktok Share');
                    } else if (newCategory === '👥 Instragram Bangladeshi Follower 👥') {
                      setSelectedService('#0109 Instagram Bangladeshi Follower I 1 Day');
                    } else if (newCategory === '❤️ Instragram Likes ❤️') {
                      setSelectedService('#0111 ❤️ Instragram Like ❤️');
                    } else if (newCategory === '🔁 Instragram Share 🔁') {
                      setSelectedService('#0112 Instagram Share');
                    } else if (newCategory === '💬 Instragram Comment 💬') {
                      setSelectedService('#0113 💬 Instragram Custom Comment 💬');
                    } else if (newCategory === '👀 Instragram View 👀') {
                      setSelectedService('#0115 Instagram Video View');
                    } else if (newCategory === '⟳ Instragram Re-post ⟳') {
                      setSelectedService('#0119 Instragram Re-Post');
                    } else if (newCategory === '👤 Instragram Profile Visit 👤') {
                      setSelectedService('#0120 Instragram Profile Visit');
                    } else if (newCategory === '👀 Telegram Post View 👀') {
                      setSelectedService('#0121 Telegram Post View ( Single Post )');
                    } else if (newCategory === '👀 Telegram Story View  👀') {
                      setSelectedService('#0122 Telegram Story View');
                    } else if (newCategory === '🔁 Telegram Post  Share 🔁') {
                      setSelectedService('#0139 Telegram Post Share');
                    } else if (newCategory === '⭐ Telegram Post Reaction ⭐') {
                      setSelectedService('#0123 Telegram Post Reaction + Views | 👍 🎉 🔥 ❤️ 🥰 🤩 👏 |');
                    } else {
                      setSelectedService('Select Service');
                    }
                  }}
                  className="block w-full pl-12 pr-10 py-4 bg-white/5 border border-[#39FF14]/30 rounded-2xl text-[#39FF14] font-bold drop-shadow-[0_0_8px_rgba(57,255,20,0.5)] shadow-[0_0_15px_rgba(57,255,20,0.1)] appearance-none focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50 focus:border-[#39FF14] transition-all cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#0a0a0a] text-white">
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <div className="w-2 h-2 border-r-2 border-b-2 border-gray-500 rotate-45 group-focus-within:border-gold transition-colors"></div>
                </div>
              </div>
            </div>

            <div className="w-full max-md:mt-6 max-w-md">
              <label className="block text-xs font-black uppercase tracking-widest text-gold mb-3 ml-1">
                🛠️ Service Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <LayoutGrid className="h-5 w-5 text-gray-500 group-focus-within:text-gold transition-colors" />
                </div>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="block w-full pl-12 pr-10 py-4 bg-white/5 border border-[#39FF14]/30 rounded-2xl text-[#39FF14] font-bold drop-shadow-[0_0_8px_rgba(57,255,20,0.5)] shadow-[0_0_15px_rgba(57,255,20,0.1)] appearance-none focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50 focus:border-[#39FF14] transition-all cursor-pointer"
                >
                  {services.map((service) => (
                    <option key={service} value={service} className="bg-[#0a0a0a] text-white">
                      {service}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <div className="w-2 h-2 border-r-2 border-b-2 border-gray-500 rotate-45 group-focus-within:border-gold transition-colors"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-2xl">
            <label className="block text-xs font-black uppercase tracking-widest text-gold mb-3 ml-1">
              📝 Description
            </label>
            <div className="relative">
              <textarea
                readOnly
                value={activeProduct?.description || 'Please select a service to see the description.'}
                className="block w-full p-6 bg-white/5 border border-[#39FF14]/30 rounded-2xl text-gray-300 font-medium leading-relaxed focus:outline-none min-h-[120px] resize-none shadow-[0_0_15px_rgba(57,255,20,0.15)]"
              />
              {activeProduct && (
                <div className="absolute bottom-4 right-4 flex items-center gap-3">
                  <span className="px-5 py-2 bg-gold/10 text-gold text-sm font-black uppercase tracking-tighter rounded-full border border-gold/20 shadow-[0_0_10px_rgba(255,215,0,0.2)]">
                    ৳{activeProduct.price} / 1k
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-full max-w-md">
              <label className="block text-xs font-black uppercase tracking-widest text-gold mb-3 ml-1">
                🔗 Link
              </label>
              <input
                type="text"
                placeholder="https://www.example.com/profile"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="block w-full px-6 py-4 bg-white/5 border border-[#39FF14]/30 rounded-2xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50 focus:border-[#39FF14] transition-all shadow-[0_0_15px_rgba(57,255,20,0.1)]"
              />
            </div>

            <div className="w-full max-md:mt-6 max-w-md">
              <label className="block text-xs font-black uppercase tracking-widest text-gold mb-3 ml-1">
                🔢 Quantity
              </label>
              <input
                type="number"
                placeholder="Enter Quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                readOnly={isCustomCommentService}
                className={`block w-full px-6 py-4 bg-white/5 border border-[#39FF14]/30 rounded-2xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50 focus:border-[#39FF14] transition-all shadow-[0_0_15px_rgba(57,255,20,0.1)] ${isCustomCommentService ? 'opacity-70 cursor-not-allowed' : ''}`}
              />
              <p className="text-[#39FF14] text-xs font-black mt-2 ml-1 drop-shadow-[0_0_8px_rgba(57,255,20,0.6)] uppercase tracking-wider">
                Minimum: {minQuantity}
              </p>
            </div>
          </div>

          {isCustomCommentService && (
            <div className="w-full max-w-2xl">
              <label className="block text-xs font-black uppercase tracking-widest text-gold mb-3 ml-1">
                Description Comment ( Serial By Comment )
              </label>
              <div className="relative">
                <textarea
                  placeholder="Enter your custom comments here, one per line..."
                  value={customComments}
                  onChange={(e) => setCustomComments(e.target.value)}
                  className="block w-full p-6 bg-white/5 border border-[#39FF14]/30 rounded-2xl text-white font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50 focus:border-[#39FF14] min-h-[150px] resize-none shadow-[0_0_15px_rgba(57,255,20,0.15)]"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-full max-w-md">
              <label className="block text-xs font-black uppercase tracking-widest text-gold mb-3 ml-1">
                🕒 Average Delivery Time
              </label>
              <input
                type="text"
                readOnly
                value={activeProduct?.averageTime || ''}
                placeholder="Average delivery time..."
                className="block w-full px-6 py-4 bg-white/5 border border-[#39FF14]/30 rounded-2xl text-[#39FF14] font-bold focus:outline-none shadow-[0_0_15px_rgba(57,255,20,0.1)]"
              />
            </div>

            <div className="w-full max-md:mt-6 max-w-md">
              <label className="block text-xs font-black uppercase tracking-widest text-gold mb-3 ml-1">
                ৳ Charge
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={activeProduct && quantity ? `৳ ${((activeProduct.price / 1000) * Number(quantity)).toFixed(2)}` : '৳ 0.00'}
                  className="block w-full px-6 py-4 bg-white/5 border border-[#39FF14]/30 rounded-2xl text-[#39FF14] font-black text-xl focus:outline-none shadow-[0_0_20px_rgba(57,255,20,0.2)]"
                />
                <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Cost</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button 
              disabled={submitting}
              onClick={handleOrderSubmit}
              className="w-full md:w-auto px-12 py-4 bg-gold text-black font-black uppercase tracking-widest rounded-2xl hover:bg-white transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '⌛ Processing...' : '🚀 Submit Order'}
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuccessModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            ></motion.div>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#0a0a0a] border border-[#39FF14]/30 rounded-[2.5rem] p-8 md:p-10 shadow-[0_0_50px_rgba(57,255,20,0.15)] overflow-hidden"
            >
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <div className="flex flex-col items-center text-center space-y-8">
                <div className="w-20 h-20 bg-[#39FF14]/10 rounded-full flex items-center justify-center border border-[#39FF14]/20">
                  <CheckCircle2 className="text-[#39FF14] w-10 h-10 drop-shadow-[0_0_10px_rgba(57,255,20,0.5)]" />
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Order Received!</h3>
                  <p className="text-lg font-bold text-[#39FF14] leading-relaxed drop-shadow-[0_0_8px_rgba(57,255,20,0.4)]">
                    ✅ আপনার অর্ডার টি সম্পূর্ণ হয়েছে । 😊💚 অনুগ্রহ পূর্বক নির্দিষ্ট ডেলিভারি সময় পর্যন্ত অপেক্ষা করুন । ধন্যবাদ আমাদের সাথে থাকার জন্য 💚
                  </p>
                  
                  <div className="bg-white/5 rounded-2xl p-6 space-y-3 text-left">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Order ID:</span>
                      <span className="text-white font-bold">{orderId}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Remaining Balance:</span>
                      <span className="text-[#39FF14] font-black">৳ {remainingBalance.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  <button
                    onClick={() => setShowSuccessModal(false)}
                    className="flex items-center justify-center space-x-3 bg-[#39FF14] text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] transition-all"
                  >
                    <span>Done</span>
                  </button>
                  <Link
                    to="/orders"
                    className="flex items-center justify-center space-x-3 bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    <span>View Orders</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showLowBalanceModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLowBalanceModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            ></motion.div>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#0a0a0a] border border-[#39FF14]/30 rounded-[2.5rem] p-8 md:p-10 shadow-[0_0_50px_rgba(57,255,20,0.15)] overflow-hidden"
            >
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#39FF14]/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl -ml-16 -mb-16"></div>

              <button 
                onClick={() => setShowLowBalanceModal(false)}
                className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <div className="flex flex-col items-center text-center space-y-8">
                <div className="w-20 h-20 bg-[#39FF14]/10 rounded-full flex items-center justify-center border border-[#39FF14]/20">
                  <AlertTriangle className="text-[#39FF14] w-10 h-10 drop-shadow-[0_0_10px_rgba(57,255,20,0.5)]" />
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <p className="text-lg md:text-xl font-black text-white leading-relaxed flex items-start justify-center gap-3">
                      <span className="text-[#39FF14]">⚠️</span>
                      <span>দয়া করে আপনার একাউন্টে সর্বনিন্ম ব্যালেন্স যোগ করুন ।</span>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  <Link
                    to="/deposit"
                    onClick={() => setShowLowBalanceModal(false)}
                    className="flex items-center justify-center space-x-3 bg-[#39FF14] text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] transition-all"
                  >
                    <span>Add Balance</span>
                  </Link>
                  <a
                    href={siteSettings.whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-3 bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    <Phone size={18} />
                    <span>Contact Agent</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NewOrder;
