# Public Chat System - Deployment Checklist

## Status: Ready for Development Testing
**Created**: October 1, 2025  
**Phase**: FASE B - Public Chat System

---

## Pre-Deployment Checklist

### 1. Code Review
- [ ] Review all 3 SQL migration files
- [ ] Review data migration TypeScript script
- [ ] Review cleanup cron job script
- [ ] Verify schema matches specification (plan.md lines 1238-1372)

### 2. Development Environment
- [ ] Database backup created
- [ ] Migration files copied to correct location
- [ ] Environment variables verified (.env.local)
- [ ] Database connection tested

---

## Migration Deployment Steps

### Phase 1: Apply SQL Migrations

#### Migration 1: prospective_sessions table
```bash
psql $DATABASE_URL -f supabase/migrations/20251001015000_add_prospective_sessions_table.sql
```
- [ ] Migration applied successfully
- [ ] Table `prospective_sessions` exists
- [ ] 4 indexes created
- [ ] RLS policies active

#### Migration 2: accommodation_units_public table
```bash
psql $DATABASE_URL -f supabase/migrations/20251001015100_add_accommodation_units_public_table.sql
```
- [ ] Migration applied successfully
- [ ] Table `accommodation_units_public` exists
- [ ] 3 indexes created (including HNSW)
- [ ] RLS policies active
- [ ] Trigger function created

#### Migration 3: match_accommodations_public function
```bash
psql $DATABASE_URL -f supabase/migrations/20251001015200_add_match_accommodations_public_function.sql
```
- [ ] Migration applied successfully
- [ ] Function `match_accommodations_public` exists
- [ ] Permissions granted to authenticated + anon roles

---

### Phase 2: Validation

#### Run Validation Script
```bash
psql $DATABASE_URL -f scripts/validate-public-chat-migrations.sql
```

**Expected Results**:
- [ ] ✅ prospective_sessions table exists
- [ ] ✅ 4 indexes on prospective_sessions
- [ ] ✅ accommodation_units_public table exists
- [ ] ✅ 3 indexes on accommodation_units_public
- [ ] ✅ match_accommodations_public function exists
- [ ] ✅ 4 RLS policies created
- [ ] ✅ No errors in validation output

#### Manual Checks
```sql
-- Check table structures
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('prospective_sessions', 'accommodation_units_public')
ORDER BY table_name, ordinal_position;
```
- [ ] All expected columns present
- [ ] Data types correct

```sql
-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('prospective_sessions', 'accommodation_units_public');
```
- [ ] RLS enabled on both tables

---

### Phase 3: Data Migration

#### Run Data Migration Script
```bash
npx tsx scripts/migrate-accommodation-units-public.ts
```

**Monitor Output**:
- [ ] Script connects to database successfully
- [ ] Reads accommodation_units data
- [ ] Generates embeddings (3072d + 1024d)
- [ ] Inserts into accommodation_units_public
- [ ] No fatal errors
- [ ] Success count > 0

#### Verify Data
```sql
SELECT 
  COUNT(*) as total_units,
  COUNT(embedding_fast) as with_fast_embedding,
  COUNT(embedding) as with_full_embedding,
  COUNT(CASE WHEN is_bookable THEN 1 END) as bookable_units
FROM accommodation_units_public;
```
- [ ] Total units > 0
- [ ] All units have fast embeddings
- [ ] Bookable units > 0

---

### Phase 4: Functional Testing

#### Test Vector Search Function
```sql
SELECT 
  id, 
  substring(content, 1, 80) as preview,
  similarity,
  pricing->>'base_price_night' as price
FROM match_accommodations_public(
  (SELECT embedding_fast FROM accommodation_units_public LIMIT 1),
  (SELECT tenant_id FROM tenant_registry WHERE slug = 'simmerdown'),
  0.3,
  4
);
```
- [ ] Function returns results
- [ ] 4 or fewer results returned
- [ ] Similarity scores > 0.3
- [ ] Pricing data present
- [ ] Execution time < 100ms

#### Test Session Creation
```sql
INSERT INTO prospective_sessions (tenant_id, cookie_id, landing_page)
VALUES (
  (SELECT tenant_id FROM tenant_registry LIMIT 1),
  'test-cookie-' || gen_random_uuid()::text,
  '/public-chat'
)
RETURNING session_id, created_at, expires_at;
```
- [ ] Session created successfully
- [ ] expires_at = created_at + 7 days
- [ ] Default values applied

#### Test RLS Policies
```sql
-- Test public read access (no auth)
SET ROLE anon;
SELECT COUNT(*) FROM accommodation_units_public WHERE is_bookable = true;
RESET ROLE;
```
- [ ] Anonymous can read bookable units
- [ ] Query executes successfully

---

### Phase 5: Performance Testing

#### Index Usage
```sql
SELECT 
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('prospective_sessions', 'accommodation_units_public')
ORDER BY tablename, indexname;
```
- [ ] Indexes exist
- [ ] Monitor usage after 24h

