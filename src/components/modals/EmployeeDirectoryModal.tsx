import React, { useState, useEffect } from 'react';
import { X, Filter, Mail, Phone, MapPin, Building, Briefcase, Calendar, Users, Sparkles, Trophy, Award, Star, Medal, Shield, Eye } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useUserPresence } from '../../hooks/useUserPresence';
import ComprehensiveEmployeeProfileModal from './ComprehensiveEmployeeProfileModal';
import { mockEmployees } from '../../data/mockEmployees';

interface Employee {
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
  salary?: number;
  employmentType?: 'Salaried' | 'Hourly';
  managerId?: string;
  managerName?: string;
}

interface EmployeeDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EmployeeDirectoryModal: React.FC<EmployeeDirectoryModalProps> = ({ isOpen, onClose }) => {
  const { user, startImpersonation } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Derive modal visibility from selectedEmployee to avoid race condition
  const showProfileModal = selectedEmployee !== null;
  const { getPresenceStatus } = useUserPresence(employees.map(e => e.id));

  // Fetch employees from database
  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen]);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      // Use directory endpoint which includes profile data via JOIN
      const data = await apiClient.getEmployeesWithProfiles();

      const formattedEmployees: Employee[] = (data || []).map((emp: any) => {
        // Profile data comes from the joined profile object
        const firstName = emp.profile?.firstName ?? '';
        const lastName = emp.profile?.lastName ?? '';
        const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown Employee';
        
        // Normalize status (case-insensitive mapping)
        const normalizedStatus = emp.status?.toLowerCase() === 'active' 
          ? 'Active' 
          : emp.status?.toLowerCase() === 'remote'
          ? 'Remote'
          : 'On Leave';
        
        return {
          id: emp.userId || emp.id.toString(),
          name: fullName,
          email: emp.profile?.email || `${firstName?.toLowerCase()}.${lastName?.toLowerCase()}@company.com`,
          phone: emp.profile?.phone || '(555) 000-0000',
          department: emp.profile?.department || 'General',
          role: emp.profile?.role || 'Employee',
          location: 'Remote', // Default for now, can be added to schema later
          startDate: emp.startDate || new Date().toISOString().split('T')[0],
          status: normalizedStatus as 'Active' | 'Remote' | 'On Leave',
          profileImage: emp.profile?.avatarUrl,
          salary: parseFloat(emp.salary?.toString() || '0'),
          employmentType: emp.employmentType === 'Hourly' ? 'Hourly' : 'Salaried',
          managerId: emp.managerId || null
        };
      });

      // Fetch manager names for all employees with managers
      const managerIds = [...new Set(formattedEmployees.map(e => e.managerId).filter(Boolean))];
      const managerMap = new Map<string, string>();
      
      if (managerIds.length > 0) {
        try {
          await Promise.all(
            managerIds.map(async (managerId) => {
              if (!managerId) return;
              try {
                const response = await fetch(`/api/profiles/${managerId}`);
                if (response.ok) {
                  const profile = await response.json();
                  const managerName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
                  if (managerName) {
                    managerMap.set(managerId, managerName);
                  }
                }
              } catch (err) {
                console.error(`Error fetching manager ${managerId}:`, err);
              }
            })
          );
        } catch (err) {
          console.error('Error fetching managers:', err);
        }
      }
      
      // Add manager names to employees
      const employeesWithManagers = formattedEmployees.map(emp => ({
        ...emp,
        managerName: emp.managerId ? (managerMap.get(emp.managerId) || 'Not assigned') : 'Not assigned'
      }));

      // Merge with mock employees for comprehensive directory
      const mockEmployeesFormatted = mockEmployees.map(mock => ({
        ...mock,
        id: `mock-${mock.id}`, // Prefix to avoid ID conflicts with real employees
        managerId: undefined,
        managerName: 'Not assigned'
      }));

      const allEmployees = [...employeesWithManagers, ...mockEmployeesFormatted];
      
      // Keep all employees - filtering can be done by user via filter controls
      setEmployees(allEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle ESC key press
  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showProfileModal) {
          setSelectedEmployee(null);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose, showProfileModal]);

  if (!isOpen) return null;

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'All' || employee.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const departments = ['All', 'Executive', 'Engineering', 'Product', 'Sales', 'Marketing', 'Finance', 'HR', 'Operations', 'Customer Success'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Remote': return 'bg-blue-100 text-blue-800';
      case 'On Leave': return 'bg-yellow-100 text-yellow-800';
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
    // Always show badge even for year 0 (less than 1 year)
    if (years < 0) return null;

    const isMilestone = years > 0 && years % 5 === 0;

    // Determine tier based on years
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

    // Determine icon based on year position
    const yearInTier = years % 5;
    let icon;
    if (yearInTier === 0 || yearInTier === 5) icon = Trophy;
    else if (yearInTier === 1) icon = Award;
    else if (yearInTier === 2) icon = Star;
    else if (yearInTier === 3) icon = Shield;
    else icon = Medal;

    // Special color for milestones
    const color = isMilestone ? 'from-yellow-400 to-orange-500' : baseColor;

    return {
      years,
      isMilestone,
      tier,
      color,
      icon
    };
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg w-full min-h-screen overflow-auto">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-emerald-600 text-white sticky top-0 z-10">
          <div className="flex items-center">
            <Users className="h-8 w-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">Employee Directory</h2>
              <p className="text-blue-100">Connect with your colleagues</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white transition-colors p-2 rounded-lg hover:bg-white dark:bg-gray-800 dark:bg-gray-800/20"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
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
                className="w-full pl-16 pr-4 py-3 border-2 border-purple-100 dark:border-purple-900 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-300 bg-purple-50 dark:bg-purple-900/20/50 dark:bg-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-800 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* View Toggle Buttons */}
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 dark:border-gray-600 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'} transition-colors`}
                title="Grid View"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'} transition-colors`}
                title="List View"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">
            Showing {filteredEmployees.length} of {employees.length} employees
          </div>
        </div>

        {/* Employee Grid/List */}
        <div className="overflow-y-auto flex-1">
          <div className="p-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading employees...</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {filteredEmployees.map((employee, idx) => {
                const yearsOfService = calculateYearsOfService(employee.startDate);
                const badgeInfo = getBadgeInfo(yearsOfService);
                const BadgeIcon = badgeInfo?.icon || Trophy;

                // Debug logging
                if (idx === 0) {
                  console.log('=== BADGE DEBUG ===');
                  console.log('Employee:', employee.name);
                  console.log('Start Date:', employee.startDate);
                  console.log('Years of Service:', yearsOfService);
                  console.log('Badge Info:', badgeInfo);
                  console.log('=================');
                }

                return (
                  <div
                    key={employee.id}
                    className="bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer transform hover:-translate-y-1 relative overflow-hidden"
                    onClick={() => {
                      setSelectedEmployee(employee);
                    }}
                  >
                    {badgeInfo && badgeInfo.isMilestone && (
                      <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8">
                        <div className="absolute top-10 right-8 transform rotate-45">
                          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-6 py-1 shadow-lg">
                            {badgeInfo.years} Years!
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 mb-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
                          <span className="text-white font-bold">
                            {getInitials(employee.name)}
                          </span>
                        </div>
                        {(() => {
                          const presenceStatus = getPresenceStatus(employee.id);
                          if (presenceStatus === 'online') {
                            return (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
                            );
                          } else if (presenceStatus === 'away') {
                            return (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                            );
                          } else {
                            return (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-gray-400 rounded-full border-2 border-white dark:border-gray-800"></div>
                            );
                          }
                        })()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white dark:text-white text-lg">{employee.name}</h3>
                        <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400">{employee.role}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                        {employee.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600 dark:text-gray-400 dark:text-gray-400">
                        <Building className="h-4 w-4 mr-2" />
                        {employee.department}
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400 dark:text-gray-400">
                        <Mail className="h-4 w-4 mr-2" />
                        {employee.email}
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400 dark:text-gray-400">
                        <MapPin className="h-4 w-4 mr-2" />
                        {employee.location}
                      </div>
                    </div>

                    {/* Service Badge - Always shown */}
                    <div className="mt-4 pt-4 border-t-2 border-gray-200 dark:border-gray-700 dark:border-gray-700">
                      {badgeInfo ? (
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 dark:bg-gray-900 p-2 rounded">
                          <div className="flex items-center space-x-2">
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${badgeInfo.color} shadow-md ${badgeInfo.isMilestone ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}`}>
                              <BadgeIcon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-300">
                                {badgeInfo.tier} {badgeInfo.years === 0 ? '' : 'Badge'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
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
                      ) : null}
                    </div>
                  </div>
                );
              })}
              </div>
            ) : (
              // List View
              <div className="space-y-2">
                {filteredEmployees.map((employee) => {
                  const yearsOfService = calculateYearsOfService(employee.startDate);
                  const badgeInfo = getBadgeInfo(yearsOfService);
                  const BadgeIcon = badgeInfo?.icon || Trophy;

                  return (
                    <div
                      key={employee.id}
                      className="bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer relative"
                      onClick={() => {
                        setSelectedEmployee(employee);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
                              <span className="text-white font-bold text-sm">
                                {getInitials(employee.name)}
                              </span>
                            </div>
                            {(() => {
                              const presenceStatus = getPresenceStatus(employee.id);
                              if (presenceStatus === 'online') {
                                return (
                                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
                                );
                              } else if (presenceStatus === 'away') {
                                return (
                                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                                );
                              } else {
                                return (
                                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-gray-400 rounded-full border-2 border-white dark:border-gray-800"></div>
                                );
                              }
                            })()}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white dark:text-white">{employee.name}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                                {employee.status}
                              </span>
                              {badgeInfo && badgeInfo.isMilestone && (
                                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                                  {badgeInfo.years} Years!
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">{employee.role}</p>
                          </div>

                          <div className="hidden sm:flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">
                            <div className="flex items-center">
                              <Building className="h-4 w-4 mr-1.5" />
                              <span>{employee.department}</span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1.5" />
                              <span>{employee.location}</span>
                            </div>
                          </div>

                          {badgeInfo && (
                            <div className="flex items-center space-x-2 ml-4">
                              <div className={`p-2.5 rounded-lg bg-gradient-to-br ${badgeInfo.color} shadow-md ${
                                badgeInfo.isMilestone ? 'ring-2 ring-yellow-400 ring-offset-1' : ''
                              }`}>
                                <BadgeIcon className="h-5 w-5 text-white" />
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-300">{badgeInfo.tier}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {badgeInfo.years === 0 ? '<1 yr' : `${badgeInfo.years} ${badgeInfo.years === 1 ? 'yr' : 'yrs'}`}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {filteredEmployees.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 dark:text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white dark:text-white mb-2">No employees found</h3>
                <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        </div>

        {/* Comprehensive Employee Profile Modal */}
        {selectedEmployee && showProfileModal && (
          <ComprehensiveEmployeeProfileModal
            key={selectedEmployee.id}
            isOpen={showProfileModal}
            onClose={() => {
              setSelectedEmployee(null);
            }}
            employee={{
              id: selectedEmployee.id,
              name: selectedEmployee.name,
              email: selectedEmployee.email,
              phone: selectedEmployee.phone,
              department: selectedEmployee.department,
              role: selectedEmployee.role,
              status: selectedEmployee.status,
              startDate: selectedEmployee.startDate,
              location: selectedEmployee.location,
              manager: selectedEmployee.managerName || 'Not assigned',
              salary: selectedEmployee.salary?.toString() || '$0',
              employeeId: selectedEmployee.id,
              profileImage: selectedEmployee.profileImage,
              emergencyContact: {
                name: 'Emergency Contact',
                relationship: 'Family',
                phone: '(555) 000-0000'
              },
              skills: [],
              certifications: [],
              performanceRating: 4.1,
              ptoBalance: 15,
              sickLeaveBalance: 5
            }}
          />
        )}

        {/* Old Employee Detail Modal - Kept for backward compatibility */}
        {selectedEmployee && !showProfileModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">Employee Details</h3>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Employee Header */}
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/30 dark:to-emerald-900/30 rounded-lg">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl font-bold">
                      {getInitials(selectedEmployee.name)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">{selectedEmployee.name}</h4>
                    <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-lg">{selectedEmployee.role}</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getStatusColor(selectedEmployee.status)}`}>
                      {selectedEmployee.status}
                    </span>
                  </div>
                </div>
                
                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h5 className="font-semibold text-gray-900 dark:text-white dark:text-white text-lg">Contact Information</h5>
                    <div className="space-y-3">
                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 dark:bg-gray-900 rounded-lg">
                        <Mail className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">Email</p>
                          <a href={`mailto:${selectedEmployee.email}`} className="text-blue-600 hover:text-blue-700 font-medium">
                            {selectedEmployee.email}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 dark:bg-gray-900 rounded-lg">
                        <Phone className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">Phone</p>
                          <a href={`tel:${selectedEmployee.phone}`} className="text-blue-600 hover:text-blue-700 font-medium">
                            {selectedEmployee.phone}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 dark:bg-gray-900 rounded-lg">
                        <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">Location</p>
                          <p className="text-gray-900 dark:text-white dark:text-white font-medium">{selectedEmployee.location}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="font-semibold text-gray-900 dark:text-white dark:text-white text-lg">Work Information</h5>
                    <div className="space-y-3">
                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 dark:bg-gray-900 rounded-lg">
                        <Building className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">Department</p>
                          <p className="text-gray-900 dark:text-white dark:text-white font-medium">{selectedEmployee.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 dark:bg-gray-900 rounded-lg">
                        <Briefcase className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">Role</p>
                          <p className="text-gray-900 dark:text-white dark:text-white font-medium">{selectedEmployee.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 dark:bg-gray-900 rounded-lg">
                        <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">Start Date</p>
                          <p className="text-gray-900 dark:text-white dark:text-white font-medium">
                            {new Date(selectedEmployee.startDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Badge Section */}
                {(() => {
                  const yearsOfService = calculateYearsOfService(selectedEmployee.startDate);
                  const badgeInfo = getBadgeInfo(yearsOfService);
                  const BadgeIcon = badgeInfo?.icon || Trophy;

                  return badgeInfo ? (
                    <div className={`p-6 rounded-xl ${
                      badgeInfo.isMilestone
                        ? 'bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-600'
                        : 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-4 rounded-xl bg-gradient-to-br ${badgeInfo.color} shadow-lg ${
                            badgeInfo.isMilestone ? 'ring-4 ring-yellow-400 ring-offset-2 animate-pulse' : ''
                          }`}>
                            <BadgeIcon className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h5 className="font-bold text-gray-900 dark:text-white dark:text-white text-lg mb-1">
                              {badgeInfo.tier} {badgeInfo.years === 0 ? '' : 'Tier Badge'}
                            </h5>
                            <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300 font-medium">
                              {badgeInfo.years === 0 ? 'Less than 1 year of service' : `${badgeInfo.years} ${badgeInfo.years === 1 ? 'Year' : 'Years'} of Service`}
                            </p>
                            {badgeInfo.isMilestone && (
                              <p className="text-sm text-orange-600 font-semibold mt-1 flex items-center">
                                <Trophy className="h-4 w-4 mr-1" />
                                Milestone Achievement!
                              </p>
                            )}
                          </div>
                        </div>
                        {badgeInfo.isMilestone && (
                          <div className="text-center">
                            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                              🎉 {badgeInfo.years} Years!
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Quick Actions */}
                <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700 dark:border-gray-700">
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
                        startImpersonation(selectedEmployee.id, selectedEmployee.email);
                        setSelectedEmployee(null);
                        onClose();
                      }}
                      className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors shadow-md"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View As
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDirectoryModal;