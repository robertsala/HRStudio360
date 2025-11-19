export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  location: string;
  startDate: string;
  status: 'Active' | 'Remote' | 'On Leave';
  profileImage?: string;
}

// Shared employee data used across the application
export const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@hrstudio360.com',
    phone: '+1 (555) 123-4567',
    department: 'Engineering',
    role: 'Senior Software Engineer',
    location: 'San Francisco, CA',
    startDate: '2022-03-15',
    status: 'Active',
    profileImage: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike.chen@hrstudio360.com',
    phone: '+1 (555) 234-5678',
    department: 'Engineering',
    role: 'Engineering Manager',
    location: 'Austin, TX',
    startDate: '2021-08-22',
    status: 'Remote',
    profileImage: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '3',
    name: 'Lisa Rodriguez',
    email: 'lisa.rodriguez@hrstudio360.com',
    phone: '+1 (555) 345-6789',
    department: 'Sales',
    role: 'Sales Director',
    location: 'New York, NY',
    startDate: '2020-11-10',
    status: 'Active',
    profileImage: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '4',
    name: 'David Kim',
    email: 'david.kim@hrstudio360.com',
    phone: '+1 (555) 456-7890',
    department: 'Engineering',
    role: 'Frontend Developer',
    location: 'Seattle, WA',
    startDate: '2023-01-08',
    status: 'On Leave',
    profileImage: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '5',
    name: 'Emma Wilson',
    email: 'emma.wilson@hrstudio360.com',
    phone: '+1 (555) 567-8901',
    department: 'Human Resources',
    role: 'HR Specialist',
    location: 'Boston, MA',
    startDate: '2022-09-12',
    status: 'Active',
    profileImage: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '6',
    name: 'Alex Thompson',
    email: 'alex.thompson@hrstudio360.com',
    phone: '+1 (555) 678-9012',
    department: 'Marketing',
    role: 'Marketing Manager',
    location: 'Denver, CO',
    startDate: '2023-05-20',
    status: 'Remote',
    profileImage: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '7',
    name: 'John Smith',
    email: 'john.smith@hrstudio360.com',
    phone: '+1 (555) 789-0123',
    department: 'Finance',
    role: 'Financial Analyst',
    location: 'Chicago, IL',
    startDate: '2022-11-03',
    status: 'Active',
    profileImage: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '8',
    name: 'Maria Garcia',
    email: 'maria.garcia@hrstudio360.com',
    phone: '+1 (555) 890-1234',
    department: 'Operations',
    role: 'Operations Manager',
    location: 'Phoenix, AZ',
    startDate: '2021-07-15',
    status: 'Active',
    profileImage: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '9',
    name: 'James Wilson',
    email: 'james.wilson@hrstudio360.com',
    phone: '+1 (555) 901-2345',
    department: 'Customer Success',
    role: 'Customer Success Manager',
    location: 'Miami, FL',
    startDate: '2023-02-28',
    status: 'Remote',
    profileImage: 'https://images.pexels.com/photos/1024311/pexels-photo-1024311.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '10',
    name: 'Rachel Brown',
    email: 'rachel.brown@hrstudio360.com',
    phone: '+1 (555) 012-3456',
    department: 'Design',
    role: 'Senior UX Designer',
    location: 'Portland, OR',
    startDate: '2022-06-10',
    status: 'Active',
    profileImage: 'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '11',
    name: 'Christopher Lee',
    email: 'christopher.lee@hrstudio360.com',
    phone: '+1 (555) 111-2222',
    department: 'Engineering',
    role: 'DevOps Engineer',
    location: 'San Diego, CA',
    startDate: '2021-12-01',
    status: 'Active',
    profileImage: 'https://images.pexels.com/photos/1325734/pexels-photo-1325734.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '12',
    name: 'Jessica Martinez',
    email: 'jessica.martinez@hrstudio360.com',
    phone: '+1 (555) 222-3333',
    department: 'Sales',
    role: 'Account Executive',
    location: 'Dallas, TX',
    startDate: '2022-08-15',
    status: 'Active',
    profileImage: 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '13',
    name: 'Ryan Foster',
    email: 'ryan.foster@hrstudio360.com',
    phone: '+1 (555) 333-4444',
    department: 'Product',
    role: 'Product Manager',
    location: 'San Francisco, CA',
    startDate: '2020-05-20',
    status: 'Active',
    profileImage: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '14',
    name: 'Sophia Anderson',
    email: 'sophia.anderson@hrstudio360.com',
    phone: '+1 (555) 444-5555',
    department: 'Marketing',
    role: 'Content Strategist',
    location: 'Los Angeles, CA',
    startDate: '2023-01-10',
    status: 'Remote',
    profileImage: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '15',
    name: 'Daniel Taylor',
    email: 'daniel.taylor@hrstudio360.com',
    phone: '+1 (555) 555-6666',
    department: 'Finance',
    role: 'Controller',
    location: 'New York, NY',
    startDate: '2019-09-01',
    status: 'Active',
    profileImage: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '16',
    name: 'Olivia Harris',
    email: 'olivia.harris@hrstudio360.com',
    phone: '+1 (555) 666-7777',
    department: 'Human Resources',
    role: 'Talent Acquisition Manager',
    location: 'Boston, MA',
    startDate: '2021-04-12',
    status: 'Active',
    profileImage: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '17',
    name: 'Ethan Clark',
    email: 'ethan.clark@hrstudio360.com',
    phone: '+1 (555) 777-8888',
    department: 'Design',
    role: 'UI Designer',
    location: 'Seattle, WA',
    startDate: '2022-11-20',
    status: 'Active',
    profileImage: 'https://images.pexels.com/photos/1102341/pexels-photo-1102341.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '18',
    name: 'Ava White',
    email: 'ava.white@hrstudio360.com',
    phone: '+1 (555) 888-9999',
    department: 'Operations',
    role: 'Business Analyst',
    location: 'Chicago, IL',
    startDate: '2023-03-05',
    status: 'Active',
    profileImage: 'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '19',
    name: 'William Moore',
    email: 'william.moore@hrstudio360.com',
    phone: '+1 (555) 999-0000',
    department: 'Customer Success',
    role: 'Support Engineer',
    location: 'Austin, TX',
    startDate: '2021-10-18',
    status: 'Remote',
    profileImage: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  }
];
