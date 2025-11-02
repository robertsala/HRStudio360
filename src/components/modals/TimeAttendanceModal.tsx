import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, Square, Calendar, Users, TrendingUp, AlertTriangle, CheckCircle, X, Eye, Send, CreditCard as Edit3, Save, Filter, Search, Brain, Zap, MapPin, Coffee, Timer, Target, Award, Bell, Download } from 'lucide-react';
import TimeTrackingModal from './TimeTrackingModal';
import ManagerTimesheetApprovalModal from './ManagerTimesheetApprovalModal';
import ScheduleManagementModal from './ScheduleManagementModal';
import EmployeeScheduleViewModal from './EmployeeScheduleViewModal';
import { useAuth } from '../../contexts/AuthContext';

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

interface CurrentStatus {
  employeeId: string;
  employeeName: string;
  isClockedIn: boolean;
  lastClockIn?: string;
  isOnBreak: boolean;
  todayHours: number;
}

interface TimeAttendanceModalProps {
  onClose?: () => void;
}

const TimeAttendanceModal: React.FC<TimeAttendanceModalProps> = ({ onClose }) => {
  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  const { user } = useAuth();
  const [userRole, setUserRole] = useState<'employee' | 'manager'>('employee');
  const [activeView, setActiveView] = useState<'timeTracking' | 'schedule'>('timeTracking');

  // Determine user role based on email or other criteria
  useEffect(() => {
    if (user?.email?.includes('manager') || user?.email?.includes('sarah.johnson') || user?.email?.includes('mike.chen')) {
      setUserRole('manager');
    } else {
      setUserRole('employee');
    }
  }, [user]);

  // Render appropriate interface based on user role and active view
  if (userRole === 'manager') {
    return (
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-auto">
        {/* Tab Navigation for Managers */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveView('timeTracking')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeView === 'timeTracking'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Timesheet Approvals
            </button>
            <button
              onClick={() => setActiveView('schedule')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeView === 'schedule'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Schedule Management
            </button>
          </nav>
        </div>
        
        {/* Content based on active view */}
        {activeView === 'timeTracking' ? (
          <ManagerTimesheetApprovalModal />
        ) : (
          <ScheduleManagementModal />
        )}
      </div>
    );
  }

  // Employee view with tabs for time tracking and schedule
  return (
    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-auto">
      {/* Tab Navigation for Employees */}
      <div className="border-b">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveView('timeTracking')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeView === 'timeTracking'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Time Clock
          </button>
          <button
            onClick={() => setActiveView('schedule')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeView === 'schedule'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Schedule
          </button>
        </nav>
      </div>
      
      {/* Content based on active view */}
      {activeView === 'timeTracking' ? (
        <TimeTrackingModal />
      ) : (
        <EmployeeScheduleViewModal 
          employeeId={user?.email || 'current-user'}
          employeeName={user?.name || 'Current User'}
        />
      )}
    </div>
  );
};

export default TimeAttendanceModal;