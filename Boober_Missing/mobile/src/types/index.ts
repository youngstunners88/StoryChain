export interface User {
  id: string;
  email: string;
  phone: string | null;
  name: string | null;
  avatar: string | null;
  rating: number | null;
  userType: 'PASSENGER' | 'DRIVER' | 'ADMIN';
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  driverId: string;
  make: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
  vehicleType: 'SEDAN' | 'SUV' | 'VAN' | 'BIKE';
  capacity: number;
}

export interface Ride {
  id: string;
  passengerId: string;
  driverId: string | null;
  status: RideStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  
  distance: number | null;
  duration: number | null;
  fare: number;
  surgeMultiplier: number;
  
  requestedAt: string;
  acceptedAt: string | null;
  pickedUpAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  
  cancellationReason: string | null;
  cancelledBy: string | null;
  
  passenger: User;
  driver: User & { vehicle: Vehicle } | null;
}

export type RideStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'DRIVER_ARRIVING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'REFUNDED';

export type PaymentMethod =
  | 'CASH'
  | 'CARD'
  | 'WALLET'
  | 'MOBILE_MONEY';

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  description: string;
  rideId: string | null;
  createdAt: string;
}

export interface DriverStats {
  id: string;
  driverId: string;
  totalRides: number;
  totalEarnings: number;
  totalDistance: number;
  rating: number;
}

export interface NearbyDriver {
  id: string;
  name: string;
  avatar: string | null;
  rating: number;
  latitude: number;
  longitude: number;
  distance: number;
  vehicle: Vehicle;
}

export interface FareEstimate {
  distance: number;
  duration: number;
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  totalFare: number;
  surgeMultiplier: number;
}

export interface FavoriteLocation {
  id: string;
  userId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

export interface PaymentMethodData {
  id: string;
  userId: string;
  type: 'CARD' | 'MOBILE_MONEY';
  provider: string;
  cardLast4: string | null;
  cardExpiry: string | null;
  isDefault: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface Rating {
  id: string;
  fromUserId: string;
  toUserId: string;
  rideId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}
