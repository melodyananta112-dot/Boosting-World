export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  averageTime?: string;
  platform: 'TikTok' | 'Facebook' | 'YouTube' | 'Instagram' | 'Telegram' | 'Other';
}

export interface CartItem extends Product {
  quantity: number;
}
