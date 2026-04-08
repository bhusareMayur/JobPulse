/*
  # Seed Initial Skills
  
  ## Description
  Populates the skills table with initial job roles and skills that are
  in demand in the Indian job market. Each skill starts at a base demand score
  and will fluctuate based on the cron job (JSearch API) and student tracking.
  
  ## Initial Skills
  - AI/ML Engineer 
  - Full Stack Developer 
  - React Developer 
  - Backend Developer 
  - DevOps Engineer 
  - Data Analyst 
  - Python Developer 
  - Java Developer 
  - Cloud Architect 
  - Cybersecurity Specialist 
  - Mobile App Developer 
  - UI/UX Designer 
  - Product Manager 
  - Data Scientist 
  - Blockchain Developer 
*/

INSERT INTO public.skills (name, demand_score, initial_demand_score, current_job_listings) VALUES
  ('AI/ML Engineer', 95.00, 95.00, 15000),
  ('Full Stack Developer', 88.50, 88.50, 22000),
  ('React Developer', 82.00, 82.00, 18500),
  ('Backend Developer', 85.00, 85.00, 19000),
  ('DevOps Engineer', 87.50, 87.50, 12000),
  ('Data Analyst', 78.00, 78.00, 14000),
  ('Python Developer', 84.00, 84.00, 25000),
  ('Java Developer', 80.00, 80.00, 28000),
  ('Cloud Architect', 92.00, 92.00, 8000),
  ('Cybersecurity Specialist', 86.00, 86.00, 9500),
  ('Mobile App Developer', 76.50, 76.50, 11000),
  ('UI/UX Designer', 72.00, 72.00, 7500),
  ('Product Manager', 89.00, 89.00, 6000),
  ('Data Scientist', 94.00, 94.00, 13000),
  ('Blockchain Developer', 70.00, 70.00, 3000)
ON CONFLICT (name) DO NOTHING;

-- Insert initial demand history for all skills to establish the baseline for charts
INSERT INTO public.demand_history (skill_id, score)
SELECT id, demand_score FROM public.skills
ON CONFLICT DO NOTHING;