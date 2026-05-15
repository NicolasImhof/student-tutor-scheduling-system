CREATE OR REPLACE FUNCTION get_users_by_ids(p_user_ids integer[])
RETURNS TABLE (user_id integer, first_name text, last_name text)
AS $$
BEGIN
    RETURN QUERY
    SELECT u.user_id, u.first_name::text, u.last_name::text
    FROM users u
    WHERE u.user_id = ANY(p_user_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;