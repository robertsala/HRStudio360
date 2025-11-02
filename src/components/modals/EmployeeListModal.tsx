import React, { useState } from 'react';
import { Filter, Mail, Phone, MapPin, User, Building, Briefcase, Calendar, Eye, Clock, DollarSign, Award, TrendingUp, Users, Star, CheckCircle, AlertTriangle, X, Plus, CreditCard as Edit3, LayoutGrid, List, Sparkles, Trophy, Medal, Shield } from 'lucide-react';
import { mockOrgChartEmployees, type MockEmployee } from '../../data/mockOrgChartEmployees';
import { useAuth } from '../../hooks/useAuth';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  status: 'Active' | 'Remote' | 'On Leave';
  startDate: string;
  location: string;
  profileImage?: string;
  employeeType: 'Salary' | 'Hourly';
  hourlyRate?: number;
  annualSalary?: number;
  manager: string;
  employeeId: string;
  // Hourly employee specific fields
  currentWeekHours?: number;
  overtimeHours?: number;
  scheduledHours?: number;
  lastClockIn?: string;
  isCurrentlyClocked?: boolean;
  performanceRating?: number;
  ptoBalance?: number;
  sickLeaveBalance?: number;
}

interface EmployeeListModalProps {
  employees: Employee[];
  onViewProfile?: (employeeId: string) => void;
  userRole?: 'employee' | 'hr' | 'admin';
  onClose?: () => void;
  initialFilter?: {
    type: 'my-team' | 'my-department' | 'my-location' | 'all';
    managerId?: string;
    department?: string;
    location?: string;
  };
}

// Convert 200 org chart employees to employee list format
export const mockEmployees: Employee[] = mockOrgChartEmployees.map((emp: MockEmployee, index: number) => {
  const locations = ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Boston, MA', 'Chicago, IL', 'Denver, CO', 'Los Angeles, CA', 'Miami, FL', 'Portland, OR'];
  const statuses: ('Active' | 'Remote' | 'On Leave')[] = index % 15 === 0 ? ['On Leave'] : index % 3 === 0 ? ['Remote'] : ['Active'];

  const managerEmp = emp.managerId ? mockOrgChartEmployees.find(e => e.id === emp.managerId) : null;
  const managerName = managerEmp ? managerEmp.name : 'CEO';

  const yearOffset = emp.title.toLowerCase().includes('senior') || emp.title.toLowerCase().includes('vp') || emp.title.toLowerCase().includes('director') || emp.title.toLowerCase().includes('chief') ?
    Math.floor(Math.random() * 5) + 3 :
    emp.title.toLowerCase().includes('junior') || emp.title.toLowerCase().includes('associate') ?
    Math.floor(Math.random() * 2) :
    Math.floor(Math.random() * 3) + 1;

  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - yearOffset);
  startDate.setMonth(Math.floor(Math.random() * 12));
  startDate.setDate(Math.floor(Math.random() * 28) + 1);

  const isHourly = emp.employmentType === 'Hourly';
  const currentWeekHours = isHourly ? Math.floor(Math.random() * 40) + 20 : undefined;
  const scheduledHours = isHourly ? 40 : undefined;

  return {
    id: emp.id,
    name: emp.name,
    email: emp.email,
    phone: emp.phone,
    department: emp.department,
    role: emp.title,
    status: statuses[0],
    startDate: startDate.toISOString().split('T')[0],
    location: locations[index % locations.length],
    profileImage: emp.photo,
    employeeType: isHourly ? 'Hourly' : 'Salary',
    hourlyRate: emp.hourlyRate,
    annualSalary: !isHourly ? emp.salary : undefined,
    manager: managerName,
    employeeId: emp.employee_id,
    currentWeekHours,
    overtimeHours: currentWeekHours && currentWeekHours > 40 ? currentWeekHours - 40 : 0,
    scheduledHours,
    lastClockIn: isHourly ? `${Math.floor(Math.random() * 4) + 7}:${['00', '15', '30', '45'][Math.floor(Math.random() * 4)]}` : undefined,
    isCurrentlyClocked: isHourly ? index % 5 === 0 : false,
    performanceRating: Math.floor(Math.random() * 15) / 10 + 3.5,
    ptoBalance: Math.floor(Math.random() * 20) + 5,
    sickLeaveBalance: Math.floor(Math.random() * 8) + 1
  };
});

