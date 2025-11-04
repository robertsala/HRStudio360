// API Client for HRStudio360 Backend

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    // In development, the API is on the same server
    this.baseUrl = '';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
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
        return { error: error.error || `HTTP ${response.status}` };
      }

      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      console.error('API request failed:', error);
      return { error: error.message || 'Network error' };
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  async getSession() {
    return this.request('/api/auth/session');
  }

  // Profile endpoints
  async getProfile(id: string) {
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
}

export const apiClient = new ApiClient();
