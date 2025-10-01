-- Validation Script: Public Chat System Migrations
-- Run this after applying migrations to verify successful deployment
-- Usage: psql $DATABASE_URL -f scripts/validate-public-chat-migrations.sql

\echo '========================================='
\echo 'Public Chat Migrations Validation'
\echo '========================================='
\echo ''

\echo '1. Checking prospective_sessions table...'
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prospective_sessions')
    THEN '✅ Table exists'
    ELSE '❌ Table missing'
  END as table_status;

\echo ''
\echo '2. Checking prospective_sessions indexes...'
SELECT 
  indexname,
  CASE 
    WHEN idx_scan > 0 THEN '✅ Used'
    ELSE '⚠️  Not yet used'
  END as usage_status
FROM pg_stat_user_indexes
WHERE tablename = 'prospective_sessions'
ORDER BY indexname;

\echo ''
\echo '3. Checking accommodation_units_public table...'
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accommodation_units_public')
    THEN '✅ Table exists'
    ELSE '❌ Table missing'
  END as table_status;

\echo ''
\echo '4. Checking accommodation_units_public indexes...'
SELECT 
  indexname,
  CASE 
    WHEN idx_scan > 0 THEN '✅ Used'
    ELSE '⚠️  Not yet used'
  END as usage_status
FROM pg_stat_user_indexes
WHERE tablename = 'accommodation_units_public'
ORDER BY indexname;

\echo ''
\echo '5. Checking match_accommodations_public function...'
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'match_accommodations_public')
    THEN '✅ Function exists'
    ELSE '❌ Function missing'
  END as function_status;

\echo ''
\echo '6. Checking RLS policies...'
SELECT 
  tablename,
  policyname,
  CASE 
    WHEN cmd = 'ALL' THEN '✅ ALL operations'
    WHEN cmd = 'SELECT' THEN '✅ SELECT only'
    ELSE cmd
  END as permissions
FROM pg_policies
WHERE tablename IN ('prospective_sessions', 'accommodation_units_public')
ORDER BY tablename, policyname;

\echo ''
\echo '7. Checking data counts...'
SELECT 
  'prospective_sessions' as table_name,
  COUNT(*) as row_count,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count
FROM prospective_sessions
UNION ALL
SELECT 
  'accommodation_units_public' as table_name,
  COUNT(*) as row_count,
  COUNT(CASE WHEN is_bookable THEN 1 END) as bookable_count
FROM accommodation_units_public;

\echo ''
\echo '8. Checking vector embeddings...'
SELECT 
  COUNT(*) as total_units,
  COUNT(embedding) as with_full_embedding,
  COUNT(embedding_fast) as with_fast_embedding,
  CASE 
    WHEN COUNT(*) > 0 AND COUNT(embedding_fast) = COUNT(*) THEN '✅ All units have fast embeddings'
    WHEN COUNT(*) = 0 THEN '⚠️  No data yet'
    ELSE '❌ Missing embeddings'
  END as embedding_status
FROM accommodation_units_public;

\echo ''
\echo '========================================='
\echo 'Validation Complete'
\echo '========================================='
\echo ''
\echo 'Next steps:'
\echo '1. Run data migration: npx tsx scripts/migrate-accommodation-units-public.ts'
\echo '2. Schedule cleanup cron: scripts/cleanup-expired-sessions.sql'
\echo '3. Test vector search function'
\echo ''
