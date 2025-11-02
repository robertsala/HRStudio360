/*
  # Fix Remaining Generic Employee Names
  
  1. Overview
    - Updates remaining employees with generic placeholder names
    - Covers Engineering (Eng4-Eng49), HR (HR1-HR12), Marketing (Mkt1-Mkt20)
    - Adds profile pictures for all updated employees
    
  2. Changes Made
    - Replaces generic "Eng#", "HR#", "Mkt#" names with realistic names
    - Generates unique email addresses based on new names
    - Assigns department-appropriate profile picture colors
    - Maintains existing job titles and employment data
    
  3. Important Notes
    - Only updates employees with generic placeholder names
    - Profile pictures use UI Avatars service
    - Safe to run multiple times
*/

-- Update remaining Engineering employees (Eng4-Eng49)
UPDATE employees SET 
  first_name = 'Ryan', 
  last_name = 'Murphy',
  email = 'ryan.murphy@company.com',
  profile_picture_url = 'https://ui-avatars.com/api/?name=Ryan+Murphy&size=200&background=3B82F6&color=fff&bold=true'
WHERE first_name = 'Eng4' AND last_name = 'Person4';

UPDATE employees SET 
  first_name = 'Olivia', 
  last_name = 'Foster',
  email = 'olivia.foster@company.com',
  profile_picture_url = 'https://ui-avatars.com/api/?name=Olivia+Foster&size=200&background=3B82F6&color=fff&bold=true'
WHERE first_name = 'Eng5' AND last_name = 'Person5';

UPDATE employees SET 
  first_name = 'Mason', 
  last_name = 'Hayes',
  email = 'mason.hayes@company.com',
  profile_picture_url = 'https://ui-avatars.com/api/?name=Mason+Hayes&size=200&background=3B82F6&color=fff&bold=true'
WHERE first_name = 'Eng6' AND last_name = 'Person6';

UPDATE employees SET 
  first_name = 'Sophia', 
  last_name = 'Butler',
  email = 'sophia.butler@company.com',
  profile_picture_url = 'https://ui-avatars.com/api/?name=Sophia+Butler&size=200&background=3B82F6&color=fff&bold=true'
WHERE first_name = 'Eng7' AND last_name = 'Person7';

UPDATE employees SET 
  first_name = 'Lucas', 
  last_name = 'Powell',
  email = 'lucas.powell@company.com',
  profile_picture_url = 'https://ui-avatars.com/api/?name=Lucas+Powell&size=200&background=3B82F6&color=fff&bold=true'
WHERE first_name = 'Eng8' AND last_name = 'Person8';

UPDATE employees SET 
  first_name = 'Ava', 
  last_name = 'Russell',
  email = 'ava.russell@company.com',
  profile_picture_url = 'https://ui-avatars.com/api/?name=Ava+Russell&size=200&background=3B82F6&color=fff&bold=true'
WHERE first_name = 'Eng9' AND last_name = 'Person9';

