-- SQL script to manually create admin user in both auth and users table
-- This approach bypasses the automatic trigger to avoid the "Failed to create user: Database error"

-- First, you need to create the user in the auth system through the Supabase dashboard
-- 1. Go to Authentication > Users in your Supabase project
-- 2. Click "New User"
-- 3. Enter email: admin@muwanguzis.com and password: Admin123
-- 4. After creating, copy the User ID (UUID) and replace USER_ID_PLACEHOLDER below

-- Then run this SQL script with the actual user ID:
/*
-- Insert user directly into the users table
-- Replace USER_ID_PLACEHOLDER with the actual UUID from the auth user you just created
INSERT INTO users (id, email, full_name, role)
VALUES (
  'USER_ID_PLACEHOLDER',  -- Replace with actual user ID from Supabase Auth
  'admin@muwanguzis.com',
  'Administrator',
  'admin'
)
ON CONFLICT (id) 
DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- Verify the user was created correctly
SELECT id, email, full_name, role FROM users WHERE email = 'admin@muwanguzis.com';
*/