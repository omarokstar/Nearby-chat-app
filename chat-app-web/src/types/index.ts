/* ───────────── Auth ───────────── */

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

export function isLoginSuccess(r: LoginResponse): r is LoginSuccessResponse {
  return 'token' in r;
}

/* ───────────── Users ───────────── */

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

/* ───────────── Messages ───────────── */

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

/* ───────────── Admin ───────────── */

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

/* ───────────── API Error ───────────── */

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

/* ───────────── Socket ───────────── */

export interface SocketSendAck {
  ok: boolean;
  message?: Message;
  error?: string;
}

export interface SocketReadPayload {
  byUserId: string;
}
