create table if not exists public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  snapshot jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_progress enable row level security;

grant select, insert, update on public.user_progress to authenticated;

drop policy if exists "Users can read their own NewLife30 progress" on public.user_progress;
create policy "Users can read their own NewLife30 progress"
on public.user_progress
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own NewLife30 progress" on public.user_progress;
create policy "Users can insert their own NewLife30 progress"
on public.user_progress
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own NewLife30 progress" on public.user_progress;
create policy "Users can update their own NewLife30 progress"
on public.user_progress
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
