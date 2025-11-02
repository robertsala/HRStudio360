/*
  # Fix Final Generic Employee Names
  
  1. Overview
    - Updates last remaining employees with generic placeholder names
    - Covers Marketing (Mkt3-Mkt9), Product (Prod1-Prod24), and Sales (Sales4-Sales34)
    - Ensures all 180 employees have realistic professional names
    
  2. Changes Made
    - Replaces remaining "Mkt#", "Prod#", "Sales#" names with real names
    - Maintains job titles and department assignments
    - Profile pictures already assigned in previous migration
*/

-- Marketing employees
UPDATE employees SET first_name = 'Hannah', last_name = 'Myers', email = 'hannah.myers@company.com' WHERE first_name = 'Mkt3';
UPDATE employees SET first_name = 'Robert', last_name = 'Ford', email = 'robert.ford@company.com' WHERE first_name = 'Mkt4';
UPDATE employees SET first_name = 'Alexis', last_name = 'Hamilton', email = 'alexis.hamilton@company.com' WHERE first_name = 'Mkt5';
UPDATE employees SET first_name = 'Nicholas', last_name = 'Graham', email = 'nicholas.graham@company.com' WHERE first_name = 'Mkt6';
UPDATE employees SET first_name = 'Taylor', last_name = 'Sullivan', email = 'taylor.sullivan@company.com' WHERE first_name = 'Mkt7';
UPDATE employees SET first_name = 'Brandon', last_name = 'Wallace', email = 'brandon.wallace@company.com' WHERE first_name = 'Mkt8';
UPDATE employees SET first_name = 'Melissa', last_name = 'Woods', email = 'melissa.woods@company.com' WHERE first_name = 'Mkt9';

-- Product employees
UPDATE employees SET first_name = 'Austin', last_name = 'Chapman', email = 'austin.chapman@company.com' WHERE first_name = 'Prod1';
UPDATE employees SET first_name = 'Morgan', last_name = 'Mason', email = 'morgan.mason@company.com' WHERE first_name = 'Prod2';
UPDATE employees SET first_name = 'Dylan', last_name = 'Dixon', email = 'dylan.dixon@company.com' WHERE first_name = 'Prod3';
UPDATE employees SET first_name = 'Allison', last_name = 'Hunt', email = 'allison.hunt@company.com' WHERE first_name = 'Prod4';
UPDATE employees SET first_name = 'Jordan', last_name = 'Black', email = 'jordan.black@company.com' WHERE first_name = 'Prod5';
UPDATE employees SET first_name = 'Sydney', last_name = 'Warren', email = 'sydney.warren@company.com' WHERE first_name = 'Prod6';
UPDATE employees SET first_name = 'Connor', last_name = 'Marshall', email = 'connor.marshall@company.com' WHERE first_name = 'Prod7';
UPDATE employees SET first_name = 'Brooke', last_name = 'Wells', email = 'brooke.wells@company.com' WHERE first_name = 'Prod8';
UPDATE employees SET first_name = 'Cameron', last_name = 'Stone', email = 'cameron.stone@company.com' WHERE first_name = 'Prod9';
UPDATE employees SET first_name = 'Paige', last_name = 'Gardner', email = 'paige.gardner@company.com' WHERE first_name = 'Prod10';
UPDATE employees SET first_name = 'Ian', last_name = 'Webb', email = 'ian.webb@company.com' WHERE first_name = 'Prod11';
UPDATE employees SET first_name = 'Bailey', last_name = 'Hampton', email = 'bailey.hampton@company.com' WHERE first_name = 'Prod12';
UPDATE employees SET first_name = 'Cole', last_name = 'Newton', email = 'cole.newton@company.com' WHERE first_name = 'Prod13';
UPDATE employees SET first_name = 'Savannah', last_name = 'Pearson', email = 'savannah.pearson@company.com' WHERE first_name = 'Prod14';
UPDATE employees SET first_name = 'Landon', last_name = 'Knight', email = 'landon.knight@company.com' WHERE first_name = 'Prod15';
UPDATE employees SET first_name = 'Brooklyn', last_name = 'Oliver', email = 'brooklyn.oliver@company.com' WHERE first_name = 'Prod16';
UPDATE employees SET first_name = 'Carter', last_name = 'Dean', email = 'carter.dean@company.com' WHERE first_name = 'Prod17';
UPDATE employees SET first_name = 'Peyton', last_name = 'Burke', email = 'peyton.burke@company.com' WHERE first_name = 'Prod18';
UPDATE employees SET first_name = 'Wyatt', last_name = 'Fletcher', email = 'wyatt.fletcher@company.com' WHERE first_name = 'Prod19';
UPDATE employees SET first_name = 'Autumn', last_name = 'Craig', email = 'autumn.craig@company.com' WHERE first_name = 'Prod20';
UPDATE employees SET first_name = 'Gavin', last_name = 'Lawson', email = 'gavin.lawson@company.com' WHERE first_name = 'Prod21';
UPDATE employees SET first_name = 'Kaylee', last_name = 'Boyd', email = 'kaylee.boyd@company.com' WHERE first_name = 'Prod22';
UPDATE employees SET first_name = 'Xavier', last_name = 'Palmer', email = 'xavier.palmer@company.com' WHERE first_name = 'Prod23';
UPDATE employees SET first_name = 'Mackenzie', last_name = 'Tucker', email = 'mackenzie.tucker@company.com' WHERE first_name = 'Prod24';

-- Sales employees
UPDATE employees SET first_name = 'Melissa', last_name = 'Crawford', email = 'melissa.crawford@company.com' WHERE first_name = 'Sales4';
UPDATE employees SET first_name = 'Scott', last_name = 'Reynolds', email = 'scott.reynolds@company.com' WHERE first_name = 'Sales5';
UPDATE employees SET first_name = 'Heather', last_name = 'Fisher', email = 'heather.fisher@company.com' WHERE first_name = 'Sales6';
UPDATE employees SET first_name = 'Ryan', last_name = 'Ellis', email = 'ryan.ellis@company.com' WHERE first_name = 'Sales7';
UPDATE employees SET first_name = 'Amy', last_name = 'Harper', email = 'amy.harper@company.com' WHERE first_name = 'Sales8';
UPDATE employees SET first_name = 'Eric', last_name = 'Fox', email = 'eric.fox@company.com' WHERE first_name = 'Sales9';
UPDATE employees SET first_name = 'Shannon', last_name = 'Hicks', email = 'shannon.hicks@company.com' WHERE first_name = 'Sales32';
UPDATE employees SET first_name = 'Travis', last_name = 'Crawford', email = 'travis.crawford@company.com' WHERE first_name = 'Sales33';
UPDATE employees SET first_name = 'Courtney', last_name = 'Holmes', email = 'courtney.holmes@company.com' WHERE first_name = 'Sales34';
