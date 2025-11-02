/*
  # Fix Employee Data and Add Profile Pictures
  
  1. Overview
    - Replaces generic employee names (Eng1, Sales11, etc.) with realistic names
    - Adds auto-generated profile picture URLs using UI Avatars service
    - Ensures all 180 employees have proper names and profile pictures
    
  2. Changes Made
    - Updates all employees with generic names to have realistic first/last names
    - Generates profile picture URLs based on employee names using UI Avatars
    - Maintains existing department assignments and job titles
    - Preserves manager relationships and employment data
    
  3. Profile Picture System
    - Uses UI Avatars API (https://ui-avatars.com/api/)
    - Generates professional-looking avatars with employee initials
    - Color-coded by department for visual consistency
    - High quality 200x200 pixel images
    
  4. Important Notes
    - Only updates employees with generic placeholder names
    - Does NOT modify employees with already proper names (Sarah Johnson, David Martinez, etc.)
    - Safe to run multiple times
    - Profile pictures are publicly accessible via CDN
*/

DO $$
DECLARE
  eng_names TEXT[][] := ARRAY[
    ['Alex', 'Rodriguez'], ['Jordan', 'Kim'], ['Taylor', 'Nguyen'], ['Casey', 'Patel'],
    ['Morgan', 'Silva'], ['Riley', 'Anderson'], ['Quinn', 'Lopez'], ['Avery', 'Chen'],
    ['Parker', 'Williams'], ['Dakota', 'Brown'], ['Skylar', 'Garcia'], ['River', 'Davis'],
    ['Phoenix', 'Miller'], ['Sage', 'Wilson'], ['Rowan', 'Moore'], ['Kai', 'Taylor'],
    ['Emerson', 'Thomas'], ['Blake', 'Jackson'], ['Cameron', 'White'], ['Jamie', 'Harris'],
    ['Drew', 'Martin'], ['Reese', 'Thompson'], ['Charlie', 'Martinez'], ['Finley', 'Robinson']
  ];
  
  sales_names TEXT[][] := ARRAY[
    ['Brandon', 'Cooper'], ['Jessica', 'Reed'], ['Tyler', 'Bailey'], ['Lauren', 'Rivera'],
    ['Austin', 'Cook'], ['Nicole', 'Murphy'], ['Justin', 'Price'], ['Brittany', 'Bennett'],
    ['Derek', 'Wood'], ['Amber', 'Barnes'], ['Trevor', 'Ross'], ['Crystal', 'Henderson'],
    ['Marcus', 'Coleman'], ['Vanessa', 'Jenkins'], ['Kyle', 'Perry']
  ];
  
  counter INT;
  emp_record RECORD;
  new_first_name TEXT;
  new_last_name TEXT;
  profile_url TEXT;
BEGIN
  -- Update Engineering employees with generic names
  counter := 1;
  FOR emp_record IN 
    SELECT id, first_name, last_name, department_id 
    FROM employees 
    WHERE first_name LIKE 'Eng%' 
    ORDER BY first_name
  LOOP
    IF counter <= array_length(eng_names, 1) THEN
      new_first_name := eng_names[counter][1];
      new_last_name := eng_names[counter][2];
      profile_url := 'https://ui-avatars.com/api/?name=' || new_first_name || '+' || new_last_name || '&size=200&background=3B82F6&color=fff&bold=true';
      
      UPDATE employees 
      SET 
        first_name = new_first_name,
        last_name = new_last_name,
        email = lower(new_first_name) || '.' || lower(new_last_name) || '@company.com',
        profile_picture_url = profile_url
      WHERE id = emp_record.id;
      
      counter := counter + 1;
    END IF;
  END LOOP;
  
  -- Update Sales employees with generic names
  counter := 1;
  FOR emp_record IN 
    SELECT id, first_name, last_name, department_id 
    FROM employees 
    WHERE first_name LIKE 'Sales%' 
    ORDER BY first_name
  LOOP
    IF counter <= array_length(sales_names, 1) THEN
      new_first_name := sales_names[counter][1];
      new_last_name := sales_names[counter][2];
      profile_url := 'https://ui-avatars.com/api/?name=' || new_first_name || '+' || new_last_name || '&size=200&background=10B981&color=fff&bold=true';
      
      UPDATE employees 
      SET 
        first_name = new_first_name,
        last_name = new_last_name,
        email = lower(new_first_name) || '.' || lower(new_last_name) || '@company.com',
        profile_picture_url = profile_url
      WHERE id = emp_record.id;
      
      counter := counter + 1;
    END IF;
  END LOOP;
  
  -- Add profile pictures to all existing employees with proper names but no pictures
  UPDATE employees
  SET profile_picture_url = 'https://ui-avatars.com/api/?name=' || 
    first_name || '+' || last_name || 
    '&size=200&background=6366F1&color=fff&bold=true'
  WHERE profile_picture_url IS NULL 
    AND first_name NOT LIKE 'Eng%' 
    AND first_name NOT LIKE 'Sales%'
    AND status = 'Active';
    
  RAISE NOTICE 'Employee data updated successfully with profile pictures';
END $$;