UPDATE employees SET first_name = 'Ethan', last_name = 'Griffin', email = 'ethan.griffin@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Ethan+Griffin&size=200&background=3B82F6&color=fff&bold=true' WHERE first_name = 'Eng31';
UPDATE employees SET first_name = 'Emma', last_name = 'Diaz', email = 'emma.diaz@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Emma+Diaz&size=200&background=3B82F6&color=fff&bold=true' WHERE first_name = 'Eng32';
UPDATE employees SET first_name = 'Noah', last_name = 'Hayes', email = 'noah.hayes@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Noah+Hayes&size=200&background=3B82F6&color=fff&bold=true' WHERE first_name = 'Eng33';
UPDATE employees SET first_name = 'Isabella', last_name = 'Myers', email = 'isabella.myers@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Isabella+Myers&size=200&background=3B82F6&color=fff&bold=true' WHERE first_name = 'Eng34';
UPDATE employees SET first_name = 'Liam', last_name = 'Ford', email = 'liam.ford@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Liam+Ford&size=200&background=3B82F6&color=fff&bold=true' WHERE first_name = 'Eng35';
UPDATE employees SET first_name = 'Mia', last_name = 'Hamilton', email = 'mia.hamilton@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Mia+Hamilton&size=200&background=3B82F6&color=fff&bold=true' WHERE first_name = 'Eng36';
UPDATE employees SET first_name = 'William', last_name = 'Graham', email = 'william.graham@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=William+Graham&size=200&background=3B82F6&color=fff&bold=true' WHERE first_name = 'Eng37';
UPDATE employees SET first_name = 'Charlotte', last_name = 'Sullivan', email = 'charlotte.sullivan@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Charlotte+Sullivan&size=200&background=3B82F6&color=fff&bold=true' WHERE first_name = 'Eng38';
UPDATE employees SET first_name = 'James', last_name = 'Wallace', email = 'james.wallace@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=James+Wallace&size=200&background=3B82F6&color=fff&bold=true' WHERE first_name = 'Eng39';
UPDATE employees SET first_name = 'Amelia', last_name = 'Woods', email = 'amelia.woods@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Amelia+Woods&size=200&background=3B82F6&color=fff&bold=true' WHERE first_name = 'Eng40';
UPDATE employees SET first_name = 'Benjamin', last_name = 'Barnes', email = 'benjamin.barnes@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Benjamin+Barnes&size=200&background=3B82F6&color=fff&bold=true' WHERE first_name = 'Eng41';
UPDATE employees SET first_name = 'Harper', last_name = 'Ross', email = 'harper.ross@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Harper+Ross&size=200&background=3B82F6&color=fff&bold=true' WHERE first_name = 'Eng42';
UPDATE employees SET first_name = 'Elijah', last_name = 'Henderson', email = 'elijah.henderson@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Elijah+Henderson&size=200&background=3B82F6&color=fff&bold=true' WHERE first_name = 'Eng43';
UPDATE employees SET first_name = 'Evelyn', last_name = 'Coleman', email = 'evelyn.coleman@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Evelyn+Coleman&size=200&background=3B82F6&color=fff&bold=true' WHERE first_name = 'Eng44';
UPDATE employees SET first_name = 'Lucas', last_name = 'Jenkins', email = 'lucas.jenkins@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Lucas+Jenkins&size=200&background=3B82F6&color=fff&bold=true' WHERE first_name = 'Eng45';
UPDATE employees SET first_name = 'Abigail', last_name = 'Perry', email = 'abigail.perry@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Abigail+Perry&size=200&background=3B82F6&color=fff&bold=true' WHERE first_name = 'Eng46';
UPDATE employees SET first_name = 'Michael', last_name = 'Powell', email = 'michael.powell@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Michael+Powell&size=200&background=3B82F6&color=fff&bold=true' WHERE first_name = 'Eng47';
UPDATE employees SET first_name = 'Emily', last_name = 'Long', email = 'emily.long@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Emily+Long&size=200&background=3B82F6&color=fff&bold=true' WHERE first_name = 'Eng48';
UPDATE employees SET first_name = 'Alexander', last_name = 'Patterson', email = 'alexander.patterson@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Alexander+Patterson&size=200&background=3B82F6&color=fff&bold=true' WHERE first_name = 'Eng49';

-- Update HR employees (HR1-HR12)
UPDATE employees SET first_name = 'Rachel', last_name = 'Morrison', email = 'rachel.morrison@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Rachel+Morrison&size=200&background=F59E0B&color=fff&bold=true' WHERE first_name = 'HR1';
UPDATE employees SET first_name = 'Kevin', last_name = 'Hughes', email = 'kevin.hughes@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Kevin+Hughes&size=200&background=F59E0B&color=fff&bold=true' WHERE first_name = 'HR2';
UPDATE employees SET first_name = 'Natalie', last_name = 'Price', email = 'natalie.price@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Natalie+Price&size=200&background=F59E0B&color=fff&bold=true' WHERE first_name = 'HR3';
UPDATE employees SET first_name = 'Gregory', last_name = 'Bennett', email = 'gregory.bennett@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Gregory+Bennett&size=200&background=F59E0B&color=fff&bold=true' WHERE first_name = 'HR4';
UPDATE employees SET first_name = 'Michelle', last_name = 'Wood', email = 'michelle.wood@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Michelle+Wood&size=200&background=F59E0B&color=fff&bold=true' WHERE first_name = 'HR5';
UPDATE employees SET first_name = 'Brian', last_name = 'Barnes', email = 'brian.barnes@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Brian+Barnes&size=200&background=F59E0B&color=fff&bold=true' WHERE first_name = 'HR6';
UPDATE employees SET first_name = 'Stephanie', last_name = 'Ross', email = 'stephanie.ross@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Stephanie+Ross&size=200&background=F59E0B&color=fff&bold=true' WHERE first_name = 'HR7';
UPDATE employees SET first_name = 'Patrick', last_name = 'Henderson', email = 'patrick.henderson@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Patrick+Henderson&size=200&background=F59E0B&color=fff&bold=true' WHERE first_name = 'HR8';
UPDATE employees SET first_name = 'Andrea', last_name = 'Coleman', email = 'andrea.coleman@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Andrea+Coleman&size=200&background=F59E0B&color=fff&bold=true' WHERE first_name = 'HR9';
UPDATE employees SET first_name = 'Timothy', last_name = 'Jenkins', email = 'timothy.jenkins@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Timothy+Jenkins&size=200&background=F59E0B&color=fff&bold=true' WHERE first_name = 'HR10';
UPDATE employees SET first_name = 'Catherine', last_name = 'Perry', email = 'catherine.perry@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Catherine+Perry&size=200&background=F59E0B&color=fff&bold=true' WHERE first_name = 'HR11';
UPDATE employees SET first_name = 'Raymond', last_name = 'Powell', email = 'raymond.powell@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Raymond+Powell&size=200&background=F59E0B&color=fff&bold=true' WHERE first_name = 'HR12';

