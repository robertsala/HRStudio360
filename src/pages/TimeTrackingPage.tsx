import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, Square, Calendar, Users, TrendingUp, AlertTriangle, CheckCircle, Eye, Send, Save, Filter, Search, Brain, Zap, MapPin, Coffee, Timer, Target, Award, Bell, Download } from 'lucide-react';
import AIAssistantModal from '../components/modals/AIAssistantModal';
import { useDashboardEscape } from '../hooks/useDashboardEscape';
import { DashboardExitButton } from '../components/DashboardExitButton';

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

const TimeTrackingPage: React.FC = () => {
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

  // ESC key handling - no nested modals in base implementation
  useDashboardEscape(() => {
    if (showAIAssistant) {
      setShowAIAssistant(false);
      return false;
    }
    if (showTimesheetDetail) {
      setShowTimesheetDetail(false);
      return false;
    }
    return true;
  });

  const currentUser = {
    id: 'emp-001',
    name: 'Current User',
    department: 'Engineering',
    role: 'Software Engineer',
    isHourly: true,
    manager: 'Sarah Johnson'
  };

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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    generateAIInsights();
  }, [timeEntries]);

  const generateAIInsights = () => {
    const insights: AIInsight[] = [];
    
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
      location: 'Office',
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
      case 'error': return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'suggestion': return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'compliance': return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      default: return 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/20';
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
    <div className="bg-white dark:bg-gray-800 rounded-lg w-full min-h-screen overflow-auto">
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
            className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors flex items-center"
            data-testid="button-ai-help"
          >
            <Brain className="h-4 w-4 mr-2" />
            AI Help
          </button>
          <DashboardExitButton className="text-blue-100 hover:text-white" />
        </div>
      </div>

      {notification && (
        <div className={`mx-6 mt-4 p-4 rounded-lg ${
          notification.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' :
          notification.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400' :
          notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400' :
          'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="overflow-y-auto">
        <div className="p-6">
          {activeTab === 'clock' && (
            <div className="space-y-6">
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
                    data-testid={isClocked ? 'button-clock-out' : 'button-clock-in'}
                  >
                    {isClocked ? <Square className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
                    {isClocked ? 'Clock Out' : 'Clock In'}
                  </button>
                  
                  <button
                    onClick={onBreak ? handleBreakEnd : handleBreakStart}
                    disabled={!isClocked}
                    className="flex items-center justify-center py-4 px-6 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid={onBreak ? 'button-end-break' : 'button-start-break'}
                  >
                    {onBreak ? <Play className="h-5 w-5 mr-2" /> : <Pause className="h-5 w-5 mr-2" />}
                    {onBreak ? 'End Break' : 'Start Break'}
                  </button>
                  
                  <div className="bg-white/20 rounded-lg p-4 text-center">
                    <Coffee className="h-5 w-5 mx-auto mb-1" />
                    <p className="text-sm">Break Time</p>
                    <p className="font-bold">{timeEntries.reduce((sum, entry) => sum + entry.breakHours, 0).toFixed(1)}h</p>
                  </div>
                  
                  <div className="bg-white/20 rounded-lg p-4 text-center">
                    <Timer className="h-5 w-5 mx-auto mb-1" />
                    <p className="text-sm">This Week</p>
                    <p className="font-bold">{weekTotals.total}h</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Today's Timeline</h4>
                <div className="space-y-3">
                  {timeEntries
                    .filter(entry => entry.date === new Date().toISOString().split('T')[0])
                    .map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-full ${
                            entry.status === 'active' ? 'bg-green-100 dark:bg-green-900/40' : 'bg-blue-100 dark:bg-blue-900/40'
                          }`}>
                            <Clock className={`h-4 w-4 ${
                              entry.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
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
                          <p className="font-bold text-gray-900 dark:text-white">{entry.totalHours.toFixed(1)}h</p>
                          {entry.overtimeHours > 0 && (
                            <p className="text-sm text-orange-600 dark:text-orange-400">+{entry.overtimeHours.toFixed(1)}h OT</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {aiInsights.length > 0 && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <Brain className="h-5 w-5 mr-2 text-purple-500" />
                      AI Insights
                    </h4>
                    <button
                      onClick={() => setShowAIAssistant(true)}
                      className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium"
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
                            <h5 className="font-medium text-gray-900 dark:text-white">{insight.title}</h5>
                            <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">{insight.message}</p>
                            {insight.action && (
                              <button className="mt-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
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

          {activeTab === 'timesheet' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">My Timesheet</h3>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      const prevWeek = new Date(selectedWeek);
                      prevWeek.setDate(prevWeek.getDate() - 7);
                      setSelectedWeek(prevWeek);
                    }}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    ←
                  </button>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Week of {selectedWeek.toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => {
                      const nextWeek = new Date(selectedWeek);
                      nextWeek.setDate(nextWeek.getDate() + 7);
                      setSelectedWeek(nextWeek);
                    }}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    →
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 dark:text-blue-400 text-sm">Expected</p>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">40h</p>
                    </div>
                    <Target className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 dark:text-green-400 text-sm">Worked</p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-400">{weekTotals.total}h</p>
                    </div>
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-600 dark:text-yellow-400 text-sm">Regular</p>
                      <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{weekTotals.regular}h</p>
                    </div>
                    <Clock className="h-6 w-6 text-yellow-500" />
                  </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 dark:text-orange-400 text-sm">Overtime</p>
                      <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{weekTotals.overtime}h</p>
                    </div>
                    <Zap className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 dark:text-purple-400 text-sm">Breaks</p>
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{weekTotals.break}h</p>
                    </div>
                    <Coffee className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
              </div>

              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Detailed timesheet view coming soon</p>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Analytics coming soon</p>
            </div>
          )}
        </div>
      </div>

      {showAIAssistant && (
        <AIAssistantModal
          isOpen={true}
          onClose={() => setShowAIAssistant(false)}
        />
      )}
    </div>
  );
};

export default TimeTrackingPage;
