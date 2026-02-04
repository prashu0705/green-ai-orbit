-- Run this in your Supabase SQL Editor

-- Create a new function with a different name to avoid cache conflicts
-- Returns 'true' to ensure a clear response type
create or replace function public.delete_current_user()
returns boolean
language sql
security definer
set search_path = public
as $$
  delete from auth.users where id = auth.uid();
  return true;
$$;

-- Explicitly grant permission
grant execute on function public.delete_current_user() to authenticated;

-- After running this, please check Database -> Functions to verify it exists.