#### Query Performance
```sql
EXPLAIN ANALYZE
SELECT * FROM match_accommodations_public(
  (SELECT embedding_fast FROM accommodation_units_public LIMIT 1),
  (SELECT tenant_id FROM tenant_registry LIMIT 1),
  0.3,
  4
);
```
- [ ] Execution time < 100ms
- [ ] HNSW index used
- [ ] No sequential scans

---

### Phase 6: Cleanup Job Setup

#### Option 1: pg_cron (if available)
```sql
SELECT cron.schedule(
  'cleanup-prospective-sessions',
  '0 3 * * *',
  'DELETE FROM prospective_sessions WHERE status = ''active'' AND expires_at < NOW()'
);
```
- [ ] Cron job scheduled
- [ ] Verified in cron.job table

#### Option 2: External Scheduler
```bash
# Add to crontab
0 3 * * * psql $DATABASE_URL -f /path/to/scripts/cleanup-expired-sessions.sql
```
- [ ] Cron job configured
- [ ] Test execution manually

---

## Post-Deployment Monitoring

### First 24 Hours
- [ ] Monitor database logs for errors
- [ ] Check index usage statistics
- [ ] Verify RLS policies working
- [ ] Test vector search performance
- [ ] Monitor session creation rate

### First Week
- [ ] Check cleanup job execution
- [ ] Monitor expired sessions (should be 0 after cleanup)
- [ ] Review query performance metrics
- [ ] Validate conversion tracking
- [ ] Check database size growth

---

## Rollback Plan

### If Critical Issues Found:

#### Rollback Migration 3 (Function Only)
```sql
DROP FUNCTION IF EXISTS match_accommodations_public;
```
- [ ] Function dropped
- [ ] Fix applied
- [ ] Re-run migration 3

#### Rollback Migration 2 (Table + Function)
```sql
DROP TRIGGER IF EXISTS trigger_accommodation_units_public_updated_at ON accommodation_units_public;
DROP FUNCTION IF EXISTS update_accommodation_units_public_updated_at;
DROP TABLE IF EXISTS accommodation_units_public CASCADE;
```
- [ ] Table dropped
- [ ] Fix applied
- [ ] Re-run migration 2 & 3

#### Rollback Migration 1 (Sessions Table)
```sql
DROP TABLE IF EXISTS prospective_sessions CASCADE;
```
- [ ] Table dropped
- [ ] Fix applied
- [ ] Re-run all migrations

#### Full Rollback (Complete Removal)
```sql
DROP FUNCTION IF EXISTS match_accommodations_public;
DROP TRIGGER IF EXISTS trigger_accommodation_units_public_updated_at ON accommodation_units_public;
DROP FUNCTION IF EXISTS update_accommodation_units_public_updated_at;
DROP TABLE IF EXISTS accommodation_units_public CASCADE;
DROP TABLE IF EXISTS prospective_sessions CASCADE;
```
- [ ] All objects removed
- [ ] Database restored to pre-migration state

---

## Success Criteria

### Technical Success:
- [ ] All 3 migrations applied without errors
- [ ] All 7 indexes created successfully
- [ ] All 4 RLS policies active
- [ ] Vector search function operational
- [ ] Data migration completed (>0 units)
- [ ] Cleanup job scheduled
- [ ] Validation script passes all checks

### Performance Success:
- [ ] Vector search < 100ms (target: <50ms)
- [ ] Session creation < 20ms
- [ ] Index usage > 50% (after 24h)
- [ ] No database errors in logs

### Security Success:
- [ ] RLS preventing unauthorized access
- [ ] Tenant isolation working
- [ ] Anonymous access restricted to bookable units
- [ ] No cross-tenant data leaks

---

## Sign-off

### Development Environment
- [ ] All tests passed
- [ ] Performance acceptable
- [ ] Ready for staging

**Date**: _____________  
**Tested by**: _____________  
**Notes**: _____________

### Staging Environment
- [ ] All tests passed
- [ ] Load testing completed
- [ ] Ready for production

**Date**: _____________  
**Tested by**: _____________  
**Notes**: _____________

### Production Environment
- [ ] Migrations applied during maintenance
- [ ] Validation passed
- [ ] Monitoring active
- [ ] Ready for traffic

**Date**: _____________  
**Deployed by**: _____________  
**Notes**: _____________

---

## Reference Documents

- `PUBLIC_CHAT_MIGRATIONS_SUMMARY.md` - Complete technical summary
- `supabase/migrations/README.md` - Migration guide
- `plan.md` lines 1238-1372 - Original specification
- `docs/backend/MATRYOSHKA_ARCHITECTURE.md` - Embedding system
- `docs/backend/MULTI_TENANT_ARCHITECTURE.md` - Security model

---

**Status**: Ready for development deployment

**Created by**: Database Agent (Claude Code)  
**Date**: October 1, 2025
