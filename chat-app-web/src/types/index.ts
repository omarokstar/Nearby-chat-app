/**
 * Authentication and active session credentials.
 */
export interface UserInfo {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
}

export interface LoginSuccessResponse {
  token: string;
  user: UserInfo;
}

export interface MessageOnlyResponse {
  message: string;
}

export type LoginResponse = LoginSuccessResponse | MessageOnlyResponse;

/**
 * Type guard distinguishing a successful JWT session from an unverified email notice.
 */
export function isLoginSuccess(r: LoginResponse): r is LoginSuccessResponse {
  return 'token' in r;
}

/**
 * Geolocation and PostGIS discovery representations.
 */
export interface NearbyUser {
  id: string;
  username: string;
  distanceMeters: number;
}

export interface NearbyResponse {
  radiusKm: number;
  page: number;
  limit: number;
  users: NearbyUser[];
}

export interface LocationResponse {
  latitude: number;
  longitude: number;
}

/**
 * Chat and direct messaging payload entities.
 */
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  type: 'text' | 'audio';
  content: string | null;
  audioUrl: string | null;
  audioDurationSec: number | null;
  readAt: string | null;
  createdAt: string;
}

export interface Conversation {
  userId: string;
  username: string;
  unreadCount: number;
  lastMessage: {
    id: string;
    type: 'text' | 'audio';
    content: string | null;
    senderId: string;
    createdAt: string;
  };
}

/**
 * Administration, audit, and moderation interfaces.
 */
export interface AdminUser {
  id: string;
  username: string;
  email: string;
  isBlocked: boolean;
  blockedReason: string | null;
  blockedAt: string | null;
  isAccountVerified: boolean;
  createdAt: string;
  role: string;
}

export interface AdminUsersResponse {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

export interface RadiusResponse {
  radiusKm: number;
}

/**
 * Backend HTTP validation and operational error structure.
 */
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

/**
 * WebSocket real-time delivery and acknowledgement contracts.
 */
export interface SocketSendAck {
  ok: boolean;
  message?: Message;
  error?: string;
}

export interface SocketReadPayload {
  byUserId: string;
}
