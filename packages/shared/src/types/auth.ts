export interface AuthTokens {
  accessToken: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  isOnline: boolean;
  lastSeenAt: string | null;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}
