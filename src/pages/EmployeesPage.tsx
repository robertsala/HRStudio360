import React, { useState, useEffect } from 'react';
import { Filter, Mail, Phone, MapPin, Building, Briefcase, Calendar, Users, Sparkles, Trophy, Award, Star, Medal, Shield, Eye } from 'lucide-react';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useUserPresence } from '../hooks/useUserPresence';
import ComprehensiveEmployeeProfileModal from '../components/modals/ComprehensiveEmployeeProfileModal';
import { mockEmployees } from '../data/mockEmployees';
import { mapEmployeesFromBackend, type MappedEmployee } from '../lib/employeeDataMapper';
import { useDashboardEscape } from '../hooks/useDashboardEscape';

const EmployeesPage: React.FC = () => {
  const { user, startImpersonation } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const showProfileModal = selectedEmployee !== null;
  const { getPresenceStatus } = useUserPresence(employees.map(e => e.id));

  // ESC key handling - close nested modal first before navigating away
  useDashboardEscape(() => {
    if (showProfileModal) {
      setSelectedEmployee(null);
      return false;
    }
    return true;
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getEmployeesWithProfiles();
      const formattedEmployees = mapEmployeesFromBackend(data || []);

      const mockAsBackendFormat = mockEmployees.map((mock: any) => ({
        id: `mock-${mock.id}`,
        userId: `mock-${mock.id}`,
        employeeId: mock.employeeId,
        status: mock.status,
        startDate: mock.startDate,
        salary: mock.salary,
        employmentType: 'Salaried',
        location: mock.location,
        managerId: null,
        managerName: 'Not assigned',
        profileImage: mock.profileImage,
        profile: {
          firstName: mock.name?.split(' ')[0] || '',
          lastName: mock.name?.split(' ').slice(1).join(' ') || '',
          email: mock.email,
          phone: mock.phone,
          department: mock.department,
          role: mock.role,
          city: mock.location?.split(', ')[0] || '',
          state: mock.location?.split(', ')[1] || '',
          managerName: 'Not assigned',
          profilePicture: mock.profileImage
        }
      }));
      
      const mockEmployeesFormatted = mapEmployeesFromBackend(mockAsBackendFormat);
      const allEmployees = [...formattedEmployees, ...mockEmployeesFormatted];
      
      setEmployees(allEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  };

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
      case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400';
      case 'Remote': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400';
      case 'On Leave': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-400';
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
        </div>

        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-1 mr-2 animate-pulse">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400">AI</span>
              </div>
              <input
                type="text"
                placeholder="AI Search: Try 'Sarah', 'Engineering', 'Manager', etc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-4 py-3 border-2 border-purple-100 dark:border-purple-900 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-300 bg-purple-50 dark:bg-purple-900/20 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                data-testid="input-search"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="select-department"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'} transition-colors`}
                title="Grid View"
                data-testid="button-grid-view"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'} transition-colors`}
                title="List View"
                data-testid="button-list-view"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredEmployees.length} of {employees.length} employees
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="p-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading employees...</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {filteredEmployees.map((employee) => {
                const yearsOfService = calculateYearsOfService(employee.startDate);
                const badgeInfo = getBadgeInfo(yearsOfService);
                const BadgeIcon = badgeInfo?.icon || Trophy;

                return (
                  <div
                    key={employee.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 cursor-pointer transform hover:-translate-y-1 relative overflow-hidden"
                    onClick={() => {
                      setSelectedEmployee(employee);
                    }}
                    data-testid={`card-employee-${employee.id}`}
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
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{employee.name}</h3>
                        <p className="text-gray-600 dark:text-gray-400">{employee.role}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                        {employee.status}
                      </span>
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
                    </div>

                    {badgeInfo && (
                      <div className="mt-4 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-2 rounded">
                          <div className="flex items-center space-x-2">
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${badgeInfo.color} shadow-md ${badgeInfo.isMilestone ? 'ring-2 ring-yellow-400 ring-offset-2 dark:ring-offset-gray-800' : ''}`}>
                              <BadgeIcon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                {badgeInfo.tier} {badgeInfo.years === 0 ? '' : 'Badge'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {badgeInfo.years === 0 ? 'Less than 1 year' : `${badgeInfo.years} ${badgeInfo.years === 1 ? 'Year' : 'Years'}`}
                              </p>
                            </div>
                          </div>
                          {badgeInfo.isMilestone && (
                            <div className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                              Milestone!
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEmployees.map((employee) => {
                  const yearsOfService = calculateYearsOfService(employee.startDate);
                  const badgeInfo = getBadgeInfo(yearsOfService);
                  const BadgeIcon = badgeInfo?.icon || Trophy;

                  return (
                    <div
                      key={employee.id}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 cursor-pointer relative"
                      onClick={() => {
                        setSelectedEmployee(employee);
                      }}
                      data-testid={`row-employee-${employee.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="relative flex-shrink-0">
                            {employee.profileImage ? (
                              <img
                                src={employee.profileImage}
                                alt={employee.name}
                                className="w-12 h-12 rounded-full object-cover shadow-md"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
                                <span className="text-white font-bold text-sm">
                                  {getInitials(employee.name)}
                                </span>
                              </div>
                            )}
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
                              <h3 className="font-semibold text-gray-900 dark:text-white">{employee.name}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                                {employee.status}
                              </span>
                              {badgeInfo && badgeInfo.isMilestone && (
                                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                                  {badgeInfo.years} Years!
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{employee.role}</p>
                          </div>

                          <div className="hidden sm:flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
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
                                badgeInfo.isMilestone ? 'ring-2 ring-yellow-400 ring-offset-1 dark:ring-offset-gray-800' : ''
                              }`}>
                                <BadgeIcon className="h-5 w-5 text-white" />
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                  {badgeInfo.tier}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {badgeInfo.years === 0 ? '<1 year' : `${badgeInfo.years}y`}
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
          </div>
        </div>
      </div>

      {showProfileModal && selectedEmployee && (
        <ComprehensiveEmployeeProfileModal
          isOpen={true}
          onClose={() => setSelectedEmployee(null)}
          employee={selectedEmployee}
        />
      )}
    </div>
  );
};

export default EmployeesPage;
