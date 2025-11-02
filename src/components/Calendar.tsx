import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Filter, Users, MapPin, Building, Eye, EyeOff, Cake, Plane, Heart, Clock, Shield, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'Federal' | 'Company' | 'Floating';
  description?: string;
}

interface LeaveEvent {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  location: string;
  team: string;
  leaveType: 'Vacation' | 'Sick' | 'Personal' | 'Military' | 'Bereavement' | 'Maternity' | 'Paternity' | 'FMLA';
  startDate: string;
  endDate: string;
  isHalfDay?: boolean;
  status: 'Approved' | 'Pending' | 'Denied';
}

interface Birthday {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  location: string;
  team: string;
  date: string; // MM-DD format for recurring birthdays
  age?: number;
}

interface CalendarProps {
  holidays?: Holiday[];
  onAddEvent?: () => void;
}

const Calendar: React.FC<CalendarProps> = ({ holidays = [], onAddEvent }) => {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    description: ''
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    showHolidays: true,
    showLeave: true,
    showBirthdays: true,
    department: 'All',
    location: 'All',
    team: 'All',
    leaveType: 'All'
  });

  // Mock data for leave events
  const leaveEvents: LeaveEvent[] = [
    {
      id: 'leave-1',
      employeeName: 'David Kim',
      employeeId: 'EMP003',
      department: 'Engineering',
      location: 'San Francisco Office',
      team: 'Frontend Team',
      leaveType: 'Vacation',
      startDate: '2025-10-06',
      endDate: '2025-10-10',
      status: 'Approved'
    },
    {
      id: 'leave-2',
      employeeName: 'Emma Wilson',
      employeeId: 'EMP005',
      department: 'HR',
      location: 'Amherst Office',
      team: 'HR Operations',
      leaveType: 'Sick',
      startDate: '2025-10-16',
      endDate: '2025-10-17',
      status: 'Approved'
    },
    {
      id: 'leave-3',
      employeeName: 'Sarah Johnson',
      employeeId: 'EMP001',
      department: 'Engineering',
      location: 'Remote',
      team: 'Backend Team',
      leaveType: 'Personal',
      startDate: '2025-10-24',
      endDate: '2025-10-24',
      isHalfDay: true,
      status: 'Approved'
    },
    {
      id: 'leave-4',
      employeeName: 'Alex Thompson',
      employeeId: 'EMP007',
      department: 'Marketing',
      location: 'Austin Office',
      team: 'Digital Marketing',
      leaveType: 'Military',
      startDate: '2025-10-20',
      endDate: '2025-10-22',
      status: 'Approved'
    },
    {
      id: 'leave-5',
      employeeName: 'Maria Garcia',
      employeeId: 'EMP008',
      department: 'Sales',
      location: 'Miami Office',
      team: 'Enterprise Sales',
      leaveType: 'Maternity',
      startDate: '2025-09-15',
      endDate: '2025-12-15',
      status: 'Approved'
    },
    {
      id: 'leave-6',
      employeeName: 'James Anderson',
      employeeId: 'EMP009',
      department: 'Engineering',
      location: 'San Francisco Office',
      team: 'Backend Team',
      leaveType: 'Vacation',
      startDate: '2025-10-27',
      endDate: '2025-10-31',
      status: 'Approved'
    },
    {
      id: 'leave-7',
      employeeName: 'Rachel Green',
      employeeId: 'EMP010',
      department: 'Finance',
      location: 'New York Office',
      team: 'Accounting',
      leaveType: 'Sick',
      startDate: '2025-10-03',
      endDate: '2025-10-03',
      status: 'Approved'
    },
    {
      id: 'leave-8',
      employeeName: 'Tom Bradley',
      employeeId: 'EMP011',
      department: 'Operations',
      location: 'Chicago Office',
      team: 'Logistics',
      leaveType: 'Personal',
      startDate: '2025-10-14',
      endDate: '2025-10-14',
      isHalfDay: true,
      status: 'Approved'
    }
  ];

  // Mock data for birthdays
  const birthdays: Birthday[] = [
    {
      id: 'bday-1',
      employeeName: 'Mike Chen',
      employeeId: 'EMP002',
      department: 'Engineering',
      location: 'San Francisco Office',
      team: 'Platform Team',
      date: '10-08',
      age: 32
    },
    {
      id: 'bday-2',
      employeeName: 'Lisa Rodriguez',
      employeeId: 'EMP004',
      department: 'Sales',
      location: 'New York Office',
      team: 'Enterprise Sales',
      date: '10-22',
      age: 29
    },
    {
      id: 'bday-3',
      employeeName: 'John Smith',
      employeeId: 'EMP006',
      department: 'Finance',
      location: 'Amherst Office',
      team: 'Accounting',
      date: '10-15',
      age: 35
    },
    {
      id: 'bday-4',
      employeeName: 'Amanda Peterson',
      employeeId: 'EMP012',
      department: 'Marketing',
      location: 'Austin Office',
      team: 'Content Marketing',
      date: '10-29',
      age: 28
    }
  ];

  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();
  
  // Month names
  const monthNames = [
    t('calendar.january'), t('calendar.february'), t('calendar.march'), t('calendar.april'),
    t('calendar.may'), t('calendar.june'), t('calendar.july'), t('calendar.august'),
    t('calendar.september'), t('calendar.october'), t('calendar.november'), t('calendar.december')
  ];

  // Day names
  const dayNames = [
    t('calendar.sun'), t('calendar.mon'), t('calendar.tue'), t('calendar.wed'),
    t('calendar.thu'), t('calendar.fri'), t('calendar.sat')
  ];
  
  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleAddEvent = () => {
    setShowCreateEvent(true);
  };

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.date) {
      alert('Please fill in the required fields');
      return;
    }

    console.log('Creating calendar event:', newEvent);
    
    setNewEvent({ title: '', date: '', description: '' });
    setShowCreateEvent(false);
    alert('Event created successfully!');
  };

  // Get unique values for filters
  const departments = ['All', ...Array.from(new Set(leaveEvents.map(e => e.department)))];
  const locations = ['All', ...Array.from(new Set(leaveEvents.map(e => e.location)))];
  const teams = ['All', ...Array.from(new Set(leaveEvents.map(e => e.team)))];
  const leaveTypes = ['All', 'Vacation', 'Sick', 'Personal', 'Military', 'Bereavement', 'Maternity', 'Paternity', 'FMLA'];
  
  // Check if a date has a holiday
  const getHolidayForDate = (day: number) => {
    if (!filters.showHolidays) return null;
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.find(holiday => holiday.date === dateString);
  };

  // Check if a date has leave events
  const getLeaveEventsForDate = (day: number) => {
    if (!filters.showLeave) return [];
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return leaveEvents.filter(leave => {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      const checkDate = new Date(dateString);
      
      const isInDateRange = checkDate >= startDate && checkDate <= endDate;
      const matchesDepartment = filters.department === 'All' || leave.department === filters.department;
      const matchesLocation = filters.location === 'All' || leave.location === filters.location;
      const matchesTeam = filters.team === 'All' || leave.team === filters.team;
      const matchesLeaveType = filters.leaveType === 'All' || leave.leaveType === filters.leaveType;
      
      return isInDateRange && matchesDepartment && matchesLocation && matchesTeam && matchesLeaveType && leave.status === 'Approved';
    });
  };

  // Check if a date has birthdays
  const getBirthdaysForDate = (day: number) => {
    if (!filters.showBirthdays) return [];
    const dateString = `${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return birthdays.filter(birthday => {
      const matchesDate = birthday.date === dateString;
      const matchesDepartment = filters.department === 'All' || birthday.department === filters.department;
      const matchesLocation = filters.location === 'All' || birthday.location === filters.location;
      const matchesTeam = filters.team === 'All' || birthday.team === filters.team;
      
      return matchesDate && matchesDepartment && matchesLocation && matchesTeam;
    });
  };
  
  // Check if date is today
  const isToday = (day: number) => {
    return today.getDate() === day && 
           today.getMonth() === currentMonth && 
           today.getFullYear() === currentYear;
  };
  
  // Generate calendar days
  const calendarDays = [];
  
  // Empty cells for days before month starts
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }
  
  const getHolidayColor = (type: string) => {
    switch (type) {
      case 'Federal': return 'bg-red-100 text-red-800 border-red-200';
      case 'Company': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Floating': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLeaveColor = (type: string) => {
    switch (type) {
      case 'Vacation': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Sick': return 'bg-red-100 text-red-800 border-red-200';
      case 'Personal': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Military': return 'bg-green-100 text-green-800 border-green-200';
      case 'Bereavement': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Maternity': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'Paternity': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'FMLA': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLeaveIcon = (type: string) => {
    switch (type) {
      case 'Vacation': return <Plane className="h-3 w-3" />;
      case 'Sick': return <Heart className="h-3 w-3" />;
      case 'Personal': return <Clock className="h-3 w-3" />;
      case 'Military': return <Shield className="h-3 w-3" />;
      case 'Bereavement': return <Heart className="h-3 w-3" />;
      case 'Maternity': return <Heart className="h-3 w-3" />;
      case 'Paternity': return <Heart className="h-3 w-3" />;
      case 'FMLA': return <Home className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== true && value !== 'All'
  ).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {monthNames[currentMonth]} {currentYear}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
          >
            {t('calendar.today')}
          </button>
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative p-2 rounded-lg transition-colors ${
              showFilters ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            <Filter className="h-5 w-5" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
          {onAddEvent && (
            <button
              onClick={handleAddEvent}
              className="ml-2 px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Event
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Calendar Filters</h4>
          
          {/* Event Type Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Event Types</h5>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showHolidays}
                    onChange={(e) => setFilters({ ...filters, showHolidays: e.target.checked })}
                    className="mr-2 text-blue-600 dark:text-blue-400 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Holidays</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showLeave}
                    onChange={(e) => setFilters({ ...filters, showLeave: e.target.checked })}
                    className="mr-2 text-blue-600 dark:text-blue-400 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Employee Leave</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showBirthdays}
                    onChange={(e) => setFilters({ ...filters, showBirthdays: e.target.checked })}
                    className="mr-2 text-blue-600 dark:text-blue-400 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Birthdays</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Organization</h5>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Department</label>
                  <select
                    value={filters.department}
                    onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                    className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Location</label>
                  <select
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {locations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Team & Leave</h5>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Team</label>
                  <select
                    value={filters.team}
                    onChange={(e) => setFilters({ ...filters, team: e.target.value })}
                    className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {teams.map(team => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Leave Type</label>
                  <select
                    value={filters.leaveType}
                    onChange={(e) => setFilters({ ...filters, leaveType: e.target.value })}
                    className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {leaveTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilters({
                showHolidays: true,
                showLeave: true,
                showBirthdays: true,
                department: 'All',
                location: 'All',
                team: 'All',
                leaveType: 'All'
              })}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Clear All Filters
            </button>
            <button
              onClick={() => setFilters({ ...filters, department: 'Engineering' })}
              className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              Engineering Only
            </button>
            <button
              onClick={() => setFilters({ ...filters, leaveType: 'Vacation' })}
              className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
            >
              Vacation Only
            </button>
            <button
              onClick={() => setFilters({ ...filters, showLeave: true, showHolidays: false, showBirthdays: false })}
              className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
            >
              Leave Only
            </button>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={index} className="p-2 h-32"></div>;
          }

          const holiday = getHolidayForDate(day);
          const leaveEvents = getLeaveEventsForDate(day);
          const birthdayEvents = getBirthdaysForDate(day);
          const todayClass = isToday(day) ? 'ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50 dark:bg-blue-900/20' : '';

          return (
            <div
              key={day}
              className={`p-2 h-32 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${todayClass} overflow-y-auto bg-white dark:bg-gray-800/50`}
            >
              <div className="flex flex-col h-full">
                <span className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                  {day}
                </span>
                
                <div className="space-y-1 flex-1 overflow-y-auto">
                  {/* Holiday */}
                  {holiday && (
                    <div className={`px-1 py-0.5 rounded text-xs font-medium border ${getHolidayColor(holiday.type)}`}>
                      <div className="truncate" title={holiday.name}>
                        🏛️ {holiday.name}
                      </div>
                    </div>
                  )}
                  
                  {/* Leave Events */}
                  {leaveEvents.map((leave, idx) => (
                    <div 
                      key={idx} 
                      className={`px-1 py-0.5 rounded text-xs font-medium border ${getLeaveColor(leave.leaveType)}`}
                      title={`${leave.employeeName} - ${leave.leaveType}${leave.isHalfDay ? ' (Half Day)' : ''}\n${leave.department} • ${leave.team}\n${leave.location}`}
                    >
                      <div className="flex items-center truncate">
                        {getLeaveIcon(leave.leaveType)}
                        <span className="ml-1 truncate">
                          {leave.employeeName.split(' ')[0]}
                          {leave.isHalfDay && ' (½)'}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Birthdays */}
                  {birthdayEvents.map((birthday, idx) => (
                    <div 
                      key={idx} 
                      className="px-1 py-0.5 rounded text-xs font-medium border bg-yellow-100 text-yellow-800 border-yellow-200"
                      title={`${birthday.employeeName}'s Birthday${birthday.age ? ` (${birthday.age} years old)` : ''}\n${birthday.department} • ${birthday.team}\n${birthday.location}`}
                    >
                      <div className="flex items-center truncate">
                        <Cake className="h-3 w-3" />
                        <span className="ml-1 truncate">
                          {birthday.employeeName.split(' ')[0]}
                          {birthday.age && ` (${birthday.age})`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Calendar Legend</h4>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t('calendar.showingLeaveEvents', {
              leaveCount: leaveEvents.filter(e => {
                const startDate = new Date(e.startDate);
                const endDate = new Date(e.endDate);
                const monthStart = new Date(currentYear, currentMonth, 1);
                const monthEnd = new Date(currentYear, currentMonth + 1, 0);
                return (startDate <= monthEnd && endDate >= monthStart);
              }).length,
              birthdayCount: birthdays.filter(b => {
                const [month] = b.date.split('-');
                return parseInt(month) === currentMonth + 1;
              }).length
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {/* Holiday Types */}
          {filters.showHolidays && (
            <>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-100 border border-red-200 rounded mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400">Federal Holidays</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400">Company Holidays</span>
              </div>
            </>
          )}

          {/* Leave Types */}
          {filters.showLeave && (
            <>
              <div className="flex items-center">
                <Plane className="h-3 w-3 text-blue-600 dark:text-blue-400 mr-2" />
                <span className="text-gray-600 dark:text-gray-400">Vacation</span>
              </div>
              <div className="flex items-center">
                <Heart className="h-3 w-3 text-red-600 dark:text-red-400 mr-2" />
                <span className="text-gray-600 dark:text-gray-400">Sick Leave</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-3 w-3 text-purple-600 dark:text-purple-400 mr-2" />
                <span className="text-gray-600 dark:text-gray-400">Personal</span>
              </div>
              <div className="flex items-center">
                <Shield className="h-3 w-3 text-green-600 dark:text-green-400 mr-2" />
                <span className="text-gray-600 dark:text-gray-400">Military</span>
              </div>
            </>
          )}

          {/* Birthdays */}
          {filters.showBirthdays && (
            <div className="flex items-center">
              <Cake className="h-3 w-3 text-yellow-600 dark:text-yellow-400 mr-2" />
              <span className="text-gray-600 dark:text-gray-400">Birthdays</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {leaveEvents.filter(e => e.leaveType === 'Vacation' && e.status === 'Approved').length}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">On Vacation</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-100 dark:border-red-800">
            <p className="text-lg font-bold text-red-600 dark:text-red-400">
              {leaveEvents.filter(e => e.leaveType === 'Sick' && e.status === 'Approved').length}
            </p>
            <p className="text-xs text-red-700 dark:text-red-300">Sick Leave</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-100 dark:border-yellow-800">
            <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
              {birthdays.filter(b => {
                const [month] = b.date.split('-');
                return parseInt(month) === currentMonth + 1;
              }).length}
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">Birthdays</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-100 dark:border-green-800">
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {247 - leaveEvents.filter(e => {
                const today = new Date();
                const startDate = new Date(e.startDate);
                const endDate = new Date(e.endDate);
                return today >= startDate && today <= endDate && e.status === 'Approved';
              }).length}
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">Available</p>
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add Calendar Event</h3>
              <button
                onClick={() => setShowCreateEvent(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Title *</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="e.g., Team Meeting"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  rows={3}
                  placeholder="Event details..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateEvent(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvent}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                Create Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;