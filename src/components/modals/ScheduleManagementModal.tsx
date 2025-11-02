import React, { useState } from 'react';
import { Calendar, Clock, Users, Plus, CreditCard as Edit3, Save, X, Copy, Trash2, AlertTriangle, CheckCircle, Filter, Search, Eye, Send, Bell, MapPin, Building, User, Target, Award, TrendingUp } from 'lucide-react';

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakDuration: number; // in minutes
  isDefault: boolean;
  color: string;
  description?: string;
}

interface ScheduleEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  shiftId?: string;
  customStartTime?: string;
  customEndTime?: string;
  customBreakDuration?: number;
  location: string;
  notes?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'no_show' | 'called_out';
  createdBy: string;
  createdDate: string;
  lastModified: string;
}

interface WeeklySchedule {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  role: string;
  weekStartDate: string;
  weekEndDate: string;
  entries: ScheduleEntry[];
  totalScheduledHours: number;
  status: 'draft' | 'published' | 'confirmed';
  publishedDate?: string;
  publishedBy?: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  employeeType: 'hourly' | 'salary';
  manager: string;
  location: string;
  profilePicture?: string;
}

const ScheduleManagementModal: React.FC = () => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [showShiftEditor, setShowShiftEditor] = useState(false);
  const [showScheduleEntry, setShowScheduleEntry] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [newScheduleEntry, setNewScheduleEntry] = useState({
    employeeId: '',
    date: '',
    shiftId: '',
    customStartTime: '',
    customEndTime: '',
    customBreakDuration: 30,
    location: 'Main Office',
    notes: ''
  });
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);

  // Mock data for predefined shifts
  const [shifts, setShifts] = useState<Shift[]>([
    {
      id: '1',
      name: 'Morning Shift',
      startTime: '08:00',
      endTime: '16:00',
      breakDuration: 60,
      isDefault: true,
      color: 'bg-blue-500',
      description: 'Standard morning shift with 1-hour lunch break'
    },
    {
      id: '2',
      name: 'Afternoon Shift',
      startTime: '12:00',
      endTime: '20:00',
      breakDuration: 60,
      isDefault: true,
      color: 'bg-green-500',
      description: 'Afternoon shift with 1-hour dinner break'
    },
    {
      id: '3',
      name: 'Evening Shift',
      startTime: '16:00',
      endTime: '00:00',
      breakDuration: 30,
      isDefault: true,
      color: 'bg-purple-500',
      description: 'Evening shift with 30-minute break'
    },
    {
      id: '4',
      name: 'Part-Time Morning',
      startTime: '09:00',
      endTime: '13:00',
      breakDuration: 0,
      isDefault: false,
      color: 'bg-yellow-500',
      description: '4-hour part-time morning shift'
    },
    {
      id: '5',
      name: 'Weekend Shift',
      startTime: '10:00',
      endTime: '18:00',
      breakDuration: 60,
      isDefault: false,
      color: 'bg-orange-500',
      description: 'Weekend shift with flexible break time'
    }
  ]);

  // Mock hourly employees data
  const hourlyEmployees: Employee[] = [
    {
      id: 'emp-001',
      name: 'David Kim',
      email: 'david.kim@company.com',
      department: 'Engineering',
      role: 'Frontend Developer',
      employeeType: 'hourly',
      manager: 'Sarah Johnson',
      location: 'San Francisco Office',
      profilePicture: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
    },
    {
      id: 'emp-002',
      name: 'Emma Wilson',
      email: 'emma.wilson@company.com',
      department: 'HR',
      role: 'HR Specialist',
      employeeType: 'hourly',
      manager: 'Lisa Rodriguez',
      location: 'Amherst Office',
      profilePicture: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
    },
    {
      id: 'emp-003',
      name: 'Alex Thompson',
      email: 'alex.thompson@company.com',
      department: 'Marketing',
      role: 'Marketing Coordinator',
      employeeType: 'hourly',
      manager: 'Mike Chen',
      location: 'Austin Office',
      profilePicture: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
    },
    {
      id: 'emp-004',
      name: 'Maria Garcia',
      email: 'maria.garcia@company.com',
      department: 'Operations',
      role: 'Operations Assistant',
      employeeType: 'hourly',
      manager: 'John Smith',
      location: 'Miami Office'
    },
    {
      id: 'emp-005',
      name: 'James Wilson',
      email: 'james.wilson@company.com',
      department: 'Customer Success',
      role: 'Support Specialist',
      employeeType: 'hourly',
      manager: 'Lisa Rodriguez',
      location: 'Remote'
    }
  ];

  // Mock schedule entries
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([
    {
      id: 'sch-1',
      employeeId: 'emp-001',
      employeeName: 'David Kim',
      date: '2025-01-20',
      shiftId: '1',
      location: 'San Francisco Office',
      status: 'scheduled',
      createdBy: 'Sarah Johnson',
      createdDate: '2025-01-15',
      lastModified: '2025-01-15'
    },
    {
      id: 'sch-2',
      employeeId: 'emp-001',
      employeeName: 'David Kim',
      date: '2025-01-21',
      shiftId: '1',
      location: 'San Francisco Office',
      status: 'scheduled',
      createdBy: 'Sarah Johnson',
      createdDate: '2025-01-15',
      lastModified: '2025-01-15'
    },
    {
      id: 'sch-3',
      employeeId: 'emp-002',
      employeeName: 'Emma Wilson',
      date: '2025-01-20',
      customStartTime: '10:00',
      customEndTime: '14:00',
      customBreakDuration: 30,
      location: 'Amherst Office',
      status: 'scheduled',
      createdBy: 'Lisa Rodriguez',
      createdDate: '2025-01-15',
      lastModified: '2025-01-15'
    }
  ]);

  const getWeekDates = (startDate: Date) => {
    const dates = [];
    const start = new Date(startDate);
    start.setDate(start.getDate() - start.getDay()); // Start from Sunday
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const getShiftDetails = (shiftId: string) => {
    return shifts.find(shift => shift.id === shiftId);
  };

  const calculateShiftHours = (startTime: string, endTime: string, breakDuration: number = 0) => {
    const start = new Date(`2025-01-01 ${startTime}`);
    let end = new Date(`2025-01-01 ${endTime}`);
    
    // Handle overnight shifts
    if (end <= start) {
      end.setDate(end.getDate() + 1);
    }
    
    const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    const workMinutes = totalMinutes - breakDuration;
    return Math.round((workMinutes / 60) * 100) / 100;
  };

  const getScheduleForDate = (employeeId: string, date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return scheduleEntries.find(entry => 
      entry.employeeId === employeeId && entry.date === dateString
    );
  };

  const handleCreateScheduleEntry = () => {
    if (!newScheduleEntry.employeeId || !newScheduleEntry.date) {
      setNotification({
        type: 'error',
        message: 'Please select an employee and date'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const employee = hourlyEmployees.find(emp => emp.id === newScheduleEntry.employeeId);
    if (!employee) return;

    const entry: ScheduleEntry = {
      id: Date.now().toString(),
      employeeId: newScheduleEntry.employeeId,
      employeeName: employee.name,
      date: newScheduleEntry.date,
      shiftId: newScheduleEntry.shiftId || undefined,
      customStartTime: newScheduleEntry.customStartTime || undefined,
      customEndTime: newScheduleEntry.customEndTime || undefined,
      customBreakDuration: newScheduleEntry.customBreakDuration || undefined,
      location: newScheduleEntry.location,
      notes: newScheduleEntry.notes,
      status: 'scheduled',
      createdBy: 'Current Manager',
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    setScheduleEntries(prev => [...prev, entry]);
    
    setNotification({
      type: 'success',
      message: `Schedule created for ${employee.name} on ${new Date(newScheduleEntry.date).toLocaleDateString()}`
    });
    setTimeout(() => setNotification(null), 3000);

    // Reset form
    setNewScheduleEntry({
      employeeId: '',
      date: '',
      shiftId: '',
      customStartTime: '',
      customEndTime: '',
      customBreakDuration: 30,
      location: 'Main Office',
      notes: ''
    });
    setShowScheduleEntry(false);
  };

  const handleCreateShift = () => {
    if (!editingShift?.name || !editingShift?.startTime || !editingShift?.endTime) {
      setNotification({
        type: 'error',
        message: 'Please fill in all required shift details'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (editingShift.id === 'new') {
      // Create new shift
      const newShift: Shift = {
        ...editingShift,
        id: Date.now().toString(),
        isDefault: false
      };
      setShifts(prev => [...prev, newShift]);
      
      setNotification({
        type: 'success',
        message: `Shift "${newShift.name}" created successfully`
      });
    } else {
      // Update existing shift
      setShifts(prev => prev.map(shift => 
        shift.id === editingShift.id ? editingShift : shift
      ));
      
      setNotification({
        type: 'success',
        message: `Shift "${editingShift.name}" updated successfully`
      });
    }
    
    setTimeout(() => setNotification(null), 3000);
    setShowShiftEditor(false);
    setEditingShift(null);
  };

  const handlePublishSchedule = () => {
    const weekStart = new Date(selectedWeek);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const weekEntries = scheduleEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= weekStart && entryDate <= weekEnd;
    });

    // Send notifications to employees
    const employeesWithSchedules = Array.from(new Set(weekEntries.map(entry => entry.employeeId)));
    
    employeesWithSchedules.forEach(employeeId => {
      const employee = hourlyEmployees.find(emp => emp.id === employeeId);
      if (employee) {
        console.log('Sending schedule notification to:', {
          to: employee.email,
          subject: 'New Schedule Published',
          message: `Your schedule for the week of ${weekStart.toLocaleDateString()} has been published. Please review and confirm your availability.`
        });
      }
    });

    setNotification({
      type: 'success',
      message: `Schedule published for ${employeesWithSchedules.length} employees. Notifications sent.`
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'no_show': return 'bg-red-100 text-red-800';
      case 'called_out': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const departments = ['All', ...Array.from(new Set(hourlyEmployees.map(emp => emp.department)))];
  const weekDates = getWeekDates(selectedWeek);

  const filteredEmployees = hourlyEmployees.filter(emp => 
    selectedDepartment === 'All' || emp.department === selectedDepartment
  );

  const tabs = [
    { id: 'schedule', label: 'Weekly Schedule', icon: Calendar },
    { id: 'shifts', label: 'Shift Templates', icon: Clock },
    { id: 'analytics', label: 'Schedule Analytics', icon: TrendingUp }
  ];

  return (
    <>
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">Schedule Management</h2>
              <p className="text-indigo-100">Create and manage employee work schedules</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-indigo-100 text-sm">Week of</p>
              <p className="text-lg font-bold">{selectedWeek.toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="overflow-y-auto max-h-96">
          <div className="p-6">
            {/* Weekly Schedule Tab */}
            {activeTab === 'schedule' && (
              <div className="space-y-6">
                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => {
                        const prevWeek = new Date(selectedWeek);
                        prevWeek.setDate(prevWeek.getDate() - 7);
                        setSelectedWeek(prevWeek);
                      }}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
                    >
                      ← Previous Week
                    </button>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">
                      Week of {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}
                    </h3>
                    <button
                      onClick={() => {
                        const nextWeek = new Date(selectedWeek);
                        nextWeek.setDate(nextWeek.getDate() + 7);
                        setSelectedWeek(nextWeek);
                      }}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
                    >
                      Next Week →
                    </button>
                  </div>
                  <div className="flex items-center space-x-3">
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowScheduleEntry(true)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Schedule
                    </button>
                    <button
                      onClick={handlePublishSchedule}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Publish Week
                    </button>
                  </div>
                </div>

                {/* Schedule Grid */}
                <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-900 px-6 py-3 border-b">
                    <div className="grid grid-cols-8 gap-4">
                      <div className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Employee</div>
                      {weekDates.map((date, index) => (
                        <div key={index} className="text-center font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">
                          <div>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index]}</div>
                          <div className="text-xs text-gray-500">{date.getDate()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {filteredEmployees.map((employee) => (
                      <div key={employee.id} className="px-6 py-4">
                        <div className="grid grid-cols-8 gap-4 items-center">
                          {/* Employee Info */}
                          <div className="flex items-center space-x-3">
                            {employee.profilePicture ? (
                              <img
                                src={employee.profilePicture}
                                alt={employee.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {employee.name.split(' ').map(n => n.charAt(0)).join('')}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white dark:text-white text-sm">{employee.name}</p>
                              <p className="text-xs text-gray-500">{employee.role}</p>
                            </div>
                          </div>
                          
                          {/* Daily Schedule Cells */}
                          {weekDates.map((date, dayIndex) => {
                            const scheduleEntry = getScheduleForDate(employee.id, date);
                            const shift = scheduleEntry?.shiftId ? getShiftDetails(scheduleEntry.shiftId) : null;
                            
                            return (
                              <div key={dayIndex} className="text-center">
                                {scheduleEntry ? (
                                  <div className={`p-2 rounded-lg border-2 ${
                                    shift ? shift.color.replace('bg-', 'border-') + ' ' + shift.color.replace('500', '50') : 'border-gray-300 bg-gray-50'
                                  }`}>
                                    <div className="text-xs font-medium text-gray-900 dark:text-white dark:text-white">
                                      {shift ? shift.name : 'Custom'}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                      {shift ? 
                                        `${shift.startTime} - ${shift.endTime}` :
                                        `${scheduleEntry.customStartTime} - ${scheduleEntry.customEndTime}`
                                      }
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {shift ? 
                                        calculateShiftHours(shift.startTime, shift.endTime, shift.breakDuration) :
                                        calculateShiftHours(scheduleEntry.customStartTime!, scheduleEntry.customEndTime!, scheduleEntry.customBreakDuration)
                                      }h
                                    </div>
                                    <span className={`inline-block px-1 py-0.5 rounded text-xs font-medium mt-1 ${getStatusColor(scheduleEntry.status)}`}>
                                      {scheduleEntry.status}
                                    </span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setNewScheduleEntry({
                                        ...newScheduleEntry,
                                        employeeId: employee.id,
                                        date: date.toISOString().split('T')[0]
                                      });
                                      setShowScheduleEntry(true);
                                    }}
                                    className="w-full h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors flex items-center justify-center"
                                  >
                                    <Plus className="h-4 w-4 text-gray-400" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weekly Summary */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Weekly Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-indigo-600">
                        {scheduleEntries.filter(entry => {
                          const entryDate = new Date(entry.date);
                          return weekDates.some(date => 
                            date.toDateString() === entryDate.toDateString()
                          );
                        }).length}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Scheduled Shifts</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {scheduleEntries.filter(entry => {
                          const entryDate = new Date(entry.date);
                          const isThisWeek = weekDates.some(date => 
                            date.toDateString() === entryDate.toDateString()
                          );
                          return isThisWeek && entry.status === 'confirmed';
                        }).length}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Confirmed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {Math.round(scheduleEntries
                          .filter(entry => {
                            const entryDate = new Date(entry.date);
                            return weekDates.some(date => 
                              date.toDateString() === entryDate.toDateString()
                            );
                          })
                          .reduce((total, entry) => {
                            const shift = entry.shiftId ? getShiftDetails(entry.shiftId) : null;
                            if (shift) {
                              return total + calculateShiftHours(shift.startTime, shift.endTime, shift.breakDuration);
                            } else if (entry.customStartTime && entry.customEndTime) {
                              return total + calculateShiftHours(entry.customStartTime, entry.customEndTime, entry.customBreakDuration || 0);
                            }
                            return total;
                          }, 0)
                        )}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Hours</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {filteredEmployees.length}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Team Members</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Shift Templates Tab */}
            {activeTab === 'shifts' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Shift Templates</h3>
                  <button
                    onClick={() => {
                      setEditingShift({
                        id: 'new',
                        name: '',
                        startTime: '09:00',
                        endTime: '17:00',
                        breakDuration: 60,
                        isDefault: false,
                        color: 'bg-blue-500',
                        description: ''
                      });
                      setShowShiftEditor(true);
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Shift
                  </button>
                </div>

                <div className="grid gap-6">
                  {shifts.map((shift) => (
                    <div key={shift.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className={`w-4 h-16 rounded ${shift.color}`}></div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">{shift.name}</h4>
                              {shift.isDefault && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                              <div>
                                <span className="font-medium">Start Time:</span> {shift.startTime}
                              </div>
                              <div>
                                <span className="font-medium">End Time:</span> {shift.endTime}
                              </div>
                              <div>
                                <span className="font-medium">Break:</span> {shift.breakDuration} min
                              </div>
                              <div>
                                <span className="font-medium">Total Hours:</span> {calculateShiftHours(shift.startTime, shift.endTime, shift.breakDuration)}h
                              </div>
                            </div>
                            {shift.description && (
                              <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300 text-sm">{shift.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingShift(shift);
                              setShowShiftEditor(true);
                            }}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              const newShift = { ...shift, id: Date.now().toString(), name: `${shift.name} (Copy)`, isDefault: false };
                              setShifts(prev => [...prev, newShift]);
                              setNotification({
                                type: 'success',
                                message: `Shift "${newShift.name}" created successfully`
                              });
                              setTimeout(() => setNotification(null), 3000);
                            }}
                            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
                          >
                            Copy
                          </button>
                          {!shift.isDefault && (
                            <button
                              onClick={() => {
                                setShifts(prev => prev.filter(s => s.id !== shift.id));
                                setNotification({
                                  type: 'info',
                                  message: `Shift "${shift.name}" deleted`
                                });
                                setTimeout(() => setNotification(null), 3000);
                              }}
                              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Schedule Analytics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 text-sm">Scheduled Hours</p>
                        <p className="text-3xl font-bold text-blue-700">156h</p>
                      </div>
                      <Clock className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 text-sm">Confirmation Rate</p>
                        <p className="text-3xl font-bold text-green-700">87%</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-600 text-sm">No-Show Rate</p>
                        <p className="text-3xl font-bold text-yellow-700">3%</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-yellow-500" />
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-600 text-sm">Coverage Rate</p>
                        <p className="text-3xl font-bold text-purple-700">95%</p>
                      </div>
                      <Target className="h-8 w-8 text-purple-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Shift Distribution</h4>
                  <div className="space-y-4">
                    {shifts.map(shift => {
                      const usageCount = scheduleEntries.filter(entry => entry.shiftId === shift.id).length;
                      const percentage = scheduleEntries.length > 0 ? (usageCount / scheduleEntries.length) * 100 : 0;
                      
                      return (
                        <div key={shift.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded ${shift.color}`}></div>
                            <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300">{shift.name}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${shift.color}`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 w-12">{usageCount} uses</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Shift Modal */}
      {showShiftEditor && editingShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">
                {editingShift.id === 'new' ? 'Create New Shift' : 'Edit Shift'}
              </h3>
              <button
                onClick={() => {
                  setShowShiftEditor(false);
                  setEditingShift(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Shift Name *</label>
                <input
                  type="text"
                  value={editingShift.name}
                  onChange={(e) => setEditingShift({ ...editingShift, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Morning Shift"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Start Time *</label>
                  <input
                    type="time"
                    value={editingShift.startTime}
                    onChange={(e) => setEditingShift({ ...editingShift, startTime: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">End Time *</label>
                  <input
                    type="time"
                    value={editingShift.endTime}
                    onChange={(e) => setEditingShift({ ...editingShift, endTime: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Break Duration (minutes)</label>
                <input
                  type="number"
                  value={editingShift.breakDuration}
                  onChange={(e) => setEditingShift({ ...editingShift, breakDuration: parseInt(e.target.value) || 0 })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  min="0"
                  max="480"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Color</label>
                <div className="flex space-x-3">
                  {[
                    'bg-blue-500',
                    'bg-green-500',
                    'bg-purple-500',
                    'bg-yellow-500',
                    'bg-orange-500',
                    'bg-red-500',
                    'bg-pink-500',
                    'bg-indigo-500'
                  ].map(color => (
                    <button
                      key={color}
                      onClick={() => setEditingShift({ ...editingShift, color })}
                      className={`w-8 h-8 rounded ${color} ${
                        editingShift.color === color ? 'ring-2 ring-gray-400' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={editingShift.description || ''}
                  onChange={(e) => setEditingShift({ ...editingShift, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={3}
                  placeholder="Optional description for this shift..."
                />
              </div>

              {/* Shift Preview */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white dark:text-white mb-2">Shift Preview</h4>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className={`w-4 h-4 rounded ${editingShift.color}`}></div>
                  <span><strong>Duration:</strong> {calculateShiftHours(editingShift.startTime, editingShift.endTime, editingShift.breakDuration)} hours</span>
                  <span><strong>Work Time:</strong> {calculateShiftHours(editingShift.startTime, editingShift.endTime, 0)} hours</span>
                  <span><strong>Break:</strong> {editingShift.breakDuration} minutes</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowShiftEditor(false);
                  setEditingShift(null);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateShift}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {editingShift.id === 'new' ? 'Create Shift' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Schedule Entry Modal */}
      {showScheduleEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">Add Schedule Entry</h3>
              <button
                onClick={() => setShowScheduleEntry(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Employee *</label>
                  <select
                    value={newScheduleEntry.employeeId}
                    onChange={(e) => setNewScheduleEntry({ ...newScheduleEntry, employeeId: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select Employee</option>
                    {hourlyEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} - {emp.role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Date *</label>
                  <input
                    type="date"
                    value={newScheduleEntry.date}
                    onChange={(e) => setNewScheduleEntry({ ...newScheduleEntry, date: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Shift Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Schedule Type</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Use Predefined Shift</label>
                    <select
                      value={newScheduleEntry.shiftId}
                      onChange={(e) => {
                        setNewScheduleEntry({ 
                          ...newScheduleEntry, 
                          shiftId: e.target.value,
                          customStartTime: '',
                          customEndTime: '',
                          customBreakDuration: 30
                        });
                      }}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select a shift template</option>
                      {shifts.map(shift => (
                        <option key={shift.id} value={shift.id}>
                          {shift.name} ({shift.startTime} - {shift.endTime})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="text-center text-gray-500 text-sm">OR</div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Custom Schedule</label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Start Time</label>
                        <input
                          type="time"
                          value={newScheduleEntry.customStartTime}
                          onChange={(e) => {
                            setNewScheduleEntry({ 
                              ...newScheduleEntry, 
                              customStartTime: e.target.value,
                              shiftId: ''
                            });
                          }}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">End Time</label>
                        <input
                          type="time"
                          value={newScheduleEntry.customEndTime}
                          onChange={(e) => {
                            setNewScheduleEntry({ 
                              ...newScheduleEntry, 
                              customEndTime: e.target.value,
                              shiftId: ''
                            });
                          }}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Break (min)</label>
                        <input
                          type="number"
                          value={newScheduleEntry.customBreakDuration}
                          onChange={(e) => setNewScheduleEntry({ ...newScheduleEntry, customBreakDuration: parseInt(e.target.value) || 0 })}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          min="0"
                          max="480"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Location</label>
                <select
                  value={newScheduleEntry.location}
                  onChange={(e) => setNewScheduleEntry({ ...newScheduleEntry, location: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="Main Office">Main Office</option>
                  <option value="San Francisco Office">San Francisco Office</option>
                  <option value="Austin Office">Austin Office</option>
                  <option value="Amherst Office">Amherst Office</option>
                  <option value="Remote">Remote</option>
                  <option value="Client Site">Client Site</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Notes</label>
                <textarea
                  value={newScheduleEntry.notes}
                  onChange={(e) => setNewScheduleEntry({ ...newScheduleEntry, notes: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={3}
                  placeholder="Optional notes about this schedule entry..."
                />
              </div>

              {/* Schedule Preview */}
              {(newScheduleEntry.shiftId || (newScheduleEntry.customStartTime && newScheduleEntry.customEndTime)) && (
                <div className="bg-indigo-50 rounded-lg p-4">
                  <h4 className="font-medium text-indigo-900 mb-2">Schedule Preview</h4>
                  {newScheduleEntry.shiftId ? (
                    (() => {
                      const shift = getShiftDetails(newScheduleEntry.shiftId);
                      return shift ? (
                        <div className="text-sm text-indigo-800">
                          <p><strong>Shift:</strong> {shift.name}</p>
                          <p><strong>Time:</strong> {shift.startTime} - {shift.endTime}</p>
                          <p><strong>Break:</strong> {shift.breakDuration} minutes</p>
                          <p><strong>Total Hours:</strong> {calculateShiftHours(shift.startTime, shift.endTime, shift.breakDuration)} hours</p>
                        </div>
                      ) : null;
                    })()
                  ) : (
                    <div className="text-sm text-indigo-800">
                      <p><strong>Custom Schedule</strong></p>
                      <p><strong>Time:</strong> {newScheduleEntry.customStartTime} - {newScheduleEntry.customEndTime}</p>
                      <p><strong>Break:</strong> {newScheduleEntry.customBreakDuration} minutes</p>
                      <p><strong>Total Hours:</strong> {calculateShiftHours(newScheduleEntry.customStartTime, newScheduleEntry.customEndTime, newScheduleEntry.customBreakDuration)} hours</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowScheduleEntry(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateScheduleEntry}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add to Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-70 flex items-center text-white ${
          notification.type === 'success' ? 'bg-green-600' :
          notification.type === 'error' ? 'bg-red-600' :
          notification.type === 'warning' ? 'bg-yellow-600' :
          'bg-blue-600'
        }`}>
          <div className={`rounded-full p-1 mr-3 ${
            notification.type === 'success' ? 'bg-green-500' :
            notification.type === 'error' ? 'bg-red-500' :
            notification.type === 'warning' ? 'bg-yellow-500' :
            'bg-blue-500'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : notification.type === 'error' ? (
              <X className="h-4 w-4" />
            ) : notification.type === 'warning' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
          </div>
          <span>{notification.message}</span>
          <button 
            onClick={() => setNotification(null)} 
            className="ml-3 opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
};

export default ScheduleManagementModal;