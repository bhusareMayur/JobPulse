/*
  # JobPulse - Database Schema
  
  ## Overview
  Complete database schema for the JobPulse placement readiness platform where users
  track market demand for skills and build their learning portfolio.
  
  ## New Tables
  
  ### 1. profiles
  - `id` (uuid, FK to auth.users) - User profile ID
  - `created_at` (timestamptz) - Account creation timestamp
  - `full_name` (text) - Student's full name
  - `graduation_year` (integer) - Batch year (default: 2026)
  - `department` (text) - Student's department (e.g., Computer Science)
  - `email` (text) - Student's registered email
  
  ### 2. skills
  - `id` (uuid, PK) - Skill ID
  - `name` (text, unique) - Skill name (e.g., "AI Engineer", "React Developer")
  - `demand_score` (numeric) - Current market demand score
  - `initial_demand_score` (numeric) - Starting demand score for reference
  - `current_job_listings` (integer) - Latest volume of active jobs
  - `previous_job_listings` (integer) - Previous volume of active jobs
  - `external_demand_score` (numeric) - Trend multiplier
  - `created_at` (timestamptz) - Creation timestamp
  
  ### 3. tracked_skills
  - `id` (uuid, PK) - Tracking record ID
  - `user_id` (uuid, FK) - User tracking the skill
  - `skill_id` (uuid, FK) - Skill being tracked
  - `status` (text) - Status: 'interested', 'learning', or 'mastered'
  - `created_at` (timestamptz) - Tracking start timestamp
  - `updated_at` (timestamptz) - Last status update timestamp
  
  ### 4. demand_history
  - `id` (uuid, PK) - History record ID
  - `skill_id` (uuid, FK) - Skill ID
  - `score` (numeric) - Demand score at this point in time
  - `created_at` (timestamptz) - Timestamp of score change
  
  ### 5. external_demand_history
  - `id` (uuid, PK) - History record ID
  - `skill_id` (uuid, FK) - Skill ID
  - `job_listings_count` (integer) - Volume of jobs recorded
  - `source` (text) - Data source (e.g., JSearch API)
  - `created_at` (timestamptz) - Timestamp of external fetch
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  full_name text,
  graduation_year integer DEFAULT 2026,
  department text,
  email text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create skills table
CREATE TABLE IF NOT EXISTS public.skills (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  demand_score numeric NOT NULL CHECK (demand_score > 0::numeric),
  initial_demand_score numeric NOT NULL CHECK (initial_demand_score > 0::numeric),
  created_at timestamp with time zone DEFAULT now(),
  current_job_listings integer DEFAULT 0,
  previous_job_listings integer DEFAULT 0,
  external_demand_score numeric DEFAULT 1.00,
  CONSTRAINT skills_pkey PRIMARY KEY (id)
);

-- Create tracked_skills table
CREATE TABLE IF NOT EXISTS public.tracked_skills (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  skill_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'interested'::text CHECK (status = ANY (ARRAY['interested'::text, 'learning'::text, 'mastered'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tracked_skills_pkey PRIMARY KEY (id),
  CONSTRAINT tracked_skills_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT tracked_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE,
  UNIQUE(user_id, skill_id)
);

-- Create demand_history table
CREATE TABLE IF NOT EXISTS public.demand_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  skill_id uuid NOT NULL,
  score numeric NOT NULL CHECK (score > 0::numeric),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT demand_history_pkey PRIMARY KEY (id),
  CONSTRAINT demand_history_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE
);

-- Create external_demand_history table
CREATE TABLE IF NOT EXISTS public.external_demand_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  skill_id uuid NOT NULL,
  job_listings_count integer NOT NULL,
  source text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT external_demand_history_pkey PRIMARY KEY (id),
  CONSTRAINT external_demand_history_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tracked_skills_user_id ON tracked_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_tracked_skills_skill_id ON tracked_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_demand_history_skill_id ON demand_history(skill_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_demand_history ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can view all profiles for analytics"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for skills (publicly readable)
CREATE POLICY "Anyone can view skills"
  ON skills FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for tracked_skills
CREATE POLICY "Users can view own tracked skills"
  ON tracked_skills FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view all tracked skills for global analytics"
  ON tracked_skills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own tracked skills"
  ON tracked_skills FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tracked skills"
  ON tracked_skills FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tracked skills"
  ON tracked_skills FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for demand_history (publicly readable)
CREATE POLICY "Anyone can view demand history"
  ON demand_history FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for external_demand_history
CREATE POLICY "Anyone can view external demand history"
  ON external_demand_history FOR SELECT
  TO authenticated
  USING (true);

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, graduation_year, department, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'graduation_year')::integer, 2026),
    COALESCE(NEW.raw_user_meta_data->>'department', 'Unassigned'),
    NEW.email
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