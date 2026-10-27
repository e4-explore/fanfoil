-- =============================================================================
-- LOCAL TESTING ONLY. REMOVE BEFORE LAUNCH.
--
-- Lets the app accept 000000 as the six-digit email code in development
-- builds (see verifyEmailCode in src/providers/auth.tsx). The app asks this
-- function for the real code that was just emailed, then verifies with it.
--
-- Auth stores only a hash of the code: sha224(email || code), with a "pkce_"
-- prefix in the PKCE flow. With six digits there are only a million codes, so
-- this checks them all (well under a second locally).
--
-- It lives in a seed, not a migration, so it only ever exists in the local
-- database (seeds run on `supabase db reset`, never on a hosted project).
-- =============================================================================

create or replace function public.dev_email_code(p_email text)
returns text
language sql
security definer
set search_path = ''
as $$
  with latest as (
    select regexp_replace(token_hash, '^pkce_', '') as hash
    from auth.one_time_tokens
    where relates_to = lower(p_email)
    order by created_at desc
    limit 1
  )
  select lpad(n::text, 6, '0')
  from latest, generate_series(0, 999999) as n
  where encode(extensions.digest(lower(p_email) || lpad(n::text, 6, '0'), 'sha224'), 'hex') = latest.hash
  limit 1;
$$;

grant execute on function public.dev_email_code(text) to anon, authenticated;
