-- Check if there are any messages in the guest_messages table
SELECT COUNT(*) as message_count FROM guest_messages;

-- Check the structure of guest_messages table
\d guest_messages

-- Check if RLS is enabled on guest_messages
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'guest_messages';

-- Check current policies on guest_messages
SELECT polname, polroles, polcmd, polqual, polwithcheck
FROM pg_policy 
WHERE polrelid = 'guest_messages'::regclass;

-- Try to select a few messages (this will show if there's a permissions issue)
SELECT * FROM guest_messages LIMIT 5;

-- Check if there are any guests
SELECT COUNT(*) as guest_count FROM guests;

-- Check a few guests
SELECT * FROM guests LIMIT 5;