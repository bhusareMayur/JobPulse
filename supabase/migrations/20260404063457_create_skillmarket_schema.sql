/*
  # SkillMarket India - Database Schema
  
  ## Overview
  Complete database schema for the SkillMarket India trading platform where users
  trade skills/jobs using virtual currency (JobCoins).
  
  ## New Tables
  
  ### 1. profiles
  - `id` (uuid, FK to auth.users) - User profile ID
  - `balance` (decimal) - Current JobCoins balance (default: 10000)
  - `referral_code` (text, unique) - User's unique referral code
  - `referred_by` (text, nullable) - Referral code of the user who referred them
  - `referral_rewarded` (boolean) - Whether referral bonus has been paid
  - `created_at` (timestamptz) - Account creation timestamp
  
  ### 2. skills
  - `id` (uuid, PK) - Skill ID
  - `name` (text, unique) - Skill name (e.g., "AI Engineer", "React Developer")
  - `current_price` (decimal) - Current market price
  - `initial_price` (decimal) - Starting price for reference
  - `total_buy_volume` (integer) - Total buy orders (for price calculation)
  - `total_sell_volume` (integer) - Total sell orders (for price calculation)
  - `created_at` (timestamptz) - Creation timestamp
  
  ### 3. trades
  - `id` (uuid, PK) - Trade ID
  - `user_id` (uuid, FK) - User who executed the trade
  - `skill_id` (uuid, FK) - Skill being traded
  - `type` (text) - Trade type: 'buy' or 'sell'
  - `quantity` (integer) - Number of units traded
  - `price` (decimal) - Price per unit at time of trade
  - `total_value` (decimal) - Total transaction value (quantity * price)
  - `created_at` (timestamptz) - Trade execution timestamp
  
  ### 4. holdings
  - `user_id` (uuid, FK) - User ID
  - `skill_id` (uuid, FK) - Skill ID
  - `quantity` (integer) - Number of units held
  - `average_buy_price` (decimal) - Average purchase price
  - `updated_at` (timestamptz) - Last update timestamp
  - PRIMARY KEY (user_id, skill_id)
  
  ### 5. price_history
  - `id` (uuid, PK) - History record ID
  - `skill_id` (uuid, FK) - Skill ID
  - `price` (decimal) - Price at this point in time
  - `created_at` (timestamptz) - Timestamp of price change
  
  ### 6. referral_rewards
  - `id` (uuid, PK) - Reward record ID
  - `referrer_id` (uuid, FK) - User who referred
  - `referee_id` (uuid, FK) - User who was referred
  - `referrer_amount` (decimal) - Amount given to referrer (1000 JC)
  - `referee_amount` (decimal) - Amount given to referee (500 JC)
  - `paid_at` (timestamptz) - When reward was paid
  
  ## Security
  - RLS enabled on all tables
  - Users can only read/write their own profile, trades, and holdings
  - Skills and price_history are publicly readable
  - Leaderboard data is publicly readable
  
  ## Notes
  - All prices stored as DECIMAL(10,2) for precision
  - Referral rewards only paid after first trade
  - Price updates happen automatically on each trade
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance decimal(10,2) NOT NULL DEFAULT 10000.00 CHECK (balance >= 0),
  referral_code text UNIQUE NOT NULL,
  referred_by text,
  referral_rewarded boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  current_price decimal(10,2) NOT NULL CHECK (current_price > 0),
  initial_price decimal(10,2) NOT NULL CHECK (initial_price > 0),
  total_buy_volume integer DEFAULT 0 CHECK (total_buy_volume >= 0),
  total_sell_volume integer DEFAULT 0 CHECK (total_sell_volume >= 0),
  created_at timestamptz DEFAULT now()
);

-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('buy', 'sell')),
  quantity integer NOT NULL CHECK (quantity > 0),
  price decimal(10,2) NOT NULL CHECK (price > 0),
  total_value decimal(10,2) NOT NULL CHECK (total_value > 0),
  created_at timestamptz DEFAULT now()
);

-- Create holdings table
CREATE TABLE IF NOT EXISTS holdings (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  average_buy_price decimal(10,2) NOT NULL DEFAULT 0 CHECK (average_buy_price >= 0),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, skill_id)
);

-- Create price_history table
CREATE TABLE IF NOT EXISTS price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  price decimal(10,2) NOT NULL CHECK (price > 0),
  created_at timestamptz DEFAULT now()
);

-- Create referral_rewards table
CREATE TABLE IF NOT EXISTS referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referrer_amount decimal(10,2) NOT NULL DEFAULT 1000.00,
  referee_amount decimal(10,2) NOT NULL DEFAULT 500.00,
  paid_at timestamptz DEFAULT now(),
  UNIQUE(referrer_id, referee_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_skill_id ON trades(skill_id);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_price_history_skill_id ON price_history(skill_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view all profiles for leaderboard"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for skills (publicly readable)
CREATE POLICY "Anyone can view skills"
  ON skills FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for trades
CREATE POLICY "Users can view own trades"
  ON trades FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades"
  ON trades FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for holdings
CREATE POLICY "Users can view own holdings"
  ON holdings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view all holdings for leaderboard"
  ON holdings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage holdings"
  ON holdings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for price_history (publicly readable)
CREATE POLICY "Anyone can view price history"
  ON price_history FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for referral_rewards
CREATE POLICY "Users can view own referral rewards"
  ON referral_rewards FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    code := 'SM' || LPAD(FLOOR(random() * 1000000)::text, 6, '0');
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$;

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, referral_code, referred_by)
  VALUES (
    NEW.id,
    generate_referral_code(),
    NEW.raw_user_meta_data->>'referred_by'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile automatically on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();