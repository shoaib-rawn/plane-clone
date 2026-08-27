/**
 * Global API Response Envelopes
 * Standardized across all MiniPlane endpoints
 */

export interface ApiResponse<T> {
  data: T;
}

export interface ApiCollectionResponse<T> {
  data: T[];
  meta?: {
    total: number;
    page?: number;
    perPage?: number;
    totalPages?: number;
  };
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: ApiFieldError[];
  };
}
