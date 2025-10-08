-- SQL snippet to create the admin user
-- Email: admin@muwanguzis.com
-- Password: Admin123

-- First, we need to create the user through Supabase Auth
-- Then we can insert the user details into the users table

-- Insert the user details into the users table
-- Note: You'll need to replace 'USER_ID_FROM_AUTH' with the actual user ID from Supabase Auth
INSERT INTO users (id, email, full_name, role)
VALUES (
  'USER_ID_FROM_AUTH',  -- Replace with actual user ID from Supabase Auth
  'admin@muwanguzis.com',
  'Administrator',
  'admin'
);

-- Alternative approach: If you want to create the user directly in the database
-- and then manually create the auth user, you can use this:
/*
INSERT INTO users (id, email, full_name, role)
SELECT 
  auth.uid(),  -- Gets the current authenticated user ID
  'admin@muwanguzis.com',
  'Administrator',
  'admin'
WHERE EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'admin@muwanguzis.com'
);
*/