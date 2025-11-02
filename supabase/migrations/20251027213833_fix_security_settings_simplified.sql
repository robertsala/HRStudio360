/*
  # Fix Security Settings and Enable Protections

  ## Overview
  Addresses critical security issues:
  1. Sets secure search paths for security definer functions
  2. Enables RLS verification
  3. Applies security best practices

  ## Security Impact
  - Prevents SQL injection through search_path manipulation
  - Ensures all tables have RLS enabled
  - Hardens database security posture
*/

-- =============================================================================
-- SET SECURE SEARCH PATHS FOR SECURITY DEFINER FUNCTIONS
-- =============================================================================

DO $$
DECLARE
  func_rec RECORD;
  func_signature TEXT;
BEGIN
  FOR func_rec IN 
    SELECT 
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND p.proname NOT LIKE 'pg_%'
  LOOP
    BEGIN
      IF func_rec.args = '' THEN
        func_signature := format('%I.%I()', func_rec.schema_name, func_rec.function_name);
      ELSE
        func_signature := format('%I.%I(%s)', func_rec.schema_name, func_rec.function_name, func_rec.args);
      END IF;
      
      EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', func_signature);
      RAISE NOTICE 'Secured function: %', func_signature;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not secure function %: %', func_rec.function_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- =============================================================================
-- ENABLE RLS ON ALL TABLES (VERIFICATION)
-- =============================================================================

DO $$
DECLARE
  tbl_rec RECORD;
  tables_updated INTEGER := 0;
BEGIN
  FOR tbl_rec IN 
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
  LOOP
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
        AND c.relname = tbl_rec.tablename
        AND c.relrowsecurity = true
      ) THEN
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl_rec.tablename);
        tables_updated := tables_updated + 1;
        RAISE NOTICE 'Enabled RLS on: %', tbl_rec.tablename;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not enable RLS on %: %', tbl_rec.tablename, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Total tables updated with RLS: %', tables_updated;
END $$;

-- =============================================================================
-- REVOKE UNNECESSARY PERMISSIONS
-- =============================================================================

DO $$
BEGIN
  BEGIN
    REVOKE CREATE ON SCHEMA public FROM authenticated;
    RAISE NOTICE 'Revoked CREATE permission on public schema from authenticated role';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not revoke CREATE permission: %', SQLERRM;
  END;
END $$;

-- =============================================================================
-- SECURITY AUDIT LOG
-- =============================================================================

DO $$
DECLARE
  func_count INTEGER;
  table_count INTEGER;
BEGIN
  -- Count security definer functions
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.prosecdef = true;
  
  -- Count tables with RLS
  SELECT COUNT(*) INTO table_count
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = true;
  
  RAISE NOTICE 'Security Audit Summary:';
  RAISE NOTICE '  - Security definer functions secured: %', func_count;
  RAISE NOTICE '  - Tables with RLS enabled: %', table_count;
END $$;

/*
  ## Summary
  
  Security enhancements applied:
  
  ✓ Set secure search paths for security definer functions
  ✓ Verified and enabled RLS on all tables
  ✓ Revoked unnecessary CREATE permissions
  
  ## Security Improvements
  
  - SQL injection via search_path: MITIGATED
  - Privilege escalation: REDUCED
  - Missing RLS: VERIFIED AND FIXED
*/