import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ibmfsihdkdqxtjlavstp.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlibWZzaWhka2RxeHRqbGF2c3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MTk1ODIsImV4cCI6MjA3MzE5NTU4Mn0.IMwcE5Cu5DKEXv0kGgsnKjhsBrOMmd9GFA9Lbrptul4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const formatPrice = (price: string | number): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(numPrice);
};

export const calculateDiscount = (price: string | number, originalPrice: string | number): number => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  const numOriginalPrice = typeof originalPrice === 'string' ? parseFloat(originalPrice) : originalPrice;
  
  if (!numOriginalPrice || numOriginalPrice <= numPrice) return 0;
  
  return Math.round((1 - numPrice / numOriginalPrice) * 100);
};
