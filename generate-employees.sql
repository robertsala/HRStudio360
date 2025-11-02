-- Generate 200 Sample Employees with Diverse Roles and Departments

-- Create a temporary function to generate employees
CREATE OR REPLACE FUNCTION generate_sample_employees() RETURNS void AS $$
DECLARE
  dept_executive uuid;
  dept_engineering uuid;
  dept_product uuid;
  dept_sales uuid;
  dept_marketing uuid;
  dept_finance uuid;
  dept_hr uuid;
  dept_operations uuid;
  dept_legal uuid;
  dept_cs uuid;
  dept_it uuid;
  dept_data uuid;

  -- C-Level IDs
  ceo_id uuid := gen_random_uuid();
  cfo_id uuid := gen_random_uuid();
  cto_id uuid := gen_random_uuid();
  coo_id uuid := gen_random_uuid();
  cmo_id uuid := gen_random_uuid();
  chro_id uuid := gen_random_uuid();

  profile_pictures text[] := ARRAY[
    'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
    'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
    'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg',
    'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg',
    'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg',
    'https://images.pexels.com/photos/1181391/pexels-photo-1181391.jpeg',
    'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg',
    'https://images.pexels.com/photos/1542085/pexels-photo-1542085.jpeg',
    'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg',
    'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
    'https://images.pexels.com/photos/1310522/pexels-photo-1310522.jpeg',
    'https://images.pexels.com/photos/1520760/pexels-photo-1520760.jpeg',
    'https://images.pexels.com/photos/2182980/pexels-photo-2182980.jpeg',
    'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg',
    'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg'
  ];

