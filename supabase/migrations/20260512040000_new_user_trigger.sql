
-- 1. Create the function that will be triggered on new user creation.
-- This function will insert a new row into public.users, pulling the user's
-- ID and email from the new authentication record.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- This is crucial for allowing the function to write to public.users
AS $$
BEGIN
    -- Insert a new profile record for the new user.
    -- The user's role is extracted from the raw metadata of the signup request.
    INSERT INTO public.users (auth_uuid, email, role, approval_status, first_name, last_name)
    VALUES (
        NEW.id, 
        NEW.email, 
        NEW.raw_user_meta_data->>'role', 
        'Pending',
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name'
    );
    RETURN NEW;
END;
$$;

-- 2. Create the trigger.
-- This trigger will fire the handle_new_user() function every time
-- a new user is added to the auth.users table.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Clean up the old, problematic RLS policy for INSERT.
-- This is no longer needed because the trigger handles profile creation.
DROP POLICY IF EXISTS "Allow individual insert access" ON public.users;
