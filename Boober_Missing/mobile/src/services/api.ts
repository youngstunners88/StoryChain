import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Ride, Vehicle, Wallet, Transaction, DriverStats, NearbyDriver, FareEstimate } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data.data;
  }

  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async loginWithPhone(phone: string): Promise<void> {
    return this.request('/auth/login-phone', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyPhone(phone: string, code: string): Promise<{ token: string; user: User }> {
    return this.request('/auth/verify-phone', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    phone: string;
    userType: string;
  }): Promise<{ token: string; user: User }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe(): Promise<User> {
    return this.request('/auth/me');
  }

  // User
  async updateProfile(data: Partial<User>): Promise<User> {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getFavorites() {
    return this.request('/users/favorites');
  }

  async addFavorite(data: { name: string; address: string; latitude: number; longitude: number }) {
    return this.request('/users/favorites', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Rides
  async createRide(data: {
    pickupAddress: string;
    pickupLatitude: number;
    pickupLongitude: number;
    dropoffAddress: string;
    dropoffLatitude: number;
    dropoffLongitude: number;
    paymentMethod: string;
  }): Promise<Ride> {
    return this.request('/rides', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRides(params?: { status?: string; limit?: number; offset?: number }): Promise<Ride[]> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/rides${query ? `?${query}` : ''}`);
  }

  async getActiveRide(): Promise<Ride | null> {
    return this.request('/rides/active');
  }

  async getNearbyDrivers(latitude: number, longitude: number, radius?: number): Promise<NearbyDriver[]> {
    const query = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      ...(radius && { radius: radius.toString() }),
    }).toString();
    return this.request(`/rides/nearby-drivers?${query}`);
  }

  async estimateRide(data: {
    pickupLatitude: number;
    pickupLongitude: number;
    dropoffLatitude: number;
    dropoffLongitude: number;
  }): Promise<FareEstimate> {
    const query = new URLSearchParams({
      pickupLatitude: data.pickupLatitude.toString(),
      pickupLongitude: data.pickupLongitude.toString(),
      dropoffLatitude: data.dropoffLatitude.toString(),
      dropoffLongitude: data.dropoffLongitude.toString(),
    }).toString();
    return this.request(`/rides/estimate?${query}`);
  }

  async cancelRide(rideId: string, reason?: string): Promise<Ride> {
    return this.request(`/rides/${rideId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async rateRide(rideId: string, rating: number, comment?: string): Promise<void> {
    return this.request(`/rides/${rideId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
  }

  // Driver
  async getDriverProfile(): Promise<User & { vehicle: Vehicle; driverStats: DriverStats }> {
    return this.request('/driver/profile');
  }

  async updateDriverAvailability(isAvailable: boolean, latitude?: number, longitude?: number): Promise<void> {
    return this.request('/driver/availability', {
      method: 'POST',
      body: JSON.stringify({ isAvailable, latitude, longitude }),
    });
  }

  async getDriverStats(): Promise<DriverStats> {
    return this.request('/driver/stats');
  }

  async getDriverEarnings(period?: string): Promise<{
    rides: Ride[];
    totalEarnings: number;
    totalDistance: number;
    rideCount: number;
  }> {
    const query = period ? `?period=${period}` : '';
    return this.request(`/driver/earnings${query}`);
  }

  async getDriverRides(params?: { status?: string }): Promise<Ride[]> {
    const query = params?.status ? `?status=${params.status}` : '';
    return this.request(`/driver/rides${query}`);
  }

  async acceptRide(rideId: string): Promise<Ride> {
    return this.request(`/driver/rides/${rideId}/accept`, {
      method: 'POST',
    });
  }

  async rejectRide(rideId: string, reason?: string): Promise<void> {
    return this.request(`/driver/rides/${rideId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async completeRide(rideId: string): Promise<Ride> {
    return this.request(`/driver/rides/${rideId}/complete`, {
      method: 'POST',
    });
  }

  // Payments
  async getWallet(): Promise<Wallet> {
    return this.request('/payments/wallet');
  }

  async getTransactions(params?: { type?: string; limit?: number }): Promise<{
    transactions: Transaction[];
    pagination: { total: number; limit: number; offset: number };
  }> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/payments/transactions${query ? `?${query}` : ''}`);
  }

  async topUpWallet(amount: number, paymentMethod: string): Promise<{ transaction: Transaction; wallet: Wallet }> {
    return this.request('/payments/wallet/topup', {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMethod }),
    });
  }

  async processPayment(rideId: string, paymentMethod: string): Promise<{
    rideId: string;
    amount: number;
    paymentMethod: string;
    status: string;
  }> {
    return this.request('/payments/process', {
      method: 'POST',
      body: JSON.stringify({ rideId, paymentMethod }),
    });
  }
}

export const api = new ApiService();
