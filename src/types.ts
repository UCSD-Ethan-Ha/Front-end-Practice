// Request and response types for the case-queue API.
// Self-contained (no imports), so it can be copied into a client project as-is.

export const CASE_STATUSES = ['new', 'in_review', 'waiting_on_client', 'resolved', 'closed'] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const CASE_PRIORITIES = ['low', 'normal', 'high'] as const;
export type CasePriority = (typeof CASE_PRIORITIES)[number];
