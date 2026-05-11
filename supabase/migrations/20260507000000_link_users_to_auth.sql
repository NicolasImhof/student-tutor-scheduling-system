UPDATE public.users u
SET auth_uuid = a.id
FROM auth.users a
WHERE u.email = a.email;