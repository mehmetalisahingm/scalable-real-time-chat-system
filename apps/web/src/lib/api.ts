import type { AuthResponse, ConversationSummary, PaginatedResponse, MessageSummary } from '@chat/shared';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

interface ApiEnvelope<T> {
  data: T;
}

interface ApiErrorEnvelope {
  error: {
    message: string;
    code?: string;
  };
}

export interface SearchUser {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  isOnline: boolean;
  lastSeenAt: string | null;
}

export type ConversationMessagesResponse = PaginatedResponse<MessageSummary>;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    credentials: 'include',
    cache: 'no-store',
  });

  const payload = (await response.json()) as ApiEnvelope<T> | ApiErrorEnvelope;

  if (!response.ok || 'error' in payload) {
    throw new ApiClientError(
      'error' in payload ? payload.error.message : 'Unexpected API error.',
      response.status,
      'error' in payload ? payload.error.code : undefined,
    );
  }

  return payload.data;
}

export function authApi(accessToken: string) {
  const withAuth = <T>(path: string, init?: RequestInit) =>
    apiRequest<T>(path, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(init?.headers ?? {}),
      },
    });

  return {
    me: () => withAuth<AuthResponse['user']>('/users/me'),
    conversations: () => withAuth<ConversationSummary[]>('/conversations'),
    messages: (conversationId: string, cursor?: string | null) =>
      withAuth<ConversationMessagesResponse>(
        `/conversations/${conversationId}/messages?limit=25${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
      ),
    searchUsers: (query: string) =>
      withAuth<SearchUser[]>(`/users?query=${encodeURIComponent(query.trim())}`),
    createDirectConversation: (participantId: string) =>
      withAuth<ConversationSummary>('/conversations/direct', {
        method: 'POST',
        body: JSON.stringify({ participantId }),
      }),
    createGroupConversation: (payload: { name: string; participantIds: string[] }) =>
      withAuth<ConversationSummary>('/conversations/group', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    markRead: (conversationId: string) =>
      withAuth<{ conversationId: string; readAt: string }>(`/conversations/${conversationId}/read`, {
        method: 'POST',
      }),
  };
}

export const publicApi = {
  register: (payload: { username: string; email: string; password: string }) =>
    apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload: { email: string; password: string }) =>
    apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  refresh: () =>
    apiRequest<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  logout: () =>
    apiRequest<{ success: boolean }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    }),
};
