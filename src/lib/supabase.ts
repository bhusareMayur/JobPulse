import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  balance: number;
  referral_code: string;
  referred_by: string | null;
  referral_rewarded: boolean;
  created_at: string;
}

export interface Skill {
  id: string;
  name: string;
  current_price: number;
  initial_price: number;
  total_buy_volume: number;
  total_sell_volume: number;
  created_at: string;
}

export interface Trade {
  id: string;
  user_id: string;
  skill_id: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  total_value: number;
  created_at: string;
}

export interface Holding {
  user_id: string;
  skill_id: string;
  quantity: number;
  average_buy_price: number;
  updated_at: string;
}

export interface PriceHistory {
  id: string;
  skill_id: string;
  price: number;
  created_at: string;
}
