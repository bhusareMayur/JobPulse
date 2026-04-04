/*
  # Seed Initial Skills
  
  ## Description
  Populates the skills table with initial job roles and skills that are
  in demand in the Indian job market. Each skill starts at a base price
  and will fluctuate based on trading activity.
  
  ## Initial Skills
  - AI/ML Engineer - ₹1000
  - Full Stack Developer - ₹850
  - React Developer - ₹750
  - Backend Developer - ₹700
  - DevOps Engineer - ₹900
  - Data Analyst - ₹650
  - Python Developer - ₹700
  - Java Developer - ₹600
  - Cloud Architect - ₹950
  - Cybersecurity Specialist - ₹800
  - Mobile App Developer - ₹750
  - UI/UX Designer - ₹650
  - Product Manager - ₹900
  - Data Scientist - ₹1100
  - Blockchain Developer - ₹1200
*/

INSERT INTO skills (name, current_price, initial_price) VALUES
  ('AI/ML Engineer', 1000.00, 1000.00),
  ('Full Stack Developer', 850.00, 850.00),
  ('React Developer', 750.00, 750.00),
  ('Backend Developer', 700.00, 700.00),
  ('DevOps Engineer', 900.00, 900.00),
  ('Data Analyst', 650.00, 650.00),
  ('Python Developer', 700.00, 700.00),
  ('Java Developer', 600.00, 600.00),
  ('Cloud Architect', 950.00, 950.00),
  ('Cybersecurity Specialist', 800.00, 800.00),
  ('Mobile App Developer', 750.00, 750.00),
  ('UI/UX Designer', 650.00, 650.00),
  ('Product Manager', 900.00, 900.00),
  ('Data Scientist', 1100.00, 1100.00),
  ('Blockchain Developer', 1200.00, 1200.00)
ON CONFLICT (name) DO NOTHING;

-- Insert initial price history for all skills
INSERT INTO price_history (skill_id, price)
SELECT id, current_price FROM skills
ON CONFLICT DO NOTHING;