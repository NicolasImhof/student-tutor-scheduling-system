
create or replace function get_users_for_management()
returns table (
    user_id integer,
    auth_uuid uuid,
    first_name text,
    last_name text,
    email text,
    role text, 
    approval_status text, 
    created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth;
as $$
begin
    if get_my_role() <> 'Super Admin' then
        raise exception 'Permission denied: must be a Super Admin.';
    end if;

    return query
    select
        u.user_id,
        u.auth_uuid,
        u.first_name,
        u.last_name,
        u.email,
        u.role::text,
        u.approval_status::text,
        a.created_at
    from public.users u
    join auth.users a on u.auth_uuid = a.id;
end;
$$;
