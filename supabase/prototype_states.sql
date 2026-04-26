create table if not exists public.prototype_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tenant_token text not null unique,
  state jsonb not null,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.prototype_states enable row level security;

create policy "Users can read own prototype state"
on public.prototype_states
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own prototype state"
on public.prototype_states
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own prototype state"
on public.prototype_states
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
