import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, Square, Calendar, Users, TrendingUp, AlertTriangle, CheckCircle, X, Eye, Send, CreditCard as Edit3, Save, Filter, Search, Brain, Zap, MapPin, Coffee, Timer, Target, Award, Bell, Download } from 'lucide-react';
import AIAssistantModal from './AIAssistantModal';

interface TimeEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  breakHours: number;
  status: 'active' | 'completed' | 'pending_approval' | 'approved' | 'rejected';
  location?: string;
  notes?: string;
  department: string;
  role: string;
}

interface Timesheet {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  weekStartDate: string;
  weekEndDate: string;
  entries: TimeEntry[];
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalBreakHours: number;
  expectedHours: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'processed';
  submittedDate?: string;
  approvedDate?: string;
  approvedBy?: string;
  rejectionReason?: string;
  managerNotes?: string;
}

interface AIInsight {
  type: 'warning' | 'error' | 'suggestion' | 'compliance';
  title: string;
  message: string;
  action?: string;
  severity: 'low' | 'medium' | 'high';
}

const TimeTrackingModal: React.FC = () => {
  const [activeTab, setActiveTab] = useState('clock');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClocked, setIsClocked] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [todayEntry, setTodayEntry] = useState<TimeEntry | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null);
  const [showTimesheetDetail, setShowTimesheetDetail] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);

  // Mock current user data
  const currentUser = {
    id: 'emp-001',
    name: 'Current User',
    department: 'Engineering',
    role: 'Software Engineer',
    isHourly: true,
    manager: 'Sarah Johnson'
  };

  // Mock time entries for the current week
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([
    {
      id: '1',
      employeeId: 'emp-001',
      employeeName: 'Current User',
      date: '2025-01-20',
      clockIn: '09:00',
      clockOut: '17:30',
      breakStart: '12:00',
      breakEnd: '13:00',
      totalHours: 7.5,
      regularHours: 7.5,
      overtimeHours: 0,
      breakHours: 1,
      status: 'completed',
      department: 'Engineering',
      role: 'Software Engineer'
    },
    {
      id: '2',
      employeeId: 'emp-001',
      employeeName: 'Current User',
      date: '2025-01-21',
      clockIn: '08:45',
      clockOut: '18:15',
      breakStart: '12:30',
      breakEnd: '13:30',
      totalHours: 8.5,
      regularHours: 8,
      overtimeHours: 0.5,
      breakHours: 1,
      status: 'completed',
      department: 'Engineering',
      role: 'Software Engineer'
    }
  ]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Generate AI insights based on time entries
  useEffect(() => {
    generateAIInsights();
  }, [timeEntries]);

  const generateAIInsights = () => {
    const insights: AIInsight[] = [];
    
    // Check for overtime patterns
    const overtimeEntries = timeEntries.filter(entry => entry.overtimeHours > 0);
    if (overtimeEntries.length > 2) {
      insights.push({
        type: 'warning',
        title: 'Overtime Pattern Detected',
        message: 'You\'ve worked overtime 3+ times this week. Consider workload adjustment.',
        action: 'Discuss with manager',
        severity: 'medium'
      });
    }

    // Check for missing clock-outs
    const activeEntries = timeEntries.filter(entry => entry.status === 'active');
    if (activeEntries.length > 0) {
      insights.push({
        type: 'error',
        title: 'Missing Clock-Out',
        message: 'You have an active time entry without a clock-out time.',
        action: 'Clock out now',
        severity: 'high'
      });
    }

    // Check for short break periods
    const shortBreaks = timeEntries.filter(entry => entry.breakHours < 0.5);
    if (shortBreaks.length > 0) {
      insights.push({
        type: 'suggestion',
        title: 'Break Time Recommendation',
        message: 'Consider taking longer breaks to maintain productivity.',
        action: 'Schedule proper breaks',
        severity: 'low'
      });
    }

    setAiInsights(insights);
  };

  const handleClockIn = () => {
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5);
    
    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      date: now.toISOString().split('T')[0],
      clockIn: timeString,
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      breakHours: 0,
      status: 'active',
      location: 'Office', // Could be GPS-based
      department: currentUser.department,
      role: currentUser.role
    };

    setTimeEntries(prev => [...prev, newEntry]);
    setTodayEntry(newEntry);
    setIsClocked(true);
    
    setNotification({
      type: 'success',
      message: `Clocked in at ${timeString}. Have a productive day!`
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleClockOut = () => {
    if (!todayEntry) return;
    
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5);
    
    // Calculate hours worked
    const clockInTime = new Date(`2025-01-01 ${todayEntry.clockIn}`);
    const clockOutTime = new Date(`2025-01-01 ${timeString}`);
    const totalMinutes = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60);
    const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
    
    const regularHours = Math.min(totalHours, 8);
    const overtimeHours = Math.max(totalHours - 8, 0);

    const updatedEntry: TimeEntry = {
      ...todayEntry,
      clockOut: timeString,
      totalHours,
      regularHours,
      overtimeHours,
      status: 'completed'
    };

    setTimeEntries(prev => prev.map(entry => 
      entry.id === todayEntry.id ? updatedEntry : entry
    ));
    setTodayEntry(null);
    setIsClocked(false);
    setOnBreak(false);
    
    setNotification({
      type: 'success',
      message: `Clocked out at ${timeString}. Total hours: ${totalHours}`
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleBreakStart = () => {
    if (!todayEntry) return;
    
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5);
    
    const updatedEntry = {
      ...todayEntry,
      breakStart: timeString
    };
    
    setTimeEntries(prev => prev.map(entry => 
      entry.id === todayEntry.id ? updatedEntry : entry
    ));
    setTodayEntry(updatedEntry);
    setOnBreak(true);
    
    setNotification({
      type: 'info',
      message: `Break started at ${timeString}. Enjoy your break!`
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleBreakEnd = () => {
    if (!todayEntry || !todayEntry.breakStart) return;
    
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5);
    
    // Calculate break duration
    const breakStartTime = new Date(`2025-01-01 ${todayEntry.breakStart}`);
    const breakEndTime = new Date(`2025-01-01 ${timeString}`);
    const breakMinutes = (breakEndTime.getTime() - breakStartTime.getTime()) / (1000 * 60);
    const breakHours = Math.round((breakMinutes / 60) * 100) / 100;
    
    const updatedEntry = {
      ...todayEntry,
      breakEnd: timeString,
      breakHours
    };
    
    setTimeEntries(prev => prev.map(entry => 
      entry.id === todayEntry.id ? updatedEntry : entry
    ));
    setTodayEntry(updatedEntry);
    setOnBreak(false);
    
    setNotification({
      type: 'info',
      message: `Break ended at ${timeString}. Break duration: ${breakHours} hours`
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const getCurrentWeekEntries = () => {
    const weekStart = new Date(selectedWeek);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    return timeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= weekStart && entryDate <= weekEnd;
    });
  };

  const getWeekTotals = () => {
    const weekEntries = getCurrentWeekEntries();
    const totalRegular = weekEntries.reduce((sum, entry) => sum + entry.regularHours, 0);
    const totalOvertime = weekEntries.reduce((sum, entry) => sum + entry.overtimeHours, 0);
    const totalBreak = weekEntries.reduce((sum, entry) => sum + entry.breakHours, 0);
    
    return {
      regular: Math.round(totalRegular * 100) / 100,
      overtime: Math.round(totalOvertime * 100) / 100,
      break: Math.round(totalBreak * 100) / 100,
      total: Math.round((totalRegular + totalOvertime) * 100) / 100
    };
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'suggestion': return <Brain className="h-4 w-4 text-blue-600" />;
      case 'compliance': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Brain className="h-4 w-4 text-purple-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'error': return 'border-l-red-500 bg-red-50';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50';
      case 'suggestion': return 'border-l-blue-500 bg-blue-50';
      case 'compliance': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-purple-500 bg-purple-50';
    }
  };

  const weekTotals = getWeekTotals();
  const todayHours = timeEntries
    .filter(entry => entry.date === new Date().toISOString().split('T')[0])
    .reduce((sum, entry) => sum + entry.totalHours, 0);

  const tabs = [
    { id: 'clock', label: 'Time Clock', icon: Clock },
    { id: 'timesheet', label: 'My Timesheet', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  return (
    <>
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
          <div className="flex items-center">
            <Clock className="h-8 w-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">Time Tracking</h2>
              <p className="text-blue-100">Track your work hours and manage timesheets</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-blue-100 text-sm">Current Time</p>
              <p className="text-xl font-bold">{formatTime(currentTime)}</p>
            </div>
            <button
              onClick={() => setShowAIAssistant(true)}
              className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white dark:bg-gray-800 dark:bg-gray-800/30 transition-colors flex items-center"
            >
              <Brain className="h-4 w-4 mr-2" />
              AI Help
            </button>
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
                      ? 'border-blue-500 text-blue-600'
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
            {/* Time Clock Tab */}
            {activeTab === 'clock' && (
              <div className="space-y-6">
                {/* Current Status Card */}
                <div className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold">Time Clock</h3>
                      <p className="text-blue-100">
                        Status: {isClocked ? (onBreak ? 'On Break' : 'Clocked In') : 'Clocked Out'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-100 text-sm">Today's Hours</p>
                      <p className="text-3xl font-bold">{todayHours.toFixed(1)}h</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                      onClick={isClocked ? handleClockOut : handleClockIn}
                      className={`flex items-center justify-center py-4 px-6 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                        isClocked 
                          ? 'bg-red-500 hover:bg-red-600 text-white' 
                          : 'bg-white text-blue-600 hover:bg-gray-100'
                      }`}
                    >
                      {isClocked ? <Square className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
                      {isClocked ? 'Clock Out' : 'Clock In'}
                    </button>
                    
                    <button
                      onClick={onBreak ? handleBreakEnd : handleBreakStart}
                      disabled={!isClocked}
                      className="flex items-center justify-center py-4 px-6 bg-white/20 hover:bg-white dark:bg-gray-800 dark:bg-gray-800/30 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {onBreak ? <Play className="h-5 w-5 mr-2" /> : <Pause className="h-5 w-5 mr-2" />}
                      {onBreak ? 'End Break' : 'Start Break'}
                    </button>
                    
                    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800/20 rounded-lg p-4 text-center">
                      <Coffee className="h-5 w-5 mx-auto mb-1" />
                      <p className="text-sm">Break Time</p>
                      <p className="font-bold">{timeEntries.reduce((sum, entry) => sum + entry.breakHours, 0).toFixed(1)}h</p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800/20 rounded-lg p-4 text-center">
                      <Timer className="h-5 w-5 mx-auto mb-1" />
                      <p className="text-sm">This Week</p>
                      <p className="font-bold">{weekTotals.total}h</p>
                    </div>
                  </div>
                </div>

                {/* Today's Timeline */}
                <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Today's Timeline</h4>
                  <div className="space-y-3">
                    {timeEntries
                      .filter(entry => entry.date === new Date().toISOString().split('T')[0])
                      .map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-full ${
                              entry.status === 'active' ? 'bg-green-100' : 'bg-blue-100'
                            }`}>
                              <Clock className={`h-4 w-4 ${
                                entry.status === 'active' ? 'text-green-600' : 'text-blue-600'
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white dark:text-white">
                                {entry.clockIn} - {entry.clockOut || 'Active'}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {entry.breakStart && entry.breakEnd && 
                                  `Break: ${entry.breakStart} - ${entry.breakEnd}`
                                }
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900 dark:text-white dark:text-white">{entry.totalHours.toFixed(1)}h</p>
                            {entry.overtimeHours > 0 && (
                              <p className="text-sm text-orange-600">+{entry.overtimeHours.toFixed(1)}h OT</p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* AI Insights */}
                {aiInsights.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white flex items-center">
                        <Brain className="h-5 w-5 mr-2 text-purple-500" />
                        AI Insights
                      </h4>
                      <button
                        onClick={() => setShowAIAssistant(true)}
                        className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                      >
                        Ask Studio AI →
                      </button>
                    </div>
                    <div className="space-y-3">
                      {aiInsights.map((insight, index) => (
                        <div key={index} className={`border-l-4 rounded-lg p-4 ${getInsightColor(insight.type)}`}>
                          <div className="flex items-start space-x-3">
                            {getInsightIcon(insight.type)}
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 dark:text-white dark:text-white">{insight.title}</h5>
                              <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300 text-sm mt-1">{insight.message}</p>
                              {insight.action && (
                                <button className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                                  {insight.action} →
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Timesheet Tab */}
            {activeTab === 'timesheet' && (
              <div className="space-y-6">
                {/* Week Navigation */}
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">My Timesheet</h3>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => {
                        const prevWeek = new Date(selectedWeek);
                        prevWeek.setDate(prevWeek.getDate() - 7);
                        setSelectedWeek(prevWeek);
                      }}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
                    >
                      ←
                    </button>
                    <span className="font-medium text-gray-900 dark:text-white dark:text-white">
                      Week of {selectedWeek.toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => {
                        const nextWeek = new Date(selectedWeek);
                        nextWeek.setDate(nextWeek.getDate() + 7);
                        setSelectedWeek(nextWeek);
                      }}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
                    >
                      →
                    </button>
                  </div>
                </div>

                {/* Week Summary */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 text-sm">Expected</p>
                        <p className="text-2xl font-bold text-blue-700">40h</p>
                      </div>
                      <Target className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 text-sm">Worked</p>
                        <p className="text-2xl font-bold text-green-700">{weekTotals.total}h</p>
                      </div>
                      <Clock className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-600 text-sm">Overtime</p>
                        <p className="text-2xl font-bold text-orange-700">{weekTotals.overtime}h</p>
                      </div>
                      <TrendingUp className="h-6 w-6 text-orange-500" />
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-600 text-sm">Break</p>
                        <p className="text-2xl font-bold text-purple-700">{weekTotals.break}h</p>
                      </div>
                      <Coffee className="h-6 w-6 text-purple-500" />
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Remaining</p>
                        <p className="text-2xl font-bold text-gray-700 dark:text-gray-300 dark:text-gray-300">{Math.max(40 - weekTotals.total, 0).toFixed(1)}h</p>
                      </div>
                      <Timer className="h-6 w-6 text-gray-500" />
                    </div>
                  </div>
                </div>

                {/* Calendar View */}
                <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-900 px-6 py-3 border-b">
                    <div className="grid grid-cols-7 gap-4 text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <div key={day} className="text-center">{day}</div>
                      ))}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-7 gap-4">
                      {Array.from({ length: 7 }, (_, i) => {
                        const date = new Date(selectedWeek);
                        date.setDate(date.getDate() - date.getDay() + i);
                        const dateString = date.toISOString().split('T')[0];
                        const dayEntry = timeEntries.find(entry => entry.date === dateString);
                        
                        return (
                          <div key={i} className="min-h-[120px] border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg p-3">
                            <div className="text-center mb-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-white dark:text-white">{date.getDate()}</p>
                              <p className="text-xs text-gray-500">{date.toLocaleDateString('en-US', { month: 'short' })}</p>
                            </div>
                            
                            {dayEntry ? (
                              <div className="space-y-1">
                                <div className={`text-xs px-2 py-1 rounded text-center ${
                                  dayEntry.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  dayEntry.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                                  dayEntry.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {dayEntry.totalHours.toFixed(1)}h
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
                                  {dayEntry.clockIn} - {dayEntry.clockOut || 'Active'}
                                </div>
                                {dayEntry.overtimeHours > 0 && (
                                  <div className="text-xs text-orange-600 text-center">
                                    +{dayEntry.overtimeHours.toFixed(1)}h OT
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center text-gray-400 text-xs">
                                No hours
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Submit for Approval */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-yellow-900">Ready for Approval</h4>
                      <p className="text-yellow-800 text-sm">
                        Submit your timesheet to {currentUser.manager} for approval
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setNotification({
                          type: 'success',
                          message: 'Timesheet submitted for approval!'
                        });
                        setTimeout(() => setNotification(null), 3000);
                      }}
                      className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Submit for Approval
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Time Analytics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                    <h4 className="font-semibold text-blue-900 mb-2">Average Daily Hours</h4>
                    <p className="text-3xl font-bold text-blue-600">7.8h</p>
                    <p className="text-blue-700 text-sm">This month</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                    <h4 className="font-semibold text-green-900 mb-2">Attendance Rate</h4>
                    <p className="text-3xl font-bold text-green-600">96%</p>
                    <p className="text-green-700 text-sm">On-time clock-ins</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
                    <h4 className="font-semibold text-purple-900 mb-2">Productivity Score</h4>
                    <p className="text-3xl font-bold text-purple-600">4.2/5</p>
                    <p className="text-purple-700 text-sm">Based on hours worked</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-4">Weekly Trends</h4>
                  <div className="space-y-4">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, index) => {
                      const hours = [8.2, 7.8, 8.5, 8.0, 7.5][index];
                      const percentage = (hours / 8) * 100;
                      
                      return (
                        <div key={day} className="flex items-center justify-between">
                          <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300 w-12">{day}</span>
                          <div className="flex-1 mx-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">{hours}h</span>
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

      {/* AI Assistant Modal */}
      <AIAssistantModal
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
      />

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

export default TimeTrackingModal;