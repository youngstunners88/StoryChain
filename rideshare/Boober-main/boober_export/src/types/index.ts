export const UserRole = {
  DRIVER: 'DRIVER',
  PASSENGER: 'PASSENGER',
  MARSHAL: 'MARSHAL'
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

export const OnboardingStatus = {
  NOT_STARTED: 'NOT_STARTED',
  PENDING_DETAILS: 'PENDING_DETAILS',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED'
} as const;

export type OnboardingStatusType = typeof OnboardingStatus[keyof typeof OnboardingStatus];

export type QueueCapacity = 'EMPTY' | 'MOVING' | 'HALF_FULL' | 'FULL_HOUSE' | 'OVERFLOWING';
export type TrafficLevel = 'CLEAR' | 'MODERATE' | 'HEAVY' | 'GRIDLOCK';

export interface LogEntry {
  id: string;
  action: string;
  timestamp: number;
  pointsEarned: number;
}

export interface VehicleDetails {
  type: 'MINIBUS' | 'SEDAN' | 'OTHER';
  brand: string;
  color: string;
  plate?: string;
  frontPhoto?: string;
  sidePhoto?: string;
  backPhoto?: string;
  conditionRating?: number;
  cleanlinessRating?: number;
}

export interface Suggestion {
  id: string;
  userId: string;
  userName: string;
  content: string;
  type: 'IMPROVE' | 'REMOVE';
  timestamp: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer?: string;
  answeredBy?: string;
  timestamp: number;
  priceUpdate?: {
    routeId: string;
    newPrice: number;
  };
  verifiedBy?: string[];
  verificationCount?: number;
  questionType?: 'TEMPLATE' | 'CUSTOM';
  routeInfo?: {
    originId: string;
    destinationId: string;
  };
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: UserRoleType;
  targetId: string;
  targetName: string;
  targetRole: UserRoleType;
  rating: number;
  comment: string;
  timestamp: number;
}

export interface RankStatus {
  rankId: string;
  capacity: QueueCapacity;
  lastUpdated: number;
  marshalName: string;
  loadEstimate: number;
}

export interface Rank {
  id: string;
  name: string;
  location: string;
  category: 'CBD' | 'Soweto' | 'Alexandra' | 'Greater Joburg' | 'East Rand' | 'West Rand' | 'Northern Suburbs' | 'Long Distance';
  coords: { x: number; y: number };
}

export interface RoutePath {
  id: string;
  originId: string;
  destinationId: string;
  path: { x: number; y: number }[];
  price?: number;
  lastUpdatedBy?: string;
  customDestinationName?: string;
}

export interface DriverStatus {
  isEnRoute: boolean;
  destinationName: string;
  occupancy: number;
  lastUpdated: number;
}

export interface UserProfile {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  role: UserRoleType;
  points: number;
  rankTitle: string;
  isVerified?: boolean;
  licensePlate?: string;
  badgeId?: string;
  positiveReviews?: number;
  profileImage?: string;
  isDriverOfTheWeek?: boolean;
  warningCount: number;
  isBanned: boolean;
  suspensionEndDate?: number;
  suspensionReason?: string;
  onboardingStatus: OnboardingStatusType;
  vehicle?: VehicleDetails;
  selfie?: string;
  approvingDrivers?: string[];
  onboardingDate?: number;
  tripsCompleted?: number;
  averageRating?: number;
  monthlyLogs?: LogEntry[];
  lastActiveDate?: string;
  currentStreak?: number;
  geoTrackingEnabled?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  role: UserRoleType;
  content: string;
  timestamp: number;
  channel: 'DRIVERS' | 'MARSHALS' | 'PASSENGERS';
  rankTag?: string;
  routeId?: string;
  isAlert?: boolean;
  alertType?: 'POLICE' | 'TRAFFIC' | 'ALT_ROUTE' | 'GENERAL';
  isFlagged?: boolean;
  flagReason?: string;
}

export interface ActivePing {
  id: string;
  passengerId: string;
  passengerName: string;
  rankId?: string;
  customCoords?: { x: number; y: number };
  isCustom?: boolean;
  timestamp: number;
  interceptPoint?: { x: number; y: number };
  isMarshalPing?: boolean;
  message?: string;
  destinationId?: string;
  price?: number;
  acceptedBy?: string[];
  acceptedDriverNames?: string[];
  selectedMarshalId?: string;
}

export interface MarshalInfo {
  id: string;
  name: string;
  rankId: string;
  rankName: string;
  rating: number;
  isOnline: boolean;
}

export interface SocialPost {
  id: string;
  author: string;
  authorId: string;
  content: string;
  isAnonymous: boolean;
  timestamp: number;
  likes: number;
  likedBy: string[];
  replies: SocialReply[];
  image?: string;
  voiceNote?: string;
  type?: 'GENERAL' | 'TAXI_WASH';
  washPhotos?: {
    front: string;
    back: string;
    side: string;
  };
  isFlagged?: boolean;
  flagReason?: string;
}

export interface SocialReply {
  id: string;
  author: string;
  authorId: string;
  content: string;
  timestamp: number;
  isFlagged?: boolean;
}

export interface VerificationRequest {
  id: string;
  type: 'MARSHAL_APPROVAL' | 'DUPLICATE_PLATE_DISPUTE';
  targetUserId: string;
  targetUserName: string;
  votesFor: string[];
  votesAgainst: string[];
  requiredVotes: number;
  timestamp: number;
}

export interface OfflineData {
  routes: RoutePath[];
  ranks: Rank[];
  lastSync: number;
}
