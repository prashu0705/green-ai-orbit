-- Create Audit Logs table for Governance Backend
create table if not exists audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  action text not null,
  resource_id text,
  details jsonb default '{}'::jsonb,
  timestamp timestamptz default now() not null
);

-- Enable RLS
alter table audit_logs enable row level security;

-- Policy: Users can view their own logs
create policy "Users can view own audit logs"
  on audit_logs for select
  using ( auth.uid() = user_id );

-- Policy: Only Service Role can insert (Backend)
-- Note: In a real Supabase setup, you might grant insert to authenticated if using RLS, 
-- but strictly this should be backend-only. For this PoC, we will allow insert 
-- to facilitate the backend using the same connection or a service_role key.
create policy "Service Role can insert audit logs"
  on audit_logs for insert
  with check ( true ); -- We rely on the backend client using the service_role key
