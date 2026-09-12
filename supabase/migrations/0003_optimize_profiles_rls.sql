-- Wrap auth.uid() in a subselect so it's evaluated once per query instead of
-- once per row (Supabase linter: auth_rls_initplan).
drop policy "Users can view their own profile" on public.profiles;

create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);
