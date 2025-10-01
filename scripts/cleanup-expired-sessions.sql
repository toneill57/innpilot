-- Cron Job: Cleanup expired prospective sessions
-- Description: Remove expired anonymous chat sessions to maintain database hygiene
-- Schedule: Daily at 3:00 AM (configure via pg_cron or external scheduler)
-- Created: 2025-10-01

-- Delete expired active sessions
DELETE FROM prospective_sessions
WHERE status = 'active' 
  AND expires_at < NOW();

-- Optional: Archive old converted sessions (older than 90 days)
-- UPDATE prospective_sessions
-- SET status = 'archived'
-- WHERE status = 'converted'
--   AND conversion_date < NOW() - INTERVAL '90 days';

-- Vacuum to reclaim space (optional, can be scheduled separately)
-- VACUUM ANALYZE prospective_sessions;

-- Log cleanup results
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Cleaned up % expired prospective sessions', deleted_count;
END $$;

-- Setup Instructions:
-- 
-- Option 1: pg_cron (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-prospective-sessions', '0 3 * * *', 
--   'DELETE FROM prospective_sessions WHERE status = ''active'' AND expires_at < NOW()');
--
-- Option 2: External scheduler (crontab, GitHub Actions, etc)
-- 0 3 * * * psql $DATABASE_URL -f /path/to/cleanup-expired-sessions.sql
--
-- Option 3: Supabase Edge Functions (scheduled function)
-- Create a scheduled edge function that calls this SQL via supabase client
