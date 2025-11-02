import React, { useState } from 'react';
import { Calendar, Clock, MapPin, CheckCircle, X, AlertTriangle, Bell, Eye, User, Building, Phone, Mail } from 'lucide-react';

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
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
}

interface EmployeeScheduleViewModalProps {
  employeeId?: string;
  employeeName?: string;
}

const EmployeeScheduleViewModal: React.FC<EmployeeScheduleViewModalProps> = ({ 
  employeeId = 'emp-001', 
  employeeName = 'Current User' 
}) => {
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);

  // Mock shifts data (should match ScheduleManagementModal)
  const shifts: Shift[] = [
    {
      id: '1',
      name: 'Morning Shift',
      startTime: '08:00',
      endTime: '16:00',
      breakDuration: 60,
      color: 'bg-blue-500',
      description: 'Standard morning shift with 1-hour lunch break'
    },
    {
      id: '2',
      name: 'Afternoon Shift',
      startTime: '12:00',
      endTime: '20:00',
      breakDuration: 60,
      color: 'bg-green-500',
      description: 'Afternoon shift with 1-hour dinner break'
    },
    {
      id: '3',
      name: 'Evening Shift',
      startTime: '16:00',
      endTime: '00:00',
      breakDuration: 30,
      color: 'bg-purple-500',
      description: 'Evening shift with 30-minute break'
    },
    {
      id: '4',
      name: 'Part-Time Morning',
      startTime: '09:00',
      endTime: '13:00',
      breakDuration: 0,
      color: 'bg-yellow-500',
      description: '4-hour part-time morning shift'
    }
  ];

  // Mock schedule entries for current user
  const [mySchedule, setMySchedule] = useState<ScheduleEntry[]>([
    {
      id: 'sch-1',
      employeeId: employeeId,
      employeeName: employeeName,
      date: '2025-01-20',
      shiftId: '1',
      location: 'San Francisco Office',
      status: 'scheduled',
      createdBy: 'Sarah Johnson',
      createdDate: '2025-01-15'
    },
    {
      id: 'sch-2',
      employeeId: employeeId,
      employeeName: employeeName,
      date: '2025-01-21',
      shiftId: '1',
      location: 'San Francisco Office',
      status: 'confirmed',
      createdBy: 'Sarah Johnson',
      createdDate: '2025-01-15'
    },
    {
      id: 'sch-3',
      employeeId: employeeId,
      employeeName: employeeName,
      date: '2025-01-22',
      customStartTime: '10:00',
      customEndTime: '14:00',
      customBreakDuration: 30,
      location: 'Remote',
      status: 'scheduled',
      createdBy: 'Sarah Johnson',
      createdDate: '2025-01-15',
      notes: 'Remote work day - client meeting at 11 AM'
    },
    {
      id: 'sch-4',
      employeeId: employeeId,
      employeeName: employeeName,
      date: '2025-01-23',
      shiftId: '1',
      location: 'San Francisco Office',
      status: 'scheduled',
      createdBy: 'Sarah Johnson',
      createdDate: '2025-01-15'
    },
    {
      id: 'sch-5',
      employeeId: employeeId,
      employeeName: employeeName,
      date: '2025-01-24',
      shiftId: '1',
      location: 'San Francisco Office',
      status: 'scheduled',
      createdBy: 'Sarah Johnson',
      createdDate: '2025-01-15'
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

  const getScheduleForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return mySchedule.find(entry => entry.date === dateString);
  };

  const handleConfirmSchedule = (entryId: string) => {
    setMySchedule(prev => prev.map(entry => 
      entry.id === entryId 
        ? { ...entry, status: 'confirmed' as const }
        : entry
    ));

    const entry = mySchedule.find(e => e.id === entryId);
    setNotification({
      type: 'success',
      message: `Schedule confirmed for ${entry ? new Date(entry.date).toLocaleDateString() : 'selected date'}`
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRequestChange = (entryId: string) => {
    const entry = mySchedule.find(e => e.id === entryId);
    if (!entry) return;

    // In a real app, this would open a change request modal
    console.log('Requesting schedule change for:', entry);
    
    setNotification({
      type: 'info',
      message: 'Schedule change request sent to your manager for approval'
    });
    setTimeout(() => setNotification(null), 3000);
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

  const weekDates = getWeekDates(selectedWeek);
  const weekSchedule = mySchedule.filter(entry => {
    const entryDate = new Date(entry.date);
    return weekDates.some(date => date.toDateString() === entryDate.toDateString());
  });

  const totalScheduledHours = weekSchedule.reduce((total, entry) => {
    const shift = entry.shiftId ? getShiftDetails(entry.shiftId) : null;
    if (shift) {
      return total + calculateShiftHours(shift.startTime, shift.endTime, shift.breakDuration);
    } else if (entry.customStartTime && entry.customEndTime) {
      return total + calculateShiftHours(entry.customStartTime, entry.customEndTime, entry.customBreakDuration || 0);
    }
    return total;
  }, 0);

  return (
    <>
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">My Schedule</h2>
              <p className="text-blue-100">View your work schedule and confirm availability</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-blue-100 text-sm">This Week</p>
              <p className="text-xl font-bold">{Math.round(totalScheduledHours)}h scheduled</p>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto max-h-96">
          <div className="p-6">
            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-6">
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
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {weekSchedule.filter(entry => entry.status === 'confirmed').length} of {weekSchedule.length} confirmed
                </span>
              </div>
            </div>

            {/* Weekly Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm">Scheduled Hours</p>
                    <p className="text-2xl font-bold text-blue-700">{Math.round(totalScheduledHours)}h</p>
                  </div>
                  <Clock className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm">Confirmed</p>
                    <p className="text-2xl font-bold text-green-700">
                      {weekSchedule.filter(entry => entry.status === 'confirmed').length}
                    </p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm">Days Scheduled</p>
                    <p className="text-2xl font-bold text-purple-700">{weekSchedule.length}</p>
                  </div>
                  <Calendar className="h-6 w-6 text-purple-500" />
                </div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-600 text-sm">Pending</p>
                    <p className="text-2xl font-bold text-yellow-700">
                      {weekSchedule.filter(entry => entry.status === 'scheduled').length}
                    </p>
                  </div>
                  <AlertTriangle className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </div>

            {/* Calendar View */}
            <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-900 px-6 py-3 border-b">
                <div className="grid grid-cols-7 gap-4 text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                    <div key={day} className="text-center">{day}</div>
                  ))}
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-7 gap-4">
                  {weekDates.map((date, index) => {
                    const scheduleEntry = getScheduleForDate(date);
                    const shift = scheduleEntry?.shiftId ? getShiftDetails(scheduleEntry.shiftId) : null;
                    const isToday = date.toDateString() === new Date().toDateString();
                    
                    return (
                      <div key={index} className={`min-h-[140px] border-2 rounded-lg p-3 ${
                        isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}>
                        <div className="text-center mb-3">
                          <p className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                            {date.getDate()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {date.toLocaleDateString('en-US', { month: 'short' })}
                          </p>
                          {isToday && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              Today
                            </span>
                          )}
                        </div>
                        
                        {scheduleEntry ? (
                          <div className="space-y-2">
                            <div className={`p-2 rounded-lg ${
                              shift ? shift.color.replace('500', '100') : 'bg-gray-100'
                            }`}>
                              <div className="text-xs font-medium text-gray-900 dark:text-white dark:text-white text-center">
                                {shift ? shift.name : 'Custom'}
                              </div>
                              <div className="text-xs text-gray-700 dark:text-gray-300 dark:text-gray-300 text-center">
                                {shift ? 
                                  `${shift.startTime} - ${shift.endTime}` :
                                  `${scheduleEntry.customStartTime} - ${scheduleEntry.customEndTime}`
                                }
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
                                {shift ? 
                                  calculateShiftHours(shift.startTime, shift.endTime, shift.breakDuration) :
                                  calculateShiftHours(scheduleEntry.customStartTime!, scheduleEntry.customEndTime!, scheduleEntry.customBreakDuration || 0)
                                }h
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-center">
                              <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                              <span className="text-xs text-gray-600 dark:text-gray-400">{scheduleEntry.location}</span>
                            </div>
                            
                            <div className="text-center">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(scheduleEntry.status)}`}>
                                {scheduleEntry.status}
                              </span>
                            </div>
                            
                            {scheduleEntry.status === 'scheduled' && (
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleConfirmSchedule(scheduleEntry.id)}
                                  className="flex-1 bg-green-600 text-white text-xs py-1 rounded hover:bg-green-700 transition-colors"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedEntry(scheduleEntry);
                                    setShowConfirmation(true);
                                  }}
                                  className="flex-1 bg-yellow-600 text-white text-xs py-1 rounded hover:bg-yellow-700 transition-colors"
                                >
                                  Request Change
                                </button>
                              </div>
                            )}
                            
                            {scheduleEntry.notes && (
                              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded p-2">
                                <p className="text-xs text-yellow-800">{scheduleEntry.notes}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center text-gray-400 text-xs h-full flex items-center justify-center">
                            No schedule
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Schedule Summary */}
            <div className="mt-6 bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Weekly Schedule Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h5 className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Total Scheduled Hours</h5>
                  <p className="text-2xl font-bold text-indigo-600">{Math.round(totalScheduledHours)}h</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Across {weekSchedule.length} days</p>
                </div>
                <div>
                  <h5 className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Confirmation Status</h5>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Confirmed:</span>
                      <span className="font-medium text-green-600">
                        {weekSchedule.filter(entry => entry.status === 'confirmed').length} days
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Pending:</span>
                      <span className="font-medium text-yellow-600">
                        {weekSchedule.filter(entry => entry.status === 'scheduled').length} days
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">Locations</h5>
                  <div className="space-y-1">
                    {Array.from(new Set(weekSchedule.map(entry => entry.location))).map(location => (
                      <div key={location} className="flex items-center text-sm">
                        <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                        <span className="text-gray-600 dark:text-gray-400">{location}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-center space-x-4">
              <button
                onClick={() => {
                  const unconfirmedEntries = weekSchedule.filter(entry => entry.status === 'scheduled');
                  unconfirmedEntries.forEach(entry => handleConfirmSchedule(entry.id));
                }}
                disabled={weekSchedule.filter(entry => entry.status === 'scheduled').length === 0}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Confirm All Pending
              </button>
              <button
                onClick={() => {
                  console.log('Downloading schedule for:', employeeName);
                  setNotification({
                    type: 'info',
                    message: 'Schedule downloaded successfully'
                  });
                  setTimeout(() => setNotification(null), 3000);
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Eye className="h-5 w-5 mr-2" />
                Download Schedule
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Change Request Modal */}
      {showConfirmation && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">Request Schedule Change</h3>
              <button
                onClick={() => setShowConfirmation(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Current Schedule</h4>
                <div className="text-sm text-blue-800">
                  <p><strong>Date:</strong> {new Date(selectedEntry.date).toLocaleDateString()}</p>
                  {selectedEntry.shiftId ? (
                    (() => {
                      const shift = getShiftDetails(selectedEntry.shiftId);
                      return shift ? (
                        <>
                          <p><strong>Shift:</strong> {shift.name}</p>
                          <p><strong>Time:</strong> {shift.startTime} - {shift.endTime}</p>
                        </>
                      ) : null;
                    })()
                  ) : (
                    <p><strong>Time:</strong> {selectedEntry.customStartTime} - {selectedEntry.customEndTime}</p>
                  )}
                  <p><strong>Location:</strong> {selectedEntry.location}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  Reason for Change Request
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Please explain why you need to change this schedule..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleRequestChange(selectedEntry.id);
                  setShowConfirmation(false);
                }}
                className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Submit Request
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

export default EmployeeScheduleViewModal;