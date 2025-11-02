/*
  # Synchronize Demo Account with Product Owner

  ## Overview
  This migration ensures the Demo account (demohrstudio360@gmail.com) is configured
  identically to the Product Owner account (robertsala@gmail.com) so that potential
  clients see the exact same full-featured experience.

  ## Changes Made

  1. **Language Preference**
     - Set preferred_language to 'en' for BOTH Demo and Product Owner accounts
     - This fixes the Spanish language issue on sign-in

  2. **Role Configuration**
     - Ensure Demo account has role = 'admin' (matching system role checks)
     - Product Owner remains 'Product Owner' as custom role

  3. **Department Assignment**
     - Set Demo account department to 'Product' (matching Product Owner)

  4. **Location Data**
     - Copy complete location data from Product Owner to Demo account
     - Includes city, state, latitude, longitude for weather functionality

  5. **Permissions**
     - Grant can_access_org_chart = true for Demo account
     - Ensures Demo account has same feature access as Product Owner

  ## Important Notes
  - Demo account must mirror Product Owner in all functionality
  - Any future changes to Product Owner should be replicated to Demo account
  - This ensures consistent demonstration experience for potential clients
*/

-- First, get the Product Owner's location data for reference
DO $$
DECLARE
  v_po_city text;
  v_po_state text;
  v_po_lat numeric;
  v_po_lon numeric;
  v_po_zip text;
BEGIN
  -- Get Product Owner location data
  SELECT 
    location_city,
    location_state,
    location_lat,
    location_lon,
    location_zip_code
  INTO v_po_city, v_po_state, v_po_lat, v_po_lon, v_po_zip
  FROM profiles
  WHERE email = 'robertsala@gmail.com';

  -- Update Product Owner to English language (fix the Spanish issue)
  UPDATE profiles
  SET 
    preferred_language = 'en',
    updated_at = now()
  WHERE email = 'robertsala@gmail.com';

  -- Update Demo account to match Product Owner configuration
  UPDATE profiles
  SET 
    role = 'admin',
    department = 'Product',
    preferred_language = 'en',
    location_city = v_po_city,
    location_state = v_po_state,
    location_lat = v_po_lat,
    location_lon = v_po_lon,
    location_zip_code = v_po_zip,
    can_access_org_chart = true,
    updated_at = now()
  WHERE email = 'demohrstudio360@gmail.com';

  -- Log the changes
  RAISE NOTICE 'Demo account synchronized with Product Owner:';
  RAISE NOTICE '  - Language set to English for both accounts';
  RAISE NOTICE '  - Demo role: admin, Department: Product';
  RAISE NOTICE '  - Location copied from Product Owner: %, %', v_po_city, v_po_state;
  RAISE NOTICE '  - Org chart access granted';
END $$;

-- Verify the changes
DO $$
DECLARE
  v_demo_record record;
  v_po_record record;
BEGIN
  SELECT * INTO v_demo_record FROM profiles WHERE email = 'demohrstudio360@gmail.com';
  SELECT * INTO v_po_record FROM profiles WHERE email = 'robertsala@gmail.com';
  
  RAISE NOTICE 'Verification - Demo Account:';
  RAISE NOTICE '  Email: %', v_demo_record.email;
  RAISE NOTICE '  Role: %', v_demo_record.role;
  RAISE NOTICE '  Department: %', v_demo_record.department;
  RAISE NOTICE '  Language: %', v_demo_record.preferred_language;
  RAISE NOTICE '  Location: %, %', v_demo_record.location_city, v_demo_record.location_state;
  RAISE NOTICE '  Org Chart Access: %', v_demo_record.can_access_org_chart;
  
  RAISE NOTICE 'Verification - Product Owner:';
  RAISE NOTICE '  Email: %', v_po_record.email;
  RAISE NOTICE '  Role: %', v_po_record.role;
  RAISE NOTICE '  Language: %', v_po_record.preferred_language;
  RAISE NOTICE '  Location: %, %', v_po_record.location_city, v_po_record.location_state;
END $$;