// Original mock employees array - keeping for reference but not used
const _originalMockEmployees: Employee[] = [
  // Salary Employees (123 employees)
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    phone: '+1 (555) 123-4567',
    department: 'Engineering',
    role: 'Senior Software Engineer',
    status: 'Active',
    startDate: '2022-03-15',
    location: 'San Francisco, CA',
    profileImage: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    employeeType: 'Salary',
    annualSalary: 125000,
    manager: 'Mike Chen',
    employeeId: 'EMP001',
    performanceRating: 4.5,
    ptoBalance: 18,
    sickLeaveBalance: 5
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike.chen@company.com',
    phone: '+1 (555) 234-5678',
    department: 'Engineering',
    role: 'Engineering Manager',
    status: 'Remote',
    startDate: '2021-08-22',
    location: 'Austin, TX',
    profileImage: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    employeeType: 'Salary',
    annualSalary: 145000,
    manager: 'CTO',
    employeeId: 'EMP002',
    performanceRating: 4.8,
    ptoBalance: 22,
    sickLeaveBalance: 8
  },
  {
    id: '3',
    name: 'Lisa Rodriguez',
    email: 'lisa.rodriguez@company.com',
    phone: '+1 (555) 345-6789',
    department: 'Sales',
    role: 'Sales Director',
    status: 'Active',
    startDate: '2020-11-10',
    location: 'New York, NY',
    profileImage: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    employeeType: 'Salary',
    annualSalary: 135000,
    manager: 'VP Sales',
    employeeId: 'EMP003',
    performanceRating: 4.6,
    ptoBalance: 15,
    sickLeaveBalance: 3
  },
  {
    id: '4',
    name: 'David Kim',
    email: 'david.kim@company.com',
    phone: '+1 (555) 456-7890',
    department: 'Engineering',
    role: 'Frontend Developer',
    status: 'On Leave',
    startDate: '2023-01-08',
    location: 'Seattle, WA',
    profileImage: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    employeeType: 'Salary',
    annualSalary: 95000,
    manager: 'Sarah Johnson',
    employeeId: 'EMP004',
    performanceRating: 4.2,
    ptoBalance: 12,
    sickLeaveBalance: 6
  },
  {
    id: '5',
    name: 'Emma Wilson',
    email: 'emma.wilson@company.com',
    phone: '+1 (555) 567-8901',
    department: 'Human Resources',
    role: 'HR Specialist',
    status: 'Active',
    startDate: '2022-09-12',
    location: 'Boston, MA',
    profileImage: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    employeeType: 'Salary',
    annualSalary: 68000,
    manager: 'HR Director',
    employeeId: 'EMP005',
    performanceRating: 4.4,
    ptoBalance: 20,
    sickLeaveBalance: 7
  },

  // Hourly Employees (124 employees) - Starting from EMP124 to EMP247
  {
    id: '124',
    name: 'Jennifer Martinez',
    email: 'jennifer.martinez@company.com',
    phone: '+1 (555) 124-0001',
    department: 'Customer Service',
    role: 'Customer Service Representative',
    status: 'Active',
    startDate: '2023-06-15',
    location: 'Phoenix, AZ',
    profileImage: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    employeeType: 'Hourly',
    hourlyRate: 18.50,
    manager: 'Customer Service Manager',
    employeeId: 'EMP124',
    currentWeekHours: 38.5,
    overtimeHours: 0,
    scheduledHours: 40,
    lastClockIn: '08:00',
    isCurrentlyClocked: true,
    performanceRating: 4.1,
    ptoBalance: 16,
    sickLeaveBalance: 4
  },
  {
    id: '125',
    name: 'Robert Thompson',
    email: 'robert.thompson@company.com',
    phone: '+1 (555) 125-0002',
    department: 'Warehouse',
    role: 'Warehouse Associate',
    status: 'Active',
    startDate: '2023-04-20',
    location: 'Distribution Center',
    profileImage: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    employeeType: 'Hourly',
    hourlyRate: 16.75,
    manager: 'Warehouse Supervisor',
    employeeId: 'EMP125',
    currentWeekHours: 42.5,
    overtimeHours: 2.5,
    scheduledHours: 40,
    lastClockIn: '06:00',
    isCurrentlyClocked: false,
    performanceRating: 4.3,
    ptoBalance: 12,
    sickLeaveBalance: 8
  },
  {
    id: '126',
    name: 'Amanda Foster',
    email: 'amanda.foster@company.com',
    phone: '+1 (555) 126-0003',
    department: 'Retail',
    role: 'Sales Associate',
    status: 'Active',
    startDate: '2023-08-10',
    location: 'Downtown Store',
    profileImage: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    employeeType: 'Hourly',
    hourlyRate: 15.25,
    manager: 'Store Manager',
    employeeId: 'EMP126',
    currentWeekHours: 32.0,
    overtimeHours: 0,
    scheduledHours: 32,
    lastClockIn: '10:00',
    isCurrentlyClocked: true,
    performanceRating: 4.0,
    ptoBalance: 14,
    sickLeaveBalance: 6
  },
  {
    id: '127',
    name: 'Carlos Rodriguez',
    email: 'carlos.rodriguez@company.com',
    phone: '+1 (555) 127-0004',
    department: 'Maintenance',
    role: 'Maintenance Technician',
    status: 'Active',
    startDate: '2022-11-05',
    location: 'Corporate Campus',
    profileImage: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    employeeType: 'Hourly',
    hourlyRate: 22.00,
    manager: 'Facilities Manager',
    employeeId: 'EMP127',
    currentWeekHours: 40.0,
    overtimeHours: 0,
    scheduledHours: 40,
    lastClockIn: '07:00',
    isCurrentlyClocked: false,
    performanceRating: 4.7,
    ptoBalance: 18,
    sickLeaveBalance: 5
  },
  {
    id: '128',
    name: 'Michelle Davis',
    email: 'michelle.davis@company.com',
    phone: '+1 (555) 128-0005',
    department: 'Security',
    role: 'Security Guard',
    status: 'Active',
    startDate: '2023-02-14',
    location: 'Main Building',
    profileImage: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    employeeType: 'Hourly',
    hourlyRate: 19.50,
    manager: 'Security Supervisor',
    employeeId: 'EMP128',
    currentWeekHours: 44.0,
    overtimeHours: 4.0,
    scheduledHours: 40,
    lastClockIn: '22:00',
    isCurrentlyClocked: true,
    performanceRating: 4.2,
    ptoBalance: 10,
    sickLeaveBalance: 3
  },
  {
    id: '129',
    name: 'James Wilson',
    email: 'james.wilson@company.com',
    phone: '+1 (555) 129-0006',
    department: 'Food Service',
    role: 'Kitchen Staff',
    status: 'Active',
    startDate: '2023-07-01',
    location: 'Corporate Cafeteria',
    profileImage: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    employeeType: 'Hourly',
    hourlyRate: 17.25,
    manager: 'Food Service Manager',
    employeeId: 'EMP129',
    currentWeekHours: 35.0,
    overtimeHours: 0,
    scheduledHours: 35,
    lastClockIn: '05:30',
    isCurrentlyClocked: false,
    performanceRating: 3.9,
    ptoBalance: 8,
    sickLeaveBalance: 4
  },
  {
    id: '130',
    name: 'Rachel Brown',
    email: 'rachel.brown@company.com',
    phone: '+1 (555) 130-0007',
    department: 'Cleaning',
    role: 'Custodial Staff',
    status: 'Active',
    startDate: '2022-12-03',
    location: 'Multiple Buildings',
    profileImage: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    employeeType: 'Hourly',
    hourlyRate: 16.00,
    manager: 'Facilities Manager',
    employeeId: 'EMP130',
    currentWeekHours: 40.0,
    overtimeHours: 0,
    scheduledHours: 40,
    lastClockIn: '18:00',
    isCurrentlyClocked: false,
    performanceRating: 4.5,
    ptoBalance: 20,
    sickLeaveBalance: 7
  },
  {
    id: '131',
    name: 'Kevin Park',
    email: 'kevin.park@company.com',
    phone: '+1 (555) 131-0008',
    department: 'IT Support',
    role: 'Help Desk Technician',
    status: 'Active',
    startDate: '2023-05-18',
    location: 'IT Department',
    profileImage: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    employeeType: 'Hourly',
    hourlyRate: 24.00,
    manager: 'IT Manager',
    employeeId: 'EMP131',
    currentWeekHours: 39.0,
    overtimeHours: 0,
    scheduledHours: 40,
    lastClockIn: '08:30',
    isCurrentlyClocked: true,
    performanceRating: 4.3,
    ptoBalance: 15,
    sickLeaveBalance: 6
  },
  {
    id: '132',
    name: 'Sophia Garcia',
    email: 'sophia.garcia@company.com',
    phone: '+1 (555) 132-0009',
    department: 'Reception',
    role: 'Receptionist',
    status: 'Active',
    startDate: '2023-09-25',
    location: 'Main Lobby',
    profileImage: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    employeeType: 'Hourly',
    hourlyRate: 18.00,
    manager: 'Office Manager',
    employeeId: 'EMP132',
    currentWeekHours: 40.0,
    overtimeHours: 0,
    scheduledHours: 40,
    lastClockIn: '08:00',
    isCurrentlyClocked: true,
    performanceRating: 4.6,
    ptoBalance: 11,
    sickLeaveBalance: 2
  },
  {
    id: '133',
    name: 'Daniel Lee',
    email: 'daniel.lee@company.com',
    phone: '+1 (555) 133-0010',
    department: 'Shipping',
    role: 'Shipping Clerk',
    status: 'Active',
    startDate: '2023-03-12',
    location: 'Shipping Dock',
    profileImage: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    employeeType: 'Hourly',
    hourlyRate: 17.50,
    manager: 'Shipping Supervisor',
    employeeId: 'EMP133',
    currentWeekHours: 41.5,
    overtimeHours: 1.5,
    scheduledHours: 40,
    lastClockIn: '06:30',
    isCurrentlyClocked: false,
    performanceRating: 4.1,
    ptoBalance: 13,
    sickLeaveBalance: 5
  },
  // Add more employees to reach 247 total (123 salary + 124 hourly)
  // For brevity, I'll add a few more examples and indicate the pattern
  {
    id: '134',
    name: 'Ashley Miller',
    email: 'ashley.miller@company.com',
    phone: '+1 (555) 134-0011',
    department: 'Customer Service',
    role: 'Customer Support Specialist',
    status: 'Remote',
    startDate: '2023-01-30',
    location: 'Remote',
    profileImage: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    employeeType: 'Hourly',
    hourlyRate: 19.25,
    manager: 'Customer Service Manager',
    employeeId: 'EMP134',
    currentWeekHours: 37.0,
    overtimeHours: 0,
    scheduledHours: 40,
    lastClockIn: '09:00',
    isCurrentlyClocked: true,
    performanceRating: 4.4,
    ptoBalance: 17,
    sickLeaveBalance: 3
  },
  {
    id: '135',
    name: 'Tyler Johnson',
    email: 'tyler.johnson@company.com',
    phone: '+1 (555) 135-0012',
    department: 'Production',
    role: 'Production Worker',
    status: 'Active',
    startDate: '2022-10-08',
    location: 'Manufacturing Floor',
    profileImage: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    employeeType: 'Hourly',
    hourlyRate: 20.75,
    manager: 'Production Supervisor',
    employeeId: 'EMP135',
    currentWeekHours: 45.0,
    overtimeHours: 5.0,
    scheduledHours: 40,
    lastClockIn: '06:00',
    isCurrentlyClocked: false,
    performanceRating: 4.0,
    ptoBalance: 9,
    sickLeaveBalance: 6
  },
  // Continue pattern for remaining employees...
  // For demo purposes, I'll add a few more key examples
  {
    id: '200',
    name: 'Maria Santos',
    email: 'maria.santos@company.com',
    phone: '+1 (555) 200-0066',
    department: 'Retail',
    role: 'Cashier',
    status: 'Active',
    startDate: '2023-11-15',
    location: 'Store #1',
    profileImage: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    employeeType: 'Hourly',
    hourlyRate: 15.50,
    manager: 'Store Manager',
    employeeId: 'EMP200',
    currentWeekHours: 28.0,
    overtimeHours: 0,
    scheduledHours: 30,
    lastClockIn: '14:00',
    isCurrentlyClocked: true,
    performanceRating: 3.8,
    ptoBalance: 6,
    sickLeaveBalance: 2
  },
  {
    id: '247',
    name: 'Alex Chen',
    email: 'alex.chen@company.com',
    phone: '+1 (555) 247-0113',
    department: 'Field Service',
    role: 'Field Technician',
    status: 'Active',
    startDate: '2023-12-01',
    location: 'Mobile/Field',
    profileImage: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    employeeType: 'Hourly',
    hourlyRate: 26.50,
    manager: 'Field Service Manager',
    employeeId: 'EMP247',
    currentWeekHours: 43.5,
    overtimeHours: 3.5,
    scheduledHours: 40,
    lastClockIn: '07:30',
    isCurrentlyClocked: false,
    performanceRating: 4.5,
    ptoBalance: 5,
    sickLeaveBalance: 1
  }
];

