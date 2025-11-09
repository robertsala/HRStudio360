// API Client for HRStudio360 Backend

interface User {
  id: string;
  email: string;
  name?: string;
}

interface Session {
  user: User | null;
}

interface Profile {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profilePicture: string | null;
  role: string | null;
  dateOfBirth: string | null;
  hireDate: string | null;
  lastBirthdayShown: string | null;
  lastAnniversaryShown: string | null;
  languagePreference: string | null;
  themePreference: string | null;
}

interface EmployeeDirectoryEntry {
  id: string;
  userId: string | null;
  employeeId: string;
  departmentId: string | null;
  jobTitleId: string | null;
  managerId: string | null;
  startDate: string;
  employmentType: string;
  salary: string | null;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
  profile?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatarUrl: string | null;
  } | null;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    // In development, the API is on the same server
    this.baseUrl = '';
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include', // Include cookies for session management
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<{ user: User }> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(email: string, password: string, firstName?: string, lastName?: string): Promise<{ user: User }> {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
  }

  async logout(): Promise<{ success: boolean }> {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  async getSession(): Promise<Session> {
    return this.request('/api/auth/session');
  }

  // Profile endpoints
  async getProfile(id: string): Promise<Profile> {
    return this.request(`/api/profiles/${id}`);
  }

  async getProfiles() {
    return this.request('/api/profiles');
  }

  async createProfile(profile: any) {
    return this.request('/api/profiles', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  }

  async updateProfile(id: string, updates: any) {
    return this.request(`/api/profiles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Employee endpoints
  async getEmployees() {
    return this.request('/api/employees');
  }

  async getEmployeesWithProfiles(): Promise<EmployeeDirectoryEntry[]> {
    return this.request('/api/employees/directory');
  }

  async getEmployee(id: number) {
    return this.request(`/api/employees/${id}`);
  }

  async createEmployee(employee: any) {
    return this.request('/api/employees', {
      method: 'POST',
      body: JSON.stringify(employee),
    });
  }

  // Leave request endpoints
  async getLeaveRequests() {
    return this.request('/api/leave-requests');
  }

  async getLeaveRequest(id: number) {
    return this.request(`/api/leave-requests/${id}`);
  }

  async createLeaveRequest(leaveRequest: any) {
    return this.request('/api/leave-requests', {
      method: 'POST',
      body: JSON.stringify(leaveRequest),
    });
  }

  async updateLeaveRequest(id: number, updates: any) {
    return this.request(`/api/leave-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // AI Assistant endpoint
  async chatWithAssistant(message: string, userId: string) {
    return this.request('/api/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message, userId }),
    });
  }

  // Onboarding email endpoint
  async sendOnboardingEmail(data: {
    to: string;
    firstName: string;
    lastName: string;
    position: string;
    department?: string;
    startDate: string;
    managerName?: string;
  }) {
    return this.request('/api/onboarding/send-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Candidate endpoints
  async getCandidates() {
    return this.request('/api/candidates');
  }

  async getCandidate(id: string) {
    return this.request(`/api/candidates/${id}`);
  }

  async createCandidate(candidate: any) {
    return this.request('/api/candidates', {
      method: 'POST',
      body: JSON.stringify(candidate),
    });
  }

  async updateCandidate(id: string, updates: any) {
    return this.request(`/api/candidates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Expense Category endpoints
  async getExpenseCategories() {
    return this.request('/api/expense-categories');
  }

  async getExpenseCategory(id: string) {
    return this.request(`/api/expense-categories/${id}`);
  }

  // Expense endpoints
  async getExpenses() {
    return this.request('/api/expenses');
  }

  async createExpense(expense: any) {
    return this.request('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  }

  // Chat Channel endpoints
  async getChatChannels() {
    return this.request('/api/chat/channels');
  }

  async getChatChannel(id: string) {
    return this.request(`/api/chat/channels/${id}`);
  }

  async createChatChannel(channel: any) {
    return this.request('/api/chat/channels', {
      method: 'POST',
      body: JSON.stringify(channel),
    });
  }

  async updateChatChannel(id: string, updates: any) {
    return this.request(`/api/chat/channels/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Channel Member endpoints
  async getChannelMembers(channelId: string) {
    return this.request(`/api/chat/channels/${channelId}/members`);
  }

  async addChannelMember(channelId: string, member: any) {
    return this.request(`/api/chat/channels/${channelId}/members`, {
      method: 'POST',
      body: JSON.stringify(member),
    });
  }

  async removeChannelMember(channelId: string, userId: string) {
    return this.request(`/api/chat/channels/${channelId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  async markChannelRead(channelId: string, userId: string) {
    return this.request(`/api/chat/channels/${channelId}/mark-read`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // Chat Message endpoints
  async getChatMessages(channelId: string, limit?: number) {
    const query = limit ? `?limit=${limit}` : '';
    return this.request(`/api/chat/channels/${channelId}/messages${query}`);
  }

  async getChatMessage(id: string) {
    return this.request(`/api/chat/messages/${id}`);
  }

  async createChatMessage(channelId: string, message: any) {
    return this.request(`/api/chat/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  async updateChatMessage(id: string, updates: any) {
    return this.request(`/api/chat/messages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteChatMessage(id: string) {
    return this.request(`/api/chat/messages/${id}`, {
      method: 'DELETE',
    });
  }

  // Message Reaction endpoints
  async getMessageReactions(messageId: string) {
    return this.request(`/api/chat/messages/${messageId}/reactions`);
  }

  async addMessageReaction(messageId: string, emoji: string, userId: string) {
    return this.request(`/api/chat/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji, userId }),
    });
  }

  async removeMessageReaction(messageId: string, emoji: string, userId: string) {
    return this.request(`/api/chat/messages/${messageId}/reactions`, {
      method: 'DELETE',
      body: JSON.stringify({ emoji, userId }),
    });
  }

  // Typing Indicator endpoints
  async setTyping(channelId: string, userId: string, isTyping: boolean) {
    return this.request(`/api/chat/channels/${channelId}/typing`, {
      method: 'POST',
      body: JSON.stringify({ userId, isTyping }),
    });
  }

  async getTypingIndicators(channelId: string) {
    return this.request(`/api/chat/channels/${channelId}/typing`);
  }

  // User Presence endpoints
  async updateUserPresence(userId: string, status: 'online' | 'away' | 'offline') {
    return this.request(`/api/chat/presence/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  async getUserPresence(userId: string) {
    return this.request(`/api/chat/presence/${userId}`);
  }

  // Change Log endpoints
  async getChangeLogs(filters?: { changeType?: string; startDate?: string; endDate?: string }, limit?: number) {
    const params = new URLSearchParams();
    if (filters?.changeType) params.append('changeType', filters.changeType);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (limit) params.append('limit', limit.toString());
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/api/changelog${query}`);
  }

  async getChangeLog(id: string) {
    return this.request(`/api/changelog/${id}`);
  }

  async createChangeLog(log: any) {
    return this.request('/api/changelog', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  }

  async updateChangeLog(id: string, updates: any) {
    return this.request(`/api/changelog/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Historical Changes endpoints
  async getHistoricalChanges(limit?: number) {
    const query = limit ? `?limit=${limit}` : '';
    return this.request(`/api/changelog/historical${query}`);
  }

  async createHistoricalChange(change: any) {
    return this.request('/api/changelog/historical', {
      method: 'POST',
      body: JSON.stringify(change),
    });
  }

  // Change Notification endpoints
  async getChangeNotifications(userId: string) {
    return this.request(`/api/changelog/notifications/${userId}`);
  }

  async createChangeNotification(notification: any) {
    return this.request('/api/changelog/notifications', {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  }

  async markChangeNotificationRead(changeLogId: string, userId: string) {
    return this.request(`/api/changelog/notifications/mark-read`, {
      method: 'POST',
      body: JSON.stringify({ changeLogId, userId }),
    });
  }

  async getExpense(id: string) {
    return this.request(`/api/expenses/${id}`);
  }

  async updateExpense(id: string, updates: any) {
    return this.request(`/api/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Celebration endpoints
  async getCelebrationBadges() {
    return this.request('/api/celebration-badges');
  }

  async getCelebrationBadgeByYears(years: number) {
    return this.request(`/api/celebration-badges/years/${years}`);
  }

  async getEarnedBadges(userId: string) {
    return this.request(`/api/earned-badges/${userId}`);
  }

  async createEarnedBadge(badge: any) {
    return this.request('/api/earned-badges', {
      method: 'POST',
      body: JSON.stringify(badge),
    });
  }

  async markBadgeViewed(userId: string, badgeId: string) {
    return this.request('/api/earned-badges/mark-viewed', {
      method: 'POST',
      body: JSON.stringify({ userId, badgeId }),
    });
  }

  async saveCelebrationHistory(history: any) {
    return this.request('/api/celebration-history', {
      method: 'POST',
      body: JSON.stringify(history),
    });
  }

  async markCelebrationDismissed(userId: string, type: string, date: string) {
    return this.request('/api/celebration-history/dismiss', {
      method: 'POST',
      body: JSON.stringify({ userId, type, date }),
    });
  }

  async getCelebrationNotifications(userId: string) {
    return this.request(`/api/celebration-notifications/${userId}`);
  }

  async createCelebrationNotification(notification: any) {
    return this.request('/api/celebration-notifications', {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  }
}

export const apiClient = new ApiClient();
