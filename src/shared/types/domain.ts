// ─── Canonical Domain Types ───────────────────────────────────────────────────
// Single source of truth for all domain entities. Import from here everywhere.
// Never define entity shapes inline in components or pages.

// ─── Auth ────────────────────────────────────────────────────────────────────

export type UserRole = 'reader' | 'writer' | 'agent' | 'editor' | 'admin';

export type SubscriptionTier = 'free' | 'writer' | 'studio' | 'enterprise';

export interface User {
  id: string;
  penName: string;
  role: UserRole;
  tier: SubscriptionTier;
  avatarUrl?: string;
  isAgent: boolean;
  tokenBalance: number;
  walletAddress?: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// ─── Stories ─────────────────────────────────────────────────────────────────

export type StoryGenre =
  | 'mystery' | 'romance' | 'horror' | 'action' | 'fantasy'
  | 'scifi' | 'comedy' | 'thriller' | 'drama' | 'adventure'
  | 'true_life' | 'default';

export type StoryStatus = 'active' | 'completed' | 'published';

export interface Story {
  id: string;
  title: string;
  genre: StoryGenre;
  status: StoryStatus;
  authorId: string;
  authorName: string;
  segmentCount: number;
  coverUrl?: string;
  bestsellerScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Segment {
  id: string;
  storyId: string;
  authorId: string;
  authorName: string;
  content: string;
  qualityScore?: number;
  modelUsed?: string;
  tokensUsed?: number;
  createdAt: string;
}

export interface BookMetadata {
  foreword?: string;
  dedication?: string;
  copyright?: string;
  coverUrl?: string;
  published: boolean;
}

// ─── Agents ──────────────────────────────────────────────────────────────────

export interface TrinityDNA {
  openclaw: number;
  hermes: number;
  zeroclaw: number;
}

export interface AgentWriter extends User {
  genre: StoryGenre;
  voiceProfile: string;
  tone: string;
  trinityDna: TrinityDNA;
  totalSegments: number;
  avgQualityScore: number;
}

// ─── Messaging ───────────────────────────────────────────────────────────────

export interface Thread {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerAvatarUrl?: string;
  partnerIsAgent: boolean;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'segment_added' | 'story_completed' | 'dm_received'
  | 'editor_dm' | 'quality_award' | 'token_earned';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

// ─── Blockchain / Earnings ────────────────────────────────────────────────────

export interface TokenBalance {
  storyTokens: number;
  usdEquivalent: number;
  pendingPayout: number;
  lastUpdated: string;
}

export interface EarningsBreakdown {
  segmentRewards: number;
  qualityBonuses: number;
  readEngagement: number;
  editorReviews: number;
  stakingRewards: number;
  total: number;
}

// ─── API responses ────────────────────────────────────────────────────────────

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
