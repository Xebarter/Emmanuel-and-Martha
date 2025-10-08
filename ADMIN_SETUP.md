# Admin User Setup

This document explains how to set up the admin user for the dashboard.

## Credentials

- Email: admin@muwanguzis.com
- Password: Admin123

## Setup Process

### Step 1: Create the Auth User

First, you need to create the user in Supabase Authentication:

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "Users"
3. Click "New User"
4. Enter the email `admin@muwanguzis.com` and password `Admin123`
5. Click "Create User"
6. Note the User ID that is generated

### Step 2: Add User to Users Table

Now you need to add the user to the application's users table:

1. In the Supabase dashboard, go to "Table Editor"
2. Select the "users" table
3. Click "Insert Row"
4. Fill in the details:
   - id: [The User ID from Step 1]
   - email: admin@muwanguzis.com
   - full_name: Administrator
   - role: admin
5. Click "Save"

Alternatively, you can run the SQL script:

```sql
-- Replace 'USER_ID_FROM_AUTH' with the actual user ID from Supabase Auth
INSERT INTO users (id, email, full_name, role)
VALUES (
  'USER_ID_FROM_AUTH',  -- Replace with actual user ID from Supabase Auth
  'admin@muwanguzis.com',
  'Administrator',
  'admin'
);
```

### Alternative Manual Approach (If you encounter errors)

If you get the "Failed to create user: Database error" message, try this manual approach:

1. Create the user in the Supabase Authentication panel as described in Step 1
2. Copy the User ID (UUID) that was generated
3. Run the following SQL query in the Supabase SQL Editor, replacing `USER_ID_PLACEHOLDER` with the actual UUID:

```sql
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
```

### Advanced Fix for Persistent Issues

If you're still experiencing issues with user creation, there might be a problem with the automatic trigger that creates users in the [users](file:///d:/PROJECTS/Priscillah%20and%20John/project/supabase/migrations/general.sql#L77-L86) table. You can use the [fix-user-creation.sql](file:///d:/PROJECTS/Priscillah%20and%20John/project/fix-user-creation.sql) script:

1. Disable the trigger temporarily:
   ```sql
   ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;
   ```

2. Create the user through the Supabase Authentication panel

3. Manually add the user to the [users](file:///d:/PROJECTS/Priscillah%20and%20John/project/supabase/migrations/general.sql#L77-L86) table using the method described above

4. Re-enable the trigger:
   ```sql
   ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
   ```

### Step 3: Test the Login

1. Go to your application's login page (typically `/login`)
2. Enter the credentials:
   - Email: admin@muwanguzis.com
   - Password: Admin123
3. You should be redirected to the admin dashboard

## Troubleshooting

If you're unable to log in:

1. Make sure you've completed both steps above
2. Check that the user exists in both the Auth system and the users table
3. Verify that the user ID matches in both places
4. Confirm that the role is set to 'admin'
5. Check that the user exists in the `auth.users` table and the `users` table
6. If you're still having issues, try running this query to check if the user exists:

```sql
-- Check if user exists in auth.users
SELECT id, email, created_at FROM auth.users WHERE email = 'admin@muwanguzis.com';

-- Check if user exists in public.users
SELECT id, email, full_name, role FROM users WHERE email = 'admin@muwanguzis.com';
```

7. If you get permission errors when running these queries, make sure you're running them in the Supabase SQL Editor with sufficient privileges.