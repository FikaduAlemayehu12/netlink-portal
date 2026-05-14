UPDATE auth.users
SET encrypted_password = crypt('netlink@123', gen_salt('bf')),
    updated_at = now()
WHERE lower(email) = 'fikadu@netlink-gs.com';

UPDATE public.profiles
SET must_change_password = true, updated_at = now()
WHERE lower(email) = 'fikadu@netlink-gs.com';