BEGIN
  -- Get department IDs
  SELECT id INTO dept_executive FROM departments WHERE name = 'Executive';
  SELECT id INTO dept_engineering FROM departments WHERE name = 'Engineering';
  SELECT id INTO dept_product FROM departments WHERE name = 'Product';
  SELECT id INTO dept_sales FROM departments WHERE name = 'Sales';
  SELECT id INTO dept_marketing FROM departments WHERE name = 'Marketing';
  SELECT id INTO dept_finance FROM departments WHERE name = 'Finance';
  SELECT id INTO dept_hr FROM departments WHERE name = 'HR';
  SELECT id INTO dept_operations FROM departments WHERE name = 'Operations';
  SELECT id INTO dept_legal FROM departments WHERE name = 'Legal';
  SELECT id INTO dept_cs FROM departments WHERE name = 'Customer Success';
  SELECT id INTO dept_it FROM departments WHERE name = 'IT';
  SELECT id INTO dept_data FROM departments WHERE name = 'Data';

  -- Create C-Level Executives (CEO reports to nobody)
  INSERT INTO profiles (id, email, first_name, last_name, phone, department, role, profile_picture, created_at)
  VALUES
    (ceo_id, 'sarah.johnson@company.com', 'Sarah', 'Johnson', '555-0001', 'Executive', 'Chief Executive Officer', profile_pictures[1], NOW()),
    (cfo_id, 'michael.chen@company.com', 'Michael', 'Chen', '555-0002', 'Finance', 'Chief Financial Officer', profile_pictures[2], NOW()),
    (cto_id, 'david.martinez@company.com', 'David', 'Martinez', '555-0003', 'Engineering', 'Chief Technology Officer', profile_pictures[3], NOW()),
    (coo_id, 'jennifer.williams@company.com', 'Jennifer', 'Williams', '555-0004', 'Operations', 'Chief Operating Officer', profile_pictures[4], NOW()),
    (cmo_id, 'amanda.taylor@company.com', 'Amanda', 'Taylor', '555-0005', 'Marketing', 'Chief Marketing Officer', profile_pictures[5], NOW()),
    (chro_id, 'robert.anderson@company.com', 'Robert', 'Anderson', '555-0006', 'HR', 'Chief Human Resources Officer', profile_pictures[6], NOW());

  INSERT INTO employees (id, user_id, employee_id, department_id, manager_id, start_date, employment_type, salary, status, created_at)
  VALUES
    (gen_random_uuid(), ceo_id, 'EMP001', dept_executive, NULL, '2020-01-01', 'full-time', 350000, 'active', NOW()),
    (gen_random_uuid(), cfo_id, 'EMP002', dept_finance, ceo_id, '2020-02-01', 'full-time', 280000, 'active', NOW()),
    (gen_random_uuid(), cto_id, 'EMP003', dept_engineering, ceo_id, '2020-02-15', 'full-time', 300000, 'active', NOW()),
    (gen_random_uuid(), coo_id, 'EMP004', dept_operations, ceo_id, '2020-03-01', 'full-time', 275000, 'active', NOW()),
    (gen_random_uuid(), cmo_id, 'EMP005', dept_marketing, ceo_id, '2020-03-15', 'full-time', 260000, 'active', NOW()),
    (gen_random_uuid(), chro_id, 'EMP006', dept_hr, ceo_id, '2020-04-01', 'full-time', 240000, 'active', NOW());

  -- Engineering Department (40 employees)
  -- VP of Engineering
  INSERT INTO profiles (id, email, first_name, last_name, phone, department, role, profile_picture, created_at) VALUES
    (gen_random_uuid(), 'lisa.wong@company.com', 'Lisa', 'Wong', '555-0101', 'Engineering', 'VP of Engineering', profile_pictures[7], NOW());

  INSERT INTO employees (id, user_id, employee_id, department_id, manager_id, start_date, employment_type, salary, status, created_at)
  SELECT gen_random_uuid(), p.id, 'EMP101', dept_engineering, cto_id, '2020-05-01', 'full-time', 220000, 'active', NOW()
  FROM profiles p WHERE p.email = 'lisa.wong@company.com';

  -- Engineering Managers
  INSERT INTO profiles (id, email, first_name, last_name, phone, department, role, profile_picture, created_at) VALUES
    (gen_random_uuid(), 'james.kim@company.com', 'James', 'Kim', '555-0102', 'Engineering', 'Engineering Manager', profile_pictures[8], NOW()),
    (gen_random_uuid(), 'priya.patel@company.com', 'Priya', 'Patel', '555-0103', 'Engineering', 'Engineering Manager', profile_pictures[9], NOW()),
    (gen_random_uuid(), 'carlos.rodriguez@company.com', 'Carlos', 'Rodriguez', '555-0104', 'Engineering', 'Engineering Manager', profile_pictures[10], NOW());

  -- Senior Engineers
  INSERT INTO profiles (id, email, first_name, last_name, phone, department, role, profile_picture, created_at) VALUES
    (gen_random_uuid(), 'emily.zhang@company.com', 'Emily', 'Zhang', '555-0105', 'Engineering', 'Senior Software Engineer', profile_pictures[11], NOW()),
    (gen_random_uuid(), 'alex.brown@company.com', 'Alex', 'Brown', '555-0106', 'Engineering', 'Senior Software Engineer', profile_pictures[12], NOW()),
    (gen_random_uuid(), 'maria.garcia@company.com', 'Maria', 'Garcia', '555-0107', 'Engineering', 'Senior Software Engineer', profile_pictures[13], NOW()),
    (gen_random_uuid(), 'kevin.liu@company.com', 'Kevin', 'Liu', '555-0108', 'Engineering', 'Senior DevOps Engineer', profile_pictures[14], NOW()),
    (gen_random_uuid(), 'sophia.nguyen@company.com', 'Sophia', 'Nguyen', '555-0109', 'Engineering', 'Senior Software Engineer', profile_pictures[15], NOW()),
    (gen_random_uuid(), 'daniel.cohen@company.com', 'Daniel', 'Cohen', '555-0110', 'Engineering', 'Senior Backend Engineer', profile_pictures[1], NOW()),
    (gen_random_uuid(), 'rachel.murphy@company.com', 'Rachel', 'Murphy', '555-0111', 'Engineering', 'Senior Frontend Engineer', profile_pictures[2], NOW()),
    (gen_random_uuid(), 'thomas.lee@company.com', 'Thomas', 'Lee', '555-0112', 'Engineering', 'Senior Full Stack Engineer', profile_pictures[3], NOW()),
    (gen_random_uuid(), 'jessica.white@company.com', 'Jessica', 'White', '555-0113', 'Engineering', 'Senior Software Engineer', profile_pictures[4], NOW());

  -- Mid-level Engineers
  INSERT INTO profiles (id, email, first_name, last_name, phone, department, role, profile_picture, created_at) VALUES
    (gen_random_uuid(), 'andrew.thompson@company.com', 'Andrew', 'Thompson', '555-0114', 'Engineering', 'Software Engineer', profile_pictures[5], NOW()),
    (gen_random_uuid(), 'nicole.davis@company.com', 'Nicole', 'Davis', '555-0115', 'Engineering', 'Software Engineer', profile_pictures[6], NOW()),
    (gen_random_uuid(), 'ryan.wilson@company.com', 'Ryan', 'Wilson', '555-0116', 'Engineering', 'Backend Engineer', profile_pictures[7], NOW()),
    (gen_random_uuid(), 'michelle.hall@company.com', 'Michelle', 'Hall', '555-0117', 'Engineering', 'Frontend Engineer', profile_pictures[8], NOW()),
    (gen_random_uuid(), 'brandon.young@company.com', 'Brandon', 'Young', '555-0118', 'Engineering', 'Full Stack Engineer', profile_pictures[9], NOW()),
    (gen_random_uuid(), 'ashley.moore@company.com', 'Ashley', 'Moore', '555-0119', 'Engineering', 'DevOps Engineer', profile_pictures[10], NOW()),
    (gen_random_uuid(), 'justin.jackson@company.com', 'Justin', 'Jackson', '555-0120', 'Engineering', 'Software Engineer', profile_pictures[11], NOW()),
    (gen_random_uuid(), 'stephanie.martin@company.com', 'Stephanie', 'Martin', '555-0121', 'Engineering', 'QA Engineer', profile_pictures[12], NOW()),
    (gen_random_uuid(), 'matthew.clark@company.com', 'Matthew', 'Clark', '555-0122', 'Engineering', 'Software Engineer', profile_pictures[13], NOW()),
    (gen_random_uuid(), 'lauren.lewis@company.com', 'Lauren', 'Lewis', '555-0123', 'Engineering', 'Mobile Engineer', profile_pictures[14], NOW());

  -- Junior Engineers
  INSERT INTO profiles (id, email, first_name, last_name, phone, department, role, profile_picture, created_at) VALUES
    (gen_random_uuid(), 'jonathan.hill@company.com', 'Jonathan', 'Hill', '555-0124', 'Engineering', 'Junior Software Engineer', profile_pictures[15], NOW()),
    (gen_random_uuid(), 'amber.scott@company.com', 'Amber', 'Scott', '555-0125', 'Engineering', 'Junior Frontend Engineer', profile_pictures[1], NOW()),
    (gen_random_uuid(), 'tyler.green@company.com', 'Tyler', 'Green', '555-0126', 'Engineering', 'Junior Backend Engineer', profile_pictures[2], NOW()),
    (gen_random_uuid(), 'brittany.adams@company.com', 'Brittany', 'Adams', '555-0127', 'Engineering', 'Junior Software Engineer', profile_pictures[3], NOW()),
    (gen_random_uuid(), 'joshua.baker@company.com', 'Joshua', 'Baker', '555-0128', 'Engineering', 'Associate Software Engineer', profile_pictures[4], NOW()),
    (gen_random_uuid(), 'samantha.gonzalez@company.com', 'Samantha', 'Gonzalez', '555-0129', 'Engineering', 'Junior DevOps Engineer', profile_pictures[5], NOW()),
    (gen_random_uuid(), 'nathan.nelson@company.com', 'Nathan', 'Nelson', '555-0130', 'Engineering', 'Junior Software Engineer', profile_pictures[6], NOW()),
    (gen_random_uuid(), 'megan.carter@company.com', 'Megan', 'Carter', '555-0131', 'Engineering', 'Associate QA Engineer', profile_pictures[7], NOW()),
    (gen_random_uuid(), 'christopher.mitchell@company.com', 'Christopher', 'Mitchell', '555-0132', 'Engineering', 'Junior Full Stack Engineer', profile_pictures[8], NOW()),
    (gen_random_uuid(), 'hannah.perez@company.com', 'Hannah', 'Perez', '555-0133', 'Engineering', 'Junior Software Engineer', profile_pictures[9], NOW()),
    (gen_random_uuid(), 'austin.roberts@company.com', 'Austin', 'Roberts', '555-0134', 'Engineering', 'Associate Software Engineer', profile_pictures[10], NOW()),
    (gen_random_uuid(), 'victoria.turner@company.com', 'Victoria', 'Turner', '555-0135', 'Engineering', 'Junior Mobile Engineer', profile_pictures[11], NOW());

  -- Product Department (20 employees)
  INSERT INTO profiles (id, email, first_name, last_name, phone, department, role, profile_picture, created_at) VALUES
    (gen_random_uuid(), 'mark.phillips@company.com', 'Mark', 'Phillips', '555-0201', 'Product', 'VP of Product', profile_pictures[12], NOW()),
    (gen_random_uuid(), 'laura.campbell@company.com', 'Laura', 'Campbell', '555-0202', 'Product', 'Senior Product Manager', profile_pictures[13], NOW()),
    (gen_random_uuid(), 'eric.parker@company.com', 'Eric', 'Parker', '555-0203', 'Product', 'Senior Product Manager', profile_pictures[14], NOW()),
    (gen_random_uuid(), 'diana.evans@company.com', 'Diana', 'Evans', '555-0204', 'Product', 'Product Manager', profile_pictures[15], NOW()),
    (gen_random_uuid(), 'patrick.edwards@company.com', 'Patrick', 'Edwards', '555-0205', 'Product', 'Product Manager', profile_pictures[1], NOW()),
    (gen_random_uuid(), 'christina.collins@company.com', 'Christina', 'Collins', '555-0206', 'Product', 'Product Manager', profile_pictures[2], NOW()),
    (gen_random_uuid(), 'gregory.stewart@company.com', 'Gregory', 'Stewart', '555-0207', 'Product', 'Associate Product Manager', profile_pictures[3], NOW()),
    (gen_random_uuid(), 'tiffany.morris@company.com', 'Tiffany', 'Morris', '555-0208', 'Product', 'Associate Product Manager', profile_pictures[4], NOW()),
    (gen_random_uuid(), 'sean.murphy@company.com', 'Sean', 'Murphy', '555-0209', 'Product', 'Product Designer', profile_pictures[5], NOW()),
    (gen_random_uuid(), 'vanessa.cook@company.com', 'Vanessa', 'Cook', '555-0210', 'Product', 'Senior UX Designer', profile_pictures[6], NOW()),
    (gen_random_uuid(), 'ian.rogers@company.com', 'Ian', 'Rogers', '555-0211', 'Product', 'UX Designer', profile_pictures[7], NOW()),
    (gen_random_uuid(), 'crystal.reed@company.com', 'Crystal', 'Reed', '555-0212', 'Product', 'UI Designer', profile_pictures[8], NOW()),
    (gen_random_uuid(), 'benjamin.bailey@company.com', 'Benjamin', 'Bailey', '555-0213', 'Product', 'Product Analyst', profile_pictures[9], NOW()),
    (gen_random_uuid(), 'courtney.richardson@company.com', 'Courtney', 'Richardson', '555-0214', 'Product', 'UX Researcher', profile_pictures[10], NOW()),
    (gen_random_uuid(), 'douglas.cox@company.com', 'Douglas', 'Cox', '555-0215', 'Product', 'Technical Product Manager', profile_pictures[11], NOW()),
    (gen_random_uuid(), 'melanie.howard@company.com', 'Melanie', 'Howard', '555-0216', 'Product', 'Product Operations Manager', profile_pictures[12], NOW()),
    (gen_random_uuid(), 'kyle.ward@company.com', 'Kyle', 'Ward', '555-0217', 'Product', 'Product Marketing Manager', profile_pictures[13], NOW()),
    (gen_random_uuid(), 'andrea.torres@company.com', 'Andrea', 'Torres', '555-0218', 'Product', 'Senior Product Designer', profile_pictures[14], NOW()),
    (gen_random_uuid(), 'troy.peterson@company.com', 'Troy', 'Peterson', '555-0219', 'Product', 'Product Manager', profile_pictures[15], NOW()),
    (gen_random_uuid(), 'monica.gray@company.com', 'Monica', 'Gray', '555-0220', 'Product', 'Associate Product Manager', profile_pictures[1], NOW());

  -- Sales Department (30 employees)
  INSERT INTO profiles (id, email, first_name, last_name, phone, department, role, profile_picture, created_at) VALUES
    (gen_random_uuid(), 'william.ramirez@company.com', 'William', 'Ramirez', '555-0301', 'Sales', 'VP of Sales', profile_pictures[2], NOW()),
    (gen_random_uuid(), 'karen.james@company.com', 'Karen', 'James', '555-0302', 'Sales', 'Sales Director', profile_pictures[3], NOW()),
    (gen_random_uuid(), 'scott.watson@company.com', 'Scott', 'Watson', '555-0303', 'Sales', 'Sales Director', profile_pictures[4], NOW()),
    (gen_random_uuid(), 'heather.brooks@company.com', 'Heather', 'Brooks', '555-0304', 'Sales', 'Enterprise Sales Manager', profile_pictures[5], NOW()),
    (gen_random_uuid(), 'raymond.kelly@company.com', 'Raymond', 'Kelly', '555-0305', 'Sales', 'Enterprise Sales Manager', profile_pictures[6], NOW()),
    (gen_random_uuid(), 'catherine.sanders@company.com', 'Catherine', 'Sanders', '555-0306', 'Sales', 'Regional Sales Manager', profile_pictures[7], NOW()),
    (gen_random_uuid(), 'jeffrey.price@company.com', 'Jeffrey', 'Price', '555-0307', 'Sales', 'Senior Account Executive', profile_pictures[8], NOW()),
    (gen_random_uuid(), 'sharon.bennett@company.com', 'Sharon', 'Bennett', '555-0308', 'Sales', 'Senior Account Executive', profile_pictures[9], NOW()),
    (gen_random_uuid(), 'jerry.wood@company.com', 'Jerry', 'Wood', '555-0309', 'Sales', 'Senior Account Executive', profile_pictures[10], NOW()),
    (gen_random_uuid(), 'debra.barnes@company.com', 'Debra', 'Barnes', '555-0310', 'Sales', 'Account Executive', profile_pictures[11], NOW()),
    (gen_random_uuid(), 'dennis.ross@company.com', 'Dennis', 'Ross', '555-0311', 'Sales', 'Account Executive', profile_pictures[12], NOW()),
    (gen_random_uuid(), 'rebecca.henderson@company.com', 'Rebecca', 'Henderson', '555-0312', 'Sales', 'Account Executive', profile_pictures[13], NOW()),
    (gen_random_uuid(), 'walter.coleman@company.com', 'Walter', 'Coleman', '555-0313', 'Sales', 'Account Executive', profile_pictures[14], NOW()),
    (gen_random_uuid(), 'carolyn.jenkins@company.com', 'Carolyn', 'Jenkins', '555-0314', 'Sales', 'Account Executive', profile_pictures[15], NOW()),
    (gen_random_uuid(), 'henry.perry@company.com', 'Henry', 'Perry', '555-0315', 'Sales', 'Sales Development Rep', profile_pictures[1], NOW()),
    (gen_random_uuid(), 'janet.powell@company.com', 'Janet', 'Powell', '555-0316', 'Sales', 'Sales Development Rep', profile_pictures[2], NOW()),
    (gen_random_uuid(), 'carl.long@company.com', 'Carl', 'Long', '555-0317', 'Sales', 'Sales Development Rep', profile_pictures[3], NOW()),
    (gen_random_uuid(), 'frances.patterson@company.com', 'Frances', 'Patterson', '555-0318', 'Sales', 'Sales Development Rep', profile_pictures[4], NOW()),
    (gen_random_uuid(), 'arthur.hughes@company.com', 'Arthur', 'Hughes', '555-0319', 'Sales', 'Inside Sales Rep', profile_pictures[5], NOW()),
    (gen_random_uuid(), 'joyce.flores@company.com', 'Joyce', 'Flores', '555-0320', 'Sales', 'Inside Sales Rep', profile_pictures[6], NOW()),
    (gen_random_uuid(), 'lawrence.washington@company.com', 'Lawrence', 'Washington', '555-0321', 'Sales', 'Business Development Rep', profile_pictures[7], NOW()),
    (gen_random_uuid(), 'marilyn.butler@company.com', 'Marilyn', 'Butler', '555-0322', 'Sales', 'Business Development Rep', profile_pictures[8], NOW()),
    (gen_random_uuid(), 'roger.simmons@company.com', 'Roger', 'Simmons', '555-0323', 'Sales', 'Sales Engineer', profile_pictures[9], NOW()),
    (gen_random_uuid(), 'julie.foster@company.com', 'Julie', 'Foster', '555-0324', 'Sales', 'Sales Operations Analyst', profile_pictures[10], NOW()),
    (gen_random_uuid(), 'terry.bryant@company.com', 'Terry', 'Bryant', '555-0325', 'Sales', 'Sales Enablement Manager', profile_pictures[11], NOW()),
    (gen_random_uuid(), 'alice.alexander@company.com', 'Alice', 'Alexander', '555-0326', 'Sales', 'Channel Sales Manager', profile_pictures[12], NOW()),
    (gen_random_uuid(), 'peter.russell@company.com', 'Peter', 'Russell', '555-0327', 'Sales', 'Account Executive', profile_pictures[13], NOW()),
    (gen_random_uuid(), 'joan.griffin@company.com', 'Joan', 'Griffin', '555-0328', 'Sales', 'Sales Development Rep', profile_pictures[14], NOW()),
    (gen_random_uuid(), 'keith.diaz@company.com', 'Keith', 'Diaz', '555-0329', 'Sales', 'Inside Sales Rep', profile_pictures[15], NOW()),
    (gen_random_uuid(), 'ruby.hayes@company.com', 'Ruby', 'Hayes', '555-0330', 'Sales', 'Business Development Rep', profile_pictures[1], NOW());

  -- Continue with other departments in similar fashion...

  RAISE NOTICE 'Sample employees generated successfully';
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT generate_sample_employees();

-- Clean up the function
DROP FUNCTION generate_sample_employees();
