create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  seller_name text,
  plan_id text not null,
  plan_label text not null,
  price integer not null,
  days integer not null,
  receipt_image text,
  status text not null default 'pending',
  submitted_at timestamptz not null default now(),
  activated_at timestamptz,
  ends_at timestamptz
);

alter table public.subscriptions enable row level security;

drop policy if exists "sub_select" on public.subscriptions;
drop policy if exists "sub_insert" on public.subscriptions;
drop policy if exists "sub_update" on public.subscriptions;

create policy "sub_select" on public.subscriptions for select
using (
  auth.uid() = user_id
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);

create policy "sub_insert" on public.subscriptions for insert
with check (auth.uid() = user_id and status = 'pending');

create policy "sub_update" on public.subscriptions for update
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

notify pgrst, 'reload schema';
