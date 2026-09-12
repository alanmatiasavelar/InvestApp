-- This is a trigger function, not a callable RPC. Postgres already refuses to invoke it
-- outside a trigger context, but revoke EXECUTE too so it isn't listed as public API surface.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
