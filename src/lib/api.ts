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
  first_name: string | null;
  last_name: string | null;
  profile_picture: string | null;
  role: string | null;
  preferred_language: string | null;
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

  // Channel endpoints
  async getChannels() {
    return this.request('/api/channels');
  }

  async createChannel(channel: any) {
    return this.request('/api/channels', {
      method: 'POST',
      body: JSON.stringify(channel),
    });
  }

  // Message endpoints
  async getMessages(channelId: string) {
    return this.request(`/api/channels/${channelId}/messages`);
  }

  async createMessage(channelId: string, message: any) {
    return this.request(`/api/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  async updateMessage(id: string, updates: any) {
    return this.request(`/api/messages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
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
