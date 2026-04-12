export interface ApiErrorPayload {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ApiSuccessPayload<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
}
