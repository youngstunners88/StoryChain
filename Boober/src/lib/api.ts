const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Types
export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'DRIVER' | 'PASSENGER' | 'MARSHAL';
  points: number;
  rank_title: string;
  is_verified: boolean;
  warning_count: number;
  is_banned: boolean;
  onboarding_status: string;
  vehicle?: any;
  trips_completed: number;
  average_rating: number;
  current_streak: number;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  role: string;
  content: string;
  timestamp: string;
  channel: string;
  rank_tag?: string;
  route_id?: string;
  is_alert: boolean;
  alert_type?: string;
}

export interface ActivePing {
  id: string;
  passenger_id: string;
  passenger_name: string;
  rank_id?: string;
  custom_coords?: { lat: number; lng: number };
  is_custom: boolean;
  timestamp: string;
  intercept_point?: { lat: number; lng: number };
  is_marshal_ping: boolean;
  message?: string;
  destination_id?: string;
  price?: number;
  accepted_by: string[];
  accepted_driver_names: string[];
  selected_marshal_id?: string;
  status: string;
}

export interface SocialPost {
  id: string;
  author: string;
  author_id: string;
  content: string;
  is_anonymous: boolean;
  timestamp: string;
  likes: number;
  liked_by: string[];
  replies: any[];
  image?: string;
  post_type: string;
  wash_photos?: any;
  is_flagged: boolean;
}

export interface RoutePath {
  id: string;
  origin_id: string;
  destination_id: string;
  path: any[];
  price?: number;
  last_updated_by?: string;
  custom_destination_name?: string;
  created_at: string;
}

export interface RankStatus {
  id: string;
  rank_id: string;
  capacity: string;
  last_updated: string;
  marshal_name: string;
  marshal_id: string;
  load_estimate: number;
}

export interface Suggestion {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  suggestion_type: string;
  timestamp: string;
  votes: number;
  voted_by: string[];
}

export interface FAQ {
  id: string;
  question: string;
  answer?: string;
  answered_by?: string;
  timestamp: string;
  price_update?: any;
  verified_by: string[];
  verification_count: number;
  question_type: string;
  route_info?: any;
}

export interface Review {
  id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_role: string;
  target_id: string;
  target_name: string;
  target_role: string;
  rating: number;
  comment: string;
  timestamp: string;
}

// API Client
class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('boober_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('boober_token', token);
    } else {
      localStorage.removeItem('boober_token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async register(data: { name: string; email?: string; phone?: string; password: string; role: string }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(response.access_token);
    return response;
  }

  async login(data: { email?: string; phone?: string; password: string }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(response.access_token);
    return response;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Users
  async updateMe(data: Partial<User>): Promise<User> {
    return this.request<User>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async addPoints(points: number, action: string): Promise<{ success: boolean; points_added: number; total_points: number }> {
    return this.request(`/users/me/add-points?points=${points}&action=${encodeURIComponent(action)}`, {
      method: 'POST',
    });
  }

  async getLeaderboard(limit: number = 50): Promise<User[]> {
    return this.request<User[]>(`/users/leaderboard?limit=${limit}`);
  }

  // Messages
  async getMessages(channel?: string, limit: number = 50): Promise<ChatMessage[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (channel) params.append('channel', channel);
    return this.request<ChatMessage[]>(`/messages?${params}`);
  }

  async sendMessage(data: Partial<ChatMessage>): Promise<ChatMessage> {
    return this.request<ChatMessage>('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Pings
  async getPings(status: string = 'ACTIVE', limit: number = 20): Promise<ActivePing[]> {
    return this.request<ActivePing[]>(`/pings?status=${status}&limit=${limit}`);
  }

  async createPing(data: Partial<ActivePing>): Promise<ActivePing> {
    return this.request<ActivePing>('/pings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async acceptPing(pingId: string, price: number): Promise<{ success: boolean; message: string }> {
    return this.request(`/pings/${pingId}/accept?price=${price}`, {
      method: 'POST',
    });
  }

  async completePing(pingId: string): Promise<{ success: boolean; points_earned: number }> {
    return this.request(`/pings/${pingId}/complete`, {
      method: 'POST',
    });
  }

  // Posts
  async getPosts(limit: number = 50): Promise<SocialPost[]> {
    return this.request<SocialPost[]>(`/posts?limit=${limit}`);
  }

  async createPost(data: Partial<SocialPost>): Promise<SocialPost> {
    return this.request<SocialPost>('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async likePost(postId: string): Promise<{ success: boolean; likes: number }> {
    return this.request(`/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  async replyToPost(postId: string, content: string): Promise<{ success: boolean; reply: any }> {
    return this.request(`/posts/${postId}/reply?content=${encodeURIComponent(content)}`, {
      method: 'POST',
    });
  }

  // Routes
  async getRoutes(): Promise<RoutePath[]> {
    return this.request<RoutePath[]>('/routes');
  }

  async createRoute(data: Partial<RoutePath>): Promise<RoutePath> {
    return this.request<RoutePath>('/routes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Rank Status
  async getRankStatuses(): Promise<RankStatus[]> {
    return this.request<RankStatus[]>('/rank-status');
  }

  async updateRankStatus(data: Partial<RankStatus>): Promise<RankStatus> {
    return this.request<RankStatus>('/rank-status', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Reviews
  async getUserReviews(userId: string): Promise<Review[]> {
    return this.request<Review[]>(`/reviews/${userId}`);
  }

  async createReview(data: Partial<Review>): Promise<Review> {
    return this.request<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // FAQs
  async getFAQs(): Promise<FAQ[]> {
    return this.request<FAQ[]>('/faqs');
  }

  async createFAQ(data: Partial<FAQ>): Promise<FAQ> {
    return this.request<FAQ>('/faqs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Suggestions
  async getSuggestions(): Promise<Suggestion[]> {
    return this.request<Suggestion[]>('/suggestions');
  }

  async createSuggestion(data: Partial<Suggestion>): Promise<Suggestion> {
    return this.request<Suggestion>('/suggestions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async voteSuggestion(suggestionId: string): Promise<{ success: boolean; votes: number }> {
    return this.request(`/suggestions/${suggestionId}/vote`, {
      method: 'POST',
    });
  }

  // Health
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health');
  }
}

export const api = new ApiClient();
