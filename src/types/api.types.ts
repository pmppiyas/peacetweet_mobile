export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode?: number;
  message: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    nextCursor?: string | null;
    hasNextPage?: boolean;
  };
}
