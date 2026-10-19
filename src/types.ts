// Request and response types for the case-queue API.
// Self-contained (no imports), so it can be copied into a client project as-is.

export const CASE_STATUSES = ['new', 'in_review', 'waiting_on_client', 'resolved', 'closed'] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const CASE_PRIORITIES = ['low', 'normal', 'high'] as const;
export type CasePriority = (typeof CASE_PRIORITIES)[number];

// ---- Errors ----
// Every non-2xx response has the body { error: ApiError }.

export type ErrorCode =
  | 'bad_request'
  | 'not_found'
  | 'payload_too_large'
  | 'unsupported_media_type'
  | 'internal'
  | 'forced_failure';

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiError {
  message: string;
  code: ErrorCode;
  fields?: FieldError[];
}

export interface ErrorResponse {
  error: ApiError;
}

// ---- Health ----

export interface HealthResponse {
  status: 'ok';
}
