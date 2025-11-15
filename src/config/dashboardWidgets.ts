/**
 * Dashboard Widget Registry
 * 
 * Central source of truth for all available dashboard widgets.
 * Defines widget metadata, role-based visibility, and display order.
 */

export type WidgetCategory = 'stats' | 'team' | 'analytics' | 'notifications' | 'quick-actions' | 'calendar' | 'ai';
export type UserRole = 'HR' | 'Manager' | 'Employee' | 'Product Owner';

export interface WidgetDefinition {
  widgetId: string;
  widgetName: string;
  widgetDescription: string;
  category: WidgetCategory;
  defaultVisibleForRoles: UserRole[];
  defaultDisplayOrder: number;
  isActive: boolean;
}

/**
 * Complete registry of all dashboard widgets
 * 
 * Display order guidelines:
 * 1-10: Critical stats and welcome
 * 11-20: Role-specific team/management widgets
 * 21-30: Analytics and insights
 * 31-40: Notifications and communications
 * 41-50: Calendar and events
 * 51-60: Quick actions and shortcuts
 * 61+: Additional/optional widgets
 */
export const DASHBOARD_WIDGETS: WidgetDefinition[] = [
  // Welcome & Essential Stats (Always visible, order 1-10)
  {
    widgetId: 'welcome-header',
    widgetName: 'Welcome Header',
    widgetDescription: 'Personalized greeting with weather and date/time',
    category: 'stats',
    defaultVisibleForRoles: ['HR', 'Manager', 'Employee', 'Product Owner'],
    defaultDisplayOrder: 1,
    isActive: true
  },
  {
    widgetId: 'personal-stats',
    widgetName: 'Personal Stats',
    widgetDescription: 'PTO balance, next payday, pending tasks, and company events',
    category: 'stats',
    defaultVisibleForRoles: ['HR', 'Manager', 'Employee', 'Product Owner'],
    defaultDisplayOrder: 2,
    isActive: true
  },

  // Team Management Widgets (Manager & HR only, order 11-20)
  {
    widgetId: 'team-overview',
    widgetName: 'Team Overview',
    widgetDescription: 'Team size, employees on leave, pending approvals, and performance metrics',
    category: 'team',
    defaultVisibleForRoles: ['HR', 'Manager'],
    defaultDisplayOrder: 11,
    isActive: true
  },

  // Quick Access Modules (Role-based, order 51-60)
  {
    widgetId: 'quick-actions',
    widgetName: 'Quick Access Modules',
    widgetDescription: 'Shortcuts to frequently used features and tools',
    category: 'quick-actions',
    defaultVisibleForRoles: ['HR', 'Manager', 'Employee', 'Product Owner'],
    defaultDisplayOrder: 51,
    isActive: true
  },

  // Notifications & Tasks (order 31-35)
  {
    widgetId: 'pending-tasks',
    widgetName: 'Pending Tasks',
    widgetDescription: 'Your pending tasks and action items',
    category: 'notifications',
    defaultVisibleForRoles: ['HR', 'Manager', 'Employee', 'Product Owner'],
    defaultDisplayOrder: 31,
    isActive: true
  },
  {
    widgetId: 'recent-notifications',
    widgetName: 'Recent Notifications',
    widgetDescription: 'System notifications and alerts',
    category: 'notifications',
    defaultVisibleForRoles: ['HR', 'Manager', 'Product Owner'],
    defaultDisplayOrder: 32,
    isActive: true
  },
  {
    widgetId: 'compliance-alerts',
    widgetName: 'Compliance Alerts',
    widgetDescription: 'Compliance notifications and regulatory updates',
    category: 'notifications',
    defaultVisibleForRoles: ['HR', 'Manager', 'Product Owner'],
    defaultDisplayOrder: 33,
    isActive: true
  },

  // Analytics & Insights (HR & Manager focus, order 21-30)
  {
    widgetId: 'kpi-dashboard',
    widgetName: 'HR KPI Dashboard',
    widgetDescription: 'Key performance indicators including headcount and turnover',
    category: 'analytics',
    defaultVisibleForRoles: ['HR', 'Product Owner'],
    defaultDisplayOrder: 21,
    isActive: true
  },
  {
    widgetId: 'ai-insights',
    widgetName: 'AI Insights',
    widgetDescription: 'AI-powered workforce trends and predictive analytics',
    category: 'ai',
    defaultVisibleForRoles: ['HR', 'Manager', 'Product Owner'],
    defaultDisplayOrder: 22,
    isActive: true
  },

  // Communications (order 36-40)
  {
    widgetId: 'company-announcements',
    widgetName: 'Company Announcements',
    widgetDescription: 'Recent company news and announcements',
    category: 'notifications',
    defaultVisibleForRoles: ['HR', 'Manager', 'Employee', 'Product Owner'],
    defaultDisplayOrder: 36,
    isActive: true
  },

  // Calendar & Events (order 41-50)
  {
    widgetId: 'upcoming-events',
    widgetName: 'Upcoming Events',
    widgetDescription: 'Company events, holidays, and training sessions with mini calendar',
    category: 'calendar',
    defaultVisibleForRoles: ['HR', 'Manager', 'Employee', 'Product Owner'],
    defaultDisplayOrder: 41,
    isActive: true
  },
  {
    widgetId: 'knowledge-base',
    widgetName: 'Knowledge Base',
    widgetDescription: 'Quick access to help articles and documentation',
    category: 'quick-actions',
    defaultVisibleForRoles: ['HR', 'Manager', 'Employee', 'Product Owner'],
    defaultDisplayOrder: 42,
    isActive: true
  }
];

/**
 * Get widgets visible for a specific role with their default order
 */
export function getDefaultWidgetsForRole(role: string): WidgetDefinition[] {
  return DASHBOARD_WIDGETS
    .filter(widget => 
      widget.isActive && 
      widget.defaultVisibleForRoles.includes(role as UserRole)
    )
    .sort((a, b) => a.defaultDisplayOrder - b.defaultDisplayOrder);
}

/**
 * Get a specific widget by ID
 */
export function getWidgetById(widgetId: string): WidgetDefinition | undefined {
  return DASHBOARD_WIDGETS.find(w => w.widgetId === widgetId);
}

/**
 * Get widgets by category
 */
export function getWidgetsByCategory(category: WidgetCategory): WidgetDefinition[] {
  return DASHBOARD_WIDGETS
    .filter(w => w.category === category && w.isActive)
    .sort((a, b) => a.defaultDisplayOrder - b.defaultDisplayOrder);
}
