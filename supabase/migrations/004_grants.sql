-- Grant the Supabase API roles access to our tables + functions.
--
-- The app does ALL database work through the service-role client
-- (lib/supabase.ts → supabaseAdmin), which bypasses RLS but still needs
-- table/function GRANTs. Hosted Supabase usually auto-grants these via default
-- privileges, but a local stack (and some projects) does not — without this,
-- every profiles/credits query fails with "permission denied for table".
--
-- Safe to run repeatedly.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- service_role is the trusted server identity — full access, bypasses RLS.
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Future tables/sequences/functions created in public inherit the grants.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role;

-- Credit RPCs are called by the server as service_role.
GRANT EXECUTE ON FUNCTION consume_credits(UUID, INTEGER, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION grant_credits(UUID, INTEGER, TEXT, JSONB) TO service_role;
