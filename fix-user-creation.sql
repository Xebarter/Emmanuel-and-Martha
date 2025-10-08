-- Comprehensive script to fix user creation issues

-- First, let's check if the handle_new_user trigger is causing issues
-- Disable the trigger temporarily to allow manual user creation
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- Now you can create the user manually in the auth system:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "New User"
-- 3. Enter email: admin@muwanguzis.com and password: Admin123
-- 4. After creating, copy the User ID (UUID)

-- Then insert the user into the users table:
/*
-- Replace USER_ID_PLACEHOLDER with the actual UUID from the auth user
INSERT INTO users (id, email, full_name, role)
VALUES (
  'USER_ID_PLACEHOLDER',
  'admin@muwanguzis.com',
  'Administrator',
  'admin'
)
ON CONFLICT (id) 
DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;
*/

-- After creating the user, re-enable the trigger
-- ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

-- Diagnostic queries to check if the user exists:
-- Check auth.users table
-- SELECT id, email, created_at FROM auth.users WHERE email = 'admin@muwanguzis.com';

-- Check public.users table
-- SELECT id, email, full_name, role FROM users WHERE email = 'admin@muwanguzis.com';

-- If you want to manually test the handle_new_user function:
/*
-- First get the user details from auth.users
-- SELECT id, email, raw_user_meta_data FROM auth.users WHERE email = 'admin@muwanguzis.com';

-- Then manually call the function with the user data
-- SELECT public.handle_new_user() FROM auth.users WHERE email = 'admin@muwanguzis.com';
*/