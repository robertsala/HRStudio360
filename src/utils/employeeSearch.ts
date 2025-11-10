// AI-powered employee search utility

export interface SearchableEmployee {
  id: string;
  name: string;
  email: string;
  department?: string | null;
  role?: string | null;
  location?: string | null;
  status?: string;
}

export function performAIEmployeeSearch(
  employees: SearchableEmployee[],
  query: string
): SearchableEmployee[] {
  if (!query.trim()) return employees;

  const searchTerm = query.toLowerCase();

  return employees.filter(employee => {
    // Basic text matching
    const basicMatch =
      employee.name.toLowerCase().includes(searchTerm) ||
      employee.email.toLowerCase().includes(searchTerm) ||
      (employee.department && employee.department.toLowerCase().includes(searchTerm)) ||
      (employee.role && employee.role.toLowerCase().includes(searchTerm)) ||
      (employee.location && employee.location.toLowerCase().includes(searchTerm));

    // Smart contextual matching
    const contextualMatch =
      (searchTerm.includes('senior') && employee.role?.toLowerCase().includes('senior')) ||
      (searchTerm.includes('manager') && employee.role?.toLowerCase().includes('manager')) ||
      (searchTerm.includes('lead') && employee.role?.toLowerCase().includes('lead')) ||
      (searchTerm.includes('director') && employee.role?.toLowerCase().includes('director')) ||
      (searchTerm.includes('engineer') && employee.role?.toLowerCase().includes('engineer')) ||
      (searchTerm.includes('hr') && employee.department?.toLowerCase().includes('human')) ||
      (searchTerm.includes('sales') && employee.department?.toLowerCase().includes('sales')) ||
      (searchTerm.includes('marketing') && employee.department?.toLowerCase().includes('marketing')) ||
      (searchTerm.includes('finance') && employee.department?.toLowerCase().includes('finance')) ||
      (searchTerm.includes('active') && employee.status?.toLowerCase() === 'active') ||
      (searchTerm.includes('remote') && employee.status?.toLowerCase() === 'remote');

    return basicMatch || contextualMatch;
  });
}

export function getEmployeeDisplayName(employee: SearchableEmployee): string {
  return employee.name || employee.email;
}

export function getEmployeeSubtitle(employee: SearchableEmployee): string {
  const parts = [];
  if (employee.role) parts.push(employee.role);
  if (employee.department) parts.push(employee.department);
  return parts.join(' • ') || 'No role assigned';
}