-- Update Marketing employees (Mkt1-Mkt20)
UPDATE employees SET first_name = 'Madison', last_name = 'Long', email = 'madison.long@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Madison+Long&size=200&background=EC4899&color=fff&bold=true' WHERE first_name = 'Mkt1';
UPDATE employees SET first_name = 'Joshua', last_name = 'Patterson', email = 'joshua.patterson@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Joshua+Patterson&size=200&background=EC4899&color=fff&bold=true' WHERE first_name = 'Mkt2';
UPDATE employees SET first_name = 'Victoria', last_name = 'Hughes', email = 'victoria.hughes@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Victoria+Hughes&size=200&background=EC4899&color=fff&bold=true' WHERE first_name = 'Mkt10';
UPDATE employees SET first_name = 'Andrew', last_name = 'Flores', email = 'andrew.flores@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Andrew+Flores&size=200&background=EC4899&color=fff&bold=true' WHERE first_name = 'Mkt11';
UPDATE employees SET first_name = 'Elizabeth', last_name = 'Washington', email = 'elizabeth.washington@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Elizabeth+Washington&size=200&background=EC4899&color=fff&bold=true' WHERE first_name = 'Mkt12';
UPDATE employees SET first_name = 'Daniel', last_name = 'Butler', email = 'daniel.butler@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Daniel+Butler&size=200&background=EC4899&color=fff&bold=true' WHERE first_name = 'Mkt13';
UPDATE employees SET first_name = 'Grace', last_name = 'Simmons', email = 'grace.simmons@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Grace+Simmons&size=200&background=EC4899&color=fff&bold=true' WHERE first_name = 'Mkt14';
UPDATE employees SET first_name = 'Nathan', last_name = 'Foster', email = 'nathan.foster@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Nathan+Foster&size=200&background=EC4899&color=fff&bold=true' WHERE first_name = 'Mkt15';
UPDATE employees SET first_name = 'Chloe', last_name = 'Gonzales', email = 'chloe.gonzales@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Chloe+Gonzales&size=200&background=EC4899&color=fff&bold=true' WHERE first_name = 'Mkt16';
UPDATE employees SET first_name = 'Samuel', last_name = 'Bryant', email = 'samuel.bryant@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Samuel+Bryant&size=200&background=EC4899&color=fff&bold=true' WHERE first_name = 'Mkt17';
UPDATE employees SET first_name = 'Lily', last_name = 'Alexander', email = 'lily.alexander@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Lily+Alexander&size=200&background=EC4899&color=fff&bold=true' WHERE first_name = 'Mkt18';
UPDATE employees SET first_name = 'Joseph', last_name = 'Russell', email = 'joseph.russell@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Joseph+Russell&size=200&background=EC4899&color=fff&bold=true' WHERE first_name = 'Mkt19';
UPDATE employees SET first_name = 'Zoe', last_name = 'Griffin', email = 'zoe.griffin@company.com', profile_picture_url = 'https://ui-avatars.com/api/?name=Zoe+Griffin&size=200&background=EC4899&color=fff&bold=true' WHERE first_name = 'Mkt20';
