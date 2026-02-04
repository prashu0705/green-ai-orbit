-- Run this in your Supabase SQL Editor

-- 1. Create the function explicitly in the public schema
create or replace function public.delete_user()
returns void
language sql
security definer
set search_path = public
as $$
  delete from auth.users where id = auth.uid();
$$;

-- 2. Explicitly grant permission to logged-in users
grant execute on function public.delete_user() to authenticated;

-- IMPORTANT: After running this, go to Project Settings -> API -> Reload Schema Cache
