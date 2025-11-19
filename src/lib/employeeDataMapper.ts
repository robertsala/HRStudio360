/**
 * Shared Employee Data Mapper
 * 
 * This utility provides a standardized way to transform backend employee data
 * into the Employee shape expected by ComprehensiveEmployeeProfileModal.
 * 
 * This ensures consistent data display across all entry points:
 * - Employee Directory
 * - My Profile (Quick Access)
 * - Dashboard widgets
 */

interface BackendEmployeeResponse {
  id: string; // employees table UUID
  userId: string; // profiles table UUID
  employeeId?: string; // EMP-001 formatted ID
  status: string;
  startDate: string;
  salary: string | number;
  employmentType: string;
  location?: string;
  managerId?: string;
  managerName?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  profileImage?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    department?: string;
    role?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    managerName?: string;
    profilePicture?: string;
    emergencyContactFirstName?: string;
    emergencyContactLastName?: string;
    emergencyContactMiddleName?: string;
    emergencyContactRelationship?: string;
    emergencyContactPhone?: string;
  };
  emergencyContact?: {
    firstName: string;
    lastName: string;
    middleName?: string;
    relationship: string;
    phone: string;
  };
}

export interface MappedEmployee {
  id: string;
  userId: string;
  employeeRecordId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  status: 'Active' | 'Remote' | 'On Leave';
  startDate: string;
  location: string;
  manager: string;
  managerId?: string;
  salary: string;
  employeeId: string;
  employmentType: string;
  profileImage?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyContact: {
    firstName: string;
    lastName: string;
    middleName?: string;
    relationship: string;
    phone: string;
  };
  skills: string[];
  certifications: string[];
  performanceRating: number;
  ptoBalance: number;
  sickLeaveBalance: number;
}

/**
 * Maps backend employee response to the Employee interface expected by ComprehensiveEmployeeProfileModal
 */
export function mapEmployeeFromBackend(emp: BackendEmployeeResponse): MappedEmployee {
  // Extract profile data (could be nested in profile object or at root level)
  const firstName = emp.profile?.firstName ?? '';
  const lastName = emp.profile?.lastName ?? '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown Employee';
  
  // Normalize status (case-insensitive mapping)
  const normalizedStatus = emp.status?.toLowerCase() === 'active' 
    ? 'Active' 
    : emp.status?.toLowerCase() === 'remote'
    ? 'Remote'
    : 'On Leave';
  
  // Format salary for display
  const formattedSalary = typeof emp.salary === 'number' 
    ? `$${emp.salary.toLocaleString()}` 
    : emp.salary?.toString() || '$0';
  
  // Build location string from city/state or use provided location
  const location = emp.profile?.city && emp.profile?.state
    ? `${emp.profile.city}, ${emp.profile.state}`
    : emp.location || 'Remote';
  
  // Extract emergency contact (prefer structured object, fallback to profile fields)
  const emergencyContact = emp.emergencyContact ? {
    firstName: emp.emergencyContact.firstName || '',
    lastName: emp.emergencyContact.lastName || '',
    middleName: emp.emergencyContact.middleName || '',
    relationship: emp.emergencyContact.relationship || '',
    phone: emp.emergencyContact.phone || ''
  } : {
    firstName: emp.profile?.emergencyContactFirstName || '',
    lastName: emp.profile?.emergencyContactLastName || '',
    middleName: emp.profile?.emergencyContactMiddleName || '',
    relationship: emp.profile?.emergencyContactRelationship || '',
    phone: emp.profile?.emergencyContactPhone || ''
  };
  
  // Format employeeId as EMP-XXX if it's a number, otherwise use as-is
  const formattedEmployeeId = emp.employeeId 
    ? (emp.employeeId.match(/^\d+$/) ? `EMP-${emp.employeeId.padStart(3, '0')}` : emp.employeeId)
    : `EMP-${emp.id.substring(0, 3).toUpperCase()}`;
  
  return {
    id: emp.userId || emp.id.toString(), // Use userId for profile display
    userId: emp.userId, // Profiles table UUID
    employeeRecordId: emp.id, // Employees table UUID
    name: fullName,
    email: emp.profile?.email || `${firstName?.toLowerCase()}.${lastName?.toLowerCase()}@company.com`,
    phone: emp.profile?.phone || '(555) 000-0000',
    department: emp.profile?.department || 'General',
    role: emp.profile?.role || 'Employee',
    location: location,
    startDate: emp.startDate || new Date().toISOString().split('T')[0],
    status: normalizedStatus as 'Active' | 'Remote' | 'On Leave',
    profileImage: emp.profileImage || emp.profile?.profilePicture || undefined,
    salary: formattedSalary,
    employeeId: formattedEmployeeId,
    employmentType: emp.employmentType,
    managerId: emp.managerId || undefined,
    manager: emp.managerName || emp.profile?.managerName || 'Not assigned',
    // Address fields
    address: emp.address || emp.profile?.address || undefined,
    city: emp.city || emp.profile?.city || undefined,
    state: emp.state || emp.profile?.state || undefined,
    zipCode: emp.zipCode || emp.profile?.zipCode || undefined,
    // Emergency contact
    emergencyContact: emergencyContact,
    // Default values for fields not provided by backend
    skills: [],
    certifications: [],
    performanceRating: 0,
    ptoBalance: 0,
    sickLeaveBalance: 0
  } as any; // Cast to any since we have extra fields beyond the base Employee interface
}

/**
 * Maps an array of backend employee responses
 */
export function mapEmployeesFromBackend(employees: BackendEmployeeResponse[]): MappedEmployee[] {
  return employees.map(mapEmployeeFromBackend);
}