const EmployeeListModal: React.FC<EmployeeListModalProps> = ({ employees, onViewProfile, userRole = 'employee', onClose, initialFilter }) => {
  const { user, startImpersonation } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterEmployeeType, setFilterEmployeeType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [teamFilter, setTeamFilter] = useState<'my-team' | 'my-department' | 'my-location' | 'all'>(initialFilter?.type || 'all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEmployeeDetail, setShowEmployeeDetail] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showEmployeeDetail) {
          setShowEmployeeDetail(false);
        } else if (onClose) {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showEmployeeDetail, onClose]);

  const filteredEmployees = employees
    .filter(employee => {
      if (teamFilter === 'my-team' && initialFilter?.managerId) {
        if (employee.manager !== initialFilter.managerId && employee.id !== initialFilter.managerId) {
          return false;
        }
      }

      if (teamFilter === 'my-department' && initialFilter?.department) {
        if (employee.department !== initialFilter.department) {
          return false;
        }
      }

      if (teamFilter === 'my-location' && initialFilter?.location) {
        if (employee.location !== initialFilter.location) {
          return false;
        }
      }

      const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = filterDepartment === 'All' || employee.department === filterDepartment;
      const matchesType = filterEmployeeType === 'All' || employee.employeeType === filterEmployeeType;
      const matchesStatus = filterStatus === 'All' || employee.status === filterStatus;
      return matchesSearch && matchesDepartment && matchesType && matchesStatus;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const departments = ['All', ...Array.from(new Set(employees.map(emp => emp.department)))];
  const employeeTypes = ['All', 'Salary', 'Hourly'];
  const statuses = ['All', 'Active', 'Remote', 'On Leave'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Remote': return 'bg-blue-100 text-blue-800';
      case 'On Leave': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEmployeeTypeColor = (type: string) => {
    switch (type) {
      case 'Salary': return 'bg-purple-100 text-purple-800';
      case 'Hourly': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
  };

  const calculateYearsOfService = (startDate: string): number => {
    const start = new Date(startDate);
    const today = new Date();
    let years = today.getFullYear() - start.getFullYear();
    const monthDiff = today.getMonth() - start.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < start.getDate())) {
      years--;
    }
    return years;
  };

  const getBadgeInfo = (years: number) => {
    if (years < 0) return null;

    const isMilestone = years > 0 && years % 5 === 0;

    let tier: string;
    let baseColor: string;

    if (years === 0) {
      tier = 'New Hire';
      baseColor = 'from-green-400 to-teal-500';
    } else if (years >= 26) {
      tier = 'Emerald';
      baseColor = 'from-emerald-400 to-emerald-600';
    } else if (years >= 21) {
      tier = 'Ruby';
      baseColor = 'from-red-400 to-pink-600';
    } else if (years >= 16) {
      tier = 'Platinum';
      baseColor = 'from-blue-200 to-blue-400';
    } else if (years >= 11) {
      tier = 'Gold';
      baseColor = 'from-yellow-400 to-yellow-600';
    } else if (years >= 6) {
      tier = 'Silver';
      baseColor = 'from-gray-300 to-gray-500';
    } else {
      tier = 'Bronze';
      baseColor = 'from-orange-400 to-orange-600';
    }

    const yearInTier = years % 5;
    let icon;
    if (yearInTier === 0 || yearInTier === 5) icon = Trophy;
    else if (yearInTier === 1) icon = Award;
    else if (yearInTier === 2) icon = Star;
    else if (yearInTier === 3) icon = Shield;
    else icon = Medal;

    const color = isMilestone ? 'from-yellow-400 to-orange-500' : baseColor;

    return {
      years,
      isMilestone,
      tier,
      color,
      icon
    };
  };

  const canViewSensitiveData = userRole === 'hr' || userRole === 'admin';

  const handleViewProfile = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeDetail(true);
  };

  const salaryEmployees = employees.filter(emp => emp.employeeType === 'Salary');
  const hourlyEmployees = employees.filter(emp => emp.employeeType === 'Hourly');
  const activeHourlyEmployees = hourlyEmployees.filter(emp => emp.status === 'Active');
  const currentlyClockedIn = hourlyEmployees.filter(emp => emp.isCurrentlyClocked).length;

  return (
    <>
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
          <div className="flex items-center">
            <Users className="h-8 w-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">Employee Directory</h2>
              {canViewSensitiveData ? (
                <p className="text-blue-100">{employees.length} total employees • {salaryEmployees.length} salary • {hourlyEmployees.length} hourly</p>
              ) : (
                <p className="text-blue-100">{employees.length} total employees</p>
              )}
            </div>
          </div>
          {canViewSensitiveData && (
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-blue-100 text-sm">Currently Clocked In</p>
                <p className="text-xl font-bold">{currentlyClockedIn} hourly employees</p>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="p-6 border-b bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-1 mr-2 animate-pulse">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
                <span className="text-xs font-medium text-purple-600">AI</span>
              </div>
              <input
                type="text"
                placeholder="AI Search: Try 'Sarah', 'Engineering', 'Manager', etc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-4 py-3 border-2 border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-300 bg-purple-50 dark:bg-purple-900/20/50 placeholder-gray-500 transition-all duration-200"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              {initialFilter && (
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value as any)}
                  className="border-2 border-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-blue-700"
                >
                  <option value="all">All Employees</option>
                  <option value="my-team">My Team</option>
                  <option value="my-department">My Department</option>
                  <option value="my-location">My Location</option>
                </select>
              )}
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {canViewSensitiveData && (
                <select
                  value={filterEmployeeType}
                  onChange={(e) => setFilterEmployeeType(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {employeeTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              )}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
                title="Card View"
              >
                <LayoutGrid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 transition-colors border-l border-gray-300 ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
                title="List View"
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredEmployees.length} of {employees.length} employees
          </div>
        </div>

        {/* Employee Grid/List */}
        <div className="overflow-y-auto flex-1">
          <div className="p-4">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {filteredEmployees.map((employee) => {
                  const yearsOfService = calculateYearsOfService(employee.startDate);
                  const badgeInfo = getBadgeInfo(yearsOfService);
                  const BadgeIcon = badgeInfo?.icon || Trophy;

                  return (
                <div
                  key={employee.id}
                  className="bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
                  onClick={() => handleViewProfile(employee)}
                >
                  <div className="flex items-center space-x-4 mb-4">
                    {employee.profileImage ? (
                      <img
                        src={employee.profileImage}
                        alt={employee.name}
                        className="w-12 h-12 rounded-full object-cover shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white font-bold">
                          {getInitials(employee.name)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white dark:text-white text-lg">{employee.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{employee.role}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                          {employee.status}
                        </span>
                        {canViewSensitiveData && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEmployeeTypeColor(employee.employeeType)}`}>
                            {employee.employeeType}
                          </span>
                        )}
                        {canViewSensitiveData && employee.employeeType === 'Hourly' && employee.isCurrentlyClocked && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center">
                            <div className="w-2 h-2 bg-green-50 dark:bg-green-900/200 rounded-full mr-1 animate-pulse"></div>
                            Clocked In
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Building className="h-4 w-4 mr-2" />
                      {employee.department}
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Mail className="h-4 w-4 mr-2" />
                      {employee.email}
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4 mr-2" />
                      {employee.location}
                    </div>

                    {/* Hourly Employee Specific Info - HR/Admin Only */}
                    {canViewSensitiveData && employee.employeeType === 'Hourly' && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 dark:border-gray-700">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Rate:</span>
                            <span className="font-medium text-green-600">${employee.hourlyRate}/hr</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">This Week:</span>
                            <span className="font-medium text-blue-600">{employee.currentWeekHours}h</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Scheduled:</span>
                            <span className="font-medium text-purple-600">{employee.scheduledHours}h</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Overtime:</span>
                            <span className={`font-medium ${employee.overtimeHours! > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                              {employee.overtimeHours}h
                            </span>
                          </div>
                        </div>
                        {employee.lastClockIn && (
                          <div className="mt-2 flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            Last clock-in: {employee.lastClockIn}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Salary Employee Specific Info - HR/Admin Only */}
                    {canViewSensitiveData && employee.employeeType === 'Salary' && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400">Annual Salary:</span>
                          <span className="font-medium text-green-600">${employee.annualSalary?.toLocaleString()}</span>
                        </div>
                        {employee.performanceRating && (
                          <div className="flex items-center justify-between text-xs mt-1">
                            <span className="text-gray-600 dark:text-gray-400">Performance:</span>
                            <div className="flex items-center">
                              <Star className="h-3 w-3 text-yellow-500 mr-1" />
                              <span className="font-medium text-gray-900 dark:text-white dark:text-white">{employee.performanceRating}/5</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Service Badge */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 dark:border-gray-700">
                      {badgeInfo && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${badgeInfo.color} shadow-md ${badgeInfo.isMilestone ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}`}>
                              <BadgeIcon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-300">
                                {badgeInfo.tier} {badgeInfo.years === 0 ? '' : 'Badge'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {badgeInfo.years === 0 ? 'Less than 1 year' : `${badgeInfo.years} ${badgeInfo.years === 1 ? 'Year' : 'Years'}`}
                              </p>
                            </div>
                          </div>
                          {badgeInfo.isMilestone && (
                            <div className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                              Milestone!
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer"
                    onClick={() => handleViewProfile(employee)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {employee.profileImage ? (
                          <img
                            src={employee.profileImage}
                            alt={employee.name}
                            className="w-10 h-10 rounded-full object-cover shadow-md"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-sm">
                              {getInitials(employee.name)}
                            </span>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold text-gray-900 dark:text-white dark:text-white">{employee.name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                              {employee.status}
                            </span>
                            {canViewSensitiveData && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEmployeeTypeColor(employee.employeeType)}`}>
                                {employee.employeeType}
                              </span>
                            )}
                            {canViewSensitiveData && employee.employeeType === 'Hourly' && employee.isCurrentlyClocked && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center">
                                <div className="w-2 h-2 bg-green-50 dark:bg-green-900/200 rounded-full mr-1 animate-pulse"></div>
                                Clocked In
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{employee.role}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 text-sm">
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Building className="h-4 w-4 mr-1" />
                          <span>{employee.department}</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Mail className="h-4 w-4 mr-1" />
                          <span>{employee.email}</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{employee.location}</span>
                        </div>
                        {canViewSensitiveData && employee.employeeType === 'Hourly' && (
                          <div className="flex items-center text-green-600 font-medium">
                            <DollarSign className="h-4 w-4 mr-1" />
                            <span>${employee.hourlyRate}/hr</span>
                          </div>
                        )}
                        {canViewSensitiveData && employee.employeeType === 'Salary' && (
                          <div className="flex items-center text-green-600 font-medium">
                            <DollarSign className="h-4 w-4 mr-1" />
                            <span>${employee.annualSalary?.toLocaleString()}</span>
                          </div>
                        )}
                        {canViewSensitiveData && employee.performanceRating && (
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                            <span className="font-medium">{employee.performanceRating}/5</span>
                          </div>
                        )}
                        <Eye className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredEmployees.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white dark:text-white mb-2">No employees found</h3>
                <p className="text-gray-500">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Employee Detail Modal */}
      {showEmployeeDetail && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
              <div className="flex items-center space-x-4">
                {selectedEmployee.profileImage ? (
                  <img
                    src={selectedEmployee.profileImage}
                    alt={selectedEmployee.name}
                    className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-white dark:bg-gray-800 dark:bg-gray-800/20 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                    <span className="text-white text-xl font-bold">
                      {getInitials(selectedEmployee.name)}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-bold">{selectedEmployee.name}</h3>
                  <p className="text-blue-100">{selectedEmployee.role} • {selectedEmployee.department}</p>
                  <p className="text-blue-200 text-sm">ID: {selectedEmployee.employeeId}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedEmployee.status)}`}>
                    {selectedEmployee.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEmployeeTypeColor(selectedEmployee.employeeType)}`}>
                    {selectedEmployee.employeeType}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowEmployeeDetail(false)}
                className="text-blue-100 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Employee Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm">
                        {selectedEmployee.employeeType === 'Hourly' ? 'Hourly Rate' : 'Annual Salary'}
                      </p>
                      <p className="text-2xl font-bold text-blue-700">
                        {selectedEmployee.employeeType === 'Hourly' 
                          ? `$${selectedEmployee.hourlyRate}/hr`
                          : `$${selectedEmployee.annualSalary?.toLocaleString()}`
                        }
                      </p>
                    </div>
                    <DollarSign className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
                
                {selectedEmployee.employeeType === 'Hourly' && (
                  <>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-600 text-sm">This Week Hours</p>
                          <p className="text-2xl font-bold text-green-700">{selectedEmployee.currentWeekHours}h</p>
                        </div>
                        <Clock className="h-6 w-6 text-green-500" />
                      </div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-600 text-sm">Overtime</p>
                          <p className="text-2xl font-bold text-orange-700">{selectedEmployee.overtimeHours}h</p>
                        </div>
                        <TrendingUp className="h-6 w-6 text-orange-500" />
                      </div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-600 text-sm">Scheduled</p>
                          <p className="text-2xl font-bold text-purple-700">{selectedEmployee.scheduledHours}h</p>
                        </div>
                        <Calendar className="h-6 w-6 text-purple-500" />
                      </div>
                    </div>
                  </>
                )}
                
                {selectedEmployee.employeeType === 'Salary' && (
                  <>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-600 text-sm">Performance</p>
                          <p className="text-2xl font-bold text-green-700">{selectedEmployee.performanceRating}/5</p>
                        </div>
                        <Star className="h-6 w-6 text-green-500" />
                      </div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-600 text-sm">PTO Balance</p>
                          <p className="text-2xl font-bold text-purple-700">{selectedEmployee.ptoBalance}</p>
                        </div>
                        <Calendar className="h-6 w-6 text-purple-500" />
                      </div>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-yellow-600 text-sm">Sick Leave</p>
                          <p className="text-2xl font-bold text-yellow-700">{selectedEmployee.sickLeaveBalance}</p>
                        </div>
                        <Award className="h-6 w-6 text-yellow-500" />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Contact and Work Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Contact Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <Mail className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                        <a href={`mailto:${selectedEmployee.email}`} className="text-blue-600 hover:text-blue-700 font-medium">
                          {selectedEmployee.email}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <Phone className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                        <a href={`tel:${selectedEmployee.phone}`} className="text-blue-600 hover:text-blue-700 font-medium">
                          {selectedEmployee.phone}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                        <p className="text-gray-900 dark:text-white dark:text-white font-medium">{selectedEmployee.location}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Work Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <Building className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Department</p>
                        <p className="text-gray-900 dark:text-white dark:text-white font-medium">{selectedEmployee.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <Briefcase className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Role</p>
                        <p className="text-gray-900 dark:text-white dark:text-white font-medium">{selectedEmployee.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <User className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Manager</p>
                        <p className="text-gray-900 dark:text-white dark:text-white font-medium">{selectedEmployee.manager}</p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Start Date</p>
                        <p className="text-gray-900 dark:text-white dark:text-white font-medium">
                          {new Date(selectedEmployee.startDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hourly Employee Schedule Information */}
              {selectedEmployee.employeeType === 'Hourly' && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                  <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-blue-600" />
                    Schedule & Time Tracking
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 border">
                      <h5 className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Current Status</h5>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Clock Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedEmployee.isCurrentlyClocked 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedEmployee.isCurrentlyClocked ? 'Clocked In' : 'Clocked Out'}
                          </span>
                        </div>
                        {selectedEmployee.lastClockIn && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Last Clock-In:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white dark:text-white">{selectedEmployee.lastClockIn}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 border">
                      <h5 className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Weekly Hours</h5>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Worked:</span>
                          <span className="text-sm font-bold text-blue-600">{selectedEmployee.currentWeekHours}h</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Scheduled:</span>
                          <span className="text-sm font-medium text-purple-600">{selectedEmployee.scheduledHours}h</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Overtime:</span>
                          <span className={`text-sm font-medium ${
                            selectedEmployee.overtimeHours! > 0 ? 'text-orange-600' : 'text-gray-600'
                          }`}>
                            {selectedEmployee.overtimeHours}h
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-4 border">
                      <h5 className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Compensation</h5>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Hourly Rate:</span>
                          <span className="text-sm font-bold text-green-600">${selectedEmployee.hourlyRate}/hr</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Weekly Gross:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white dark:text-white">
                            ${((selectedEmployee.currentWeekHours! * selectedEmployee.hourlyRate!) + 
                               (selectedEmployee.overtimeHours! * selectedEmployee.hourlyRate! * 1.5)).toFixed(2)}
                          </span>
                        </div>
                        {selectedEmployee.overtimeHours! > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">OT Rate:</span>
                            <span className="text-sm font-medium text-orange-600">
                              ${(selectedEmployee.hourlyRate! * 1.5).toFixed(2)}/hr
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Schedule Actions for Hourly Employees */}
                  <div className="mt-6 flex justify-center space-x-4">
                    <button
                      onClick={() => {
                        console.log('Opening schedule management for:', selectedEmployee.name);
                        // This would open the schedule management modal for this specific employee
                      }}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Calendar className="h-5 w-5 mr-2" />
                      Manage Schedule
                    </button>
                    <button
                      onClick={() => {
                        console.log('Opening time tracking for:', selectedEmployee.name);
                        // This would open time tracking details for this employee
                      }}
                      className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                    >
                      <Clock className="h-5 w-5 mr-2" />
                      View Time Tracking
                    </button>
                  </div>
                </div>
              )}

              {/* Performance and Leave Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Performance & Development</h4>
                  <div className="space-y-3">
                    {selectedEmployee.performanceRating && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Performance Rating:</span>
                        <div className="flex items-center">
                          <div className="flex space-x-1 mr-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= selectedEmployee.performanceRating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white dark:text-white">{selectedEmployee.performanceRating}/5</span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Tenure:</span>
                      <span className="font-medium text-gray-900 dark:text-white dark:text-white">
                        {Math.floor((new Date().getTime() - new Date(selectedEmployee.startDate).getTime()) / (1000 * 60 * 60 * 24 * 365))} years
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Time Off Balances</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">PTO Balance:</span>
                      <span className="font-bold text-blue-600">{selectedEmployee.ptoBalance} days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Sick Leave:</span>
                      <span className="font-bold text-green-600">{selectedEmployee.sickLeaveBalance} days</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min((selectedEmployee.ptoBalance! / 25) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 text-center">PTO Usage Progress</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex justify-center space-x-4 pt-4 border-t">
                <a
                  href={`mailto:${selectedEmployee.email}`}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </a>
                <a
                  href={`tel:${selectedEmployee.phone}`}
                  className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </a>
                {/* Only show View As button for Product Owner/HR, and not for viewing yourself */}
                {(user?.email === 'robertsala@gmail.com' || user?.role === 'admin' || user?.role === 'hr') &&
                 selectedEmployee.email !== user?.email && (
                  <button
                    onClick={() => {
                      startImpersonation({
                        id: selectedEmployee.id,
                        email: selectedEmployee.email,
                        name: selectedEmployee.name,
                        role: 'employee'
                      });
                      setShowEmployeeDetail(false);
                      if (onClose) onClose();
                    }}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors shadow-md"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View As
                  </button>
                )}
                {onViewProfile && (
                  <button
                    onClick={() => {
                      onViewProfile(selectedEmployee.id);
                      setShowEmployeeDetail(false);
                    }}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Full Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmployeeListModal;