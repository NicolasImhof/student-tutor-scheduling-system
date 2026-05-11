
-- 1. Create the function to securely check if a user exists.
-- The SECURITY DEFINER clause allows this function to bypass RLS policies,
-- so it can query the users table even when called by an anonymous user.
CREATE OR REPLACE FUNCTION user_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Set the search_path to public to ensure we are querying the correct table
    -- This is a security best practice for SECURITY DEFINER functions
    SET search_path = public;
    
    RETURN EXISTS(SELECT 1 FROM users WHERE email = p_email);
END;
$$;
