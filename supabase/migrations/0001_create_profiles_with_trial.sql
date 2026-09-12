-- Profile per user: tracks the free trial window and Stripe subscription state.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  trial_ends_at timestamptz not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text not null default 'trialing'
    check (subscription_status in ('trialing', 'active', 'past_due', 'canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users may only ever read their own profile. Trial/subscription fields are
-- written exclusively by the signup trigger and the Stripe webhook (both run
-- with elevated privileges), never directly by the client, so there is no
-- update/insert policy for the 'authenticated' role.
create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- Auto-create a profile with a 1-month free trial whenever someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, trial_ends_at)
  values (new.id, new.email, now() + interval '1 month');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
