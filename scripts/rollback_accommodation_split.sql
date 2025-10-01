-- ROLLBACK: Revert FASE C changes
-- This script removes Phase 2 artifacts and restores to post-Phase 1 state

BEGIN;

-- Drop Phase 2 artifacts
DROP FUNCTION IF EXISTS match_guest_accommodations CASCADE;
DROP TABLE IF EXISTS accommodation_units_manual CASCADE;

-- Note: We keep accommodation_units_public as it was created in FASE B
-- Note: We keep accommodation_units as the consolidated source table

-- Verify state after rollback
SELECT
  'accommodation_units' as table_name,
  COUNT(*) as count
FROM accommodation_units
UNION ALL
SELECT
  'accommodation_units_public' as table_name,
  COUNT(*) as count
FROM accommodation_units_public;

COMMIT;

-- Instructions for full rollback to pre-FASE C:
-- If you need to restore from backup:
-- psql -h <host> -U <user> -d <database> -f /Users/oneill/Sites/apps/InnPilot/backups/accommodation_units_backup_20251001_094434.sql
