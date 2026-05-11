
-- 1. Enable RLS on the users table if it isn't already.
-- This is idempotent and safe to run even if RLS is already enabled.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. DROP existing policies to prevent conflicts and ensure a clean slate.
-- It is safer to recreate policies to ensure they have the correct logic.
DROP POLICY IF EXISTS "Allow individual insert access" ON public.users;
DROP POLICY IF EXISTS "Allow individual read access" ON public.users;
DROP POLICY IF EXISTS "Allow individual update access" ON public.users;

-- 3. CREATE POLICY for INSERT
-- This policy allows a newly authenticated user to insert their own profile.
-- The `auth.uid()` function gets the UUID of the currently logged-in user.
CREATE POLICY "Allow individual insert access" ON public.users
FOR INSERT
WITH CHECK (auth.uid() = auth_uuid);

-- 4. CREATE POLICY for SELECT
-- This policy allows a user to read their own profile information.
CREATE POLICY "Allow individual read access" ON public.users
FOR SELECT
USING (auth.uid() = auth_uuid);

-- 5. CREATE POLICY for UPDATE
-- This policy allows a user to update their own profile information.
CREATE POLICY "Allow individual update access" ON public.users
FOR UPDATE
USING (auth.uid() = auth_uuid)
WITH CHECK (auth.uid() = auth_uuid);
