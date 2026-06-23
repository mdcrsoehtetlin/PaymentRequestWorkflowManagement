// ============================================================
// frontend/src/types/index.ts
// Frontend shared types — mirrors the backend types/index.ts.
// Only contains types needed by the frontend layer.
// See: docs/detailed_design/00_common/DD_COMMON_03_SHARED_TYPES.md
// ============================================================

// ------------------------------------------------------------------
// 1. ENUMS (must match backend src/modules/shared/types/index.ts exactly)
// ------------------------------------------------------------------

/**
 * Maps to payment_statuses.status_id in PostgreSQL.
 * CRITICAL: Integer values must exactly match the DB rows.
 */
export enum PaymentStatus {
  DRAFT = 1,
  SUBMITTED_MANAGER = 2,
  MANAGER_REVIEWING = 3,
  MANAGER_VERIFIED = 4,
  REJECTED_MANAGER = 5,
  SUBMITTED_APPROVER = 6,
  APPROVER_REVIEWING = 7,
  APPROVED = 8,
  REJECTED_APPROVER = 9,
  PAID = 10,
}

/**
 * Maps to approval_action_types.action_type_id in PostgreSQL.
 * Used to render labels in the ApprovalTimeline component.
 */
export enum ApprovalActionType {
  CREATED = 1,
  EDITED = 2,
  SUBMITTED = 3,
  MGR_REVIEW_START = 4,
  MGR_VERIFIED = 5,
  MGR_REJECTED = 6,
  APPR_REVIEW_START = 7,
  APPROVED = 8,
  APPR_REJECTED = 9,
  PAYMENT_COMPLETED = 10,
}

/** Maps to user_roles.role_id in PostgreSQL. */
export enum UserRole {
  APPLICANT = 1,
  MANAGER = 2,
  APPROVER = 3,
  ACCOUNTING = 4,
  ADMIN = 5,
}

/** String role codes stored in JWT payload `role` field. */
export enum RoleCode {
  APPLICANT = 'APPLICANT',
  MANAGER = 'MANAGER',
  APPROVER = 'APPROVER',
  ACCOUNTING = 'ACCOUNTING',
  ADMIN = 'ADMIN',
}

/** Maps to payment_types.payment_type_id in PostgreSQL. */
export enum PaymentType {
  EXPENSE_REIMBURSE = 1,
  SERVICE_PAYMENT = 2,
  ADVANCE_PAYMENT = 3,
  OTHER = 4,
}

/** Maps to payment_methods.payment_method_id in PostgreSQL. */
export enum PaymentMethod {
  BANK_TRANSFER = 1,
  CASH = 2,
  CHECK = 3,
}

/** Maps to currencies.currency_id in PostgreSQL. */
export enum Currency {
  MMK = 1,
  USD = 2,
  JPY = 3,
  THB = 4,
}

// ------------------------------------------------------------------
// 2. DISPLAY CONSTANTS (enum-keyed for TypeScript exhaustiveness checks)
// ------------------------------------------------------------------

/**
 * Japanese labels for each payment status.
 * Used by StatusBadge, DataTable, and detail views.
 */
export const STATUS_LABELS_JP: Record<PaymentStatus, string> = {
  [PaymentStatus.DRAFT]: '下書き',
  [PaymentStatus.SUBMITTED_MANAGER]: 'マネージャーに提出済み',
  [PaymentStatus.MANAGER_REVIEWING]: 'マネージャー確認中',
  [PaymentStatus.MANAGER_VERIFIED]: 'マネージャー確認済み',
  [PaymentStatus.REJECTED_MANAGER]: 'マネージャー差戻し',
  [PaymentStatus.SUBMITTED_APPROVER]: '承認者に提出済み',
  [PaymentStatus.APPROVER_REVIEWING]: '承認者確認中',
  [PaymentStatus.APPROVED]: '承認済み',
  [PaymentStatus.REJECTED_APPROVER]: '承認者差戻し',
  [PaymentStatus.PAID]: '支払完了',
};

/** English labels for each payment status. */
export const STATUS_LABELS_EN: Record<PaymentStatus, string> = {
  [PaymentStatus.DRAFT]: 'Draft',
  [PaymentStatus.SUBMITTED_MANAGER]: 'Submitted to Manager',
  [PaymentStatus.MANAGER_REVIEWING]: 'Manager Reviewing',
  [PaymentStatus.MANAGER_VERIFIED]: 'Manager Verified',
  [PaymentStatus.REJECTED_MANAGER]: 'Rejected by Manager',
  [PaymentStatus.SUBMITTED_APPROVER]: 'Submitted to Approver',
  [PaymentStatus.APPROVER_REVIEWING]: 'Approver Reviewing',
  [PaymentStatus.APPROVED]: 'Approved',
  [PaymentStatus.REJECTED_APPROVER]: 'Rejected by Approver',
  [PaymentStatus.PAID]: 'Paid',
};

/**
 * English labels for each payment status.
 */
export const STATUS_LABELS_EN: Record<PaymentStatus, string> = {
  [PaymentStatus.DRAFT]: 'Draft',
  [PaymentStatus.SUBMITTED_MANAGER]: 'Submitted to Manager',
  [PaymentStatus.MANAGER_REVIEWING]: 'Manager Reviewing',
  [PaymentStatus.MANAGER_VERIFIED]: 'Manager Verified',
  [PaymentStatus.REJECTED_MANAGER]: 'Rejected by Manager',
  [PaymentStatus.SUBMITTED_APPROVER]: 'Submitted to Approver',
  [PaymentStatus.APPROVER_REVIEWING]: 'Approver Reviewing',
  [PaymentStatus.APPROVED]: 'Approved',
  [PaymentStatus.REJECTED_APPROVER]: 'Rejected by Approver',
  [PaymentStatus.PAID]: 'Paid',
};

/**
 * Tailwind CSS classes for status badges.
 * Includes `border` class as required by Design System §9.2.2.
 * Each value is a complete self-contained class string for the badge.
 */
export const STATUS_COLORS: Record<PaymentStatus, string> = {
  [PaymentStatus.DRAFT]:
    'bg-gray-100 text-gray-700 border border-gray-200',
  [PaymentStatus.SUBMITTED_MANAGER]:
    'bg-amber-50 text-amber-700 border border-amber-200',
  [PaymentStatus.MANAGER_REVIEWING]:
    'bg-amber-50 text-amber-700 border border-amber-200',
  [PaymentStatus.MANAGER_VERIFIED]:
    'bg-sky-50 text-sky-700 border border-sky-200',
  [PaymentStatus.REJECTED_MANAGER]:
    'bg-red-50 text-red-700 border border-red-200',
  [PaymentStatus.SUBMITTED_APPROVER]:
    'bg-amber-50 text-amber-700 border border-amber-200',
  [PaymentStatus.APPROVER_REVIEWING]:
    'bg-amber-50 text-amber-700 border border-amber-200',
  [PaymentStatus.APPROVED]:
    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  [PaymentStatus.REJECTED_APPROVER]:
    'bg-red-50 text-red-700 border border-red-200',
  [PaymentStatus.PAID]:
    'bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold',
};

/** Japanese labels for approval action types. Used in ApprovalTimeline. */
export const ACTION_LABELS_JP: Record<ApprovalActionType, string> = {
  [ApprovalActionType.CREATED]: '作成',
  [ApprovalActionType.EDITED]: '編集',
  [ApprovalActionType.SUBMITTED]: '提出',
  [ApprovalActionType.MGR_REVIEW_START]: 'マネージャー確認開始',
  [ApprovalActionType.MGR_VERIFIED]: 'マネージャー確認',
  [ApprovalActionType.MGR_REJECTED]: 'マネージャー差戻し',
  [ApprovalActionType.APPR_REVIEW_START]: '承認者確認開始',
  [ApprovalActionType.APPROVED]: '承認',
  [ApprovalActionType.APPR_REJECTED]: '承認者差戻し',
  [ApprovalActionType.PAYMENT_COMPLETED]: '支払完了',
};

/** English labels for approval action types. */
export const ACTION_LABELS_EN: Record<ApprovalActionType, string> = {
  [ApprovalActionType.CREATED]: 'Created',
  [ApprovalActionType.EDITED]: 'Edited',
  [ApprovalActionType.SUBMITTED]: 'Submitted',
  [ApprovalActionType.MGR_REVIEW_START]: 'Manager Review Started',
  [ApprovalActionType.MGR_VERIFIED]: 'Manager Verified',
  [ApprovalActionType.MGR_REJECTED]: 'Rejected by Manager',
  [ApprovalActionType.APPR_REVIEW_START]: 'Approver Review Started',
  [ApprovalActionType.APPROVED]: 'Approved',
  [ApprovalActionType.APPR_REJECTED]: 'Rejected by Approver',
  [ApprovalActionType.PAYMENT_COMPLETED]: 'Payment Completed',
};

/** Tailwind color classes for action type badges in ApprovalTimeline. */
export const ACTION_BADGE_COLORS: Record<ApprovalActionType, string> = {
  [ApprovalActionType.CREATED]: 'bg-gray-100 text-gray-700',
  [ApprovalActionType.EDITED]: 'bg-gray-100 text-gray-700',
  [ApprovalActionType.SUBMITTED]: 'bg-amber-100 text-amber-800',
  [ApprovalActionType.MGR_REVIEW_START]: 'bg-amber-100 text-amber-800',
  [ApprovalActionType.MGR_VERIFIED]: 'bg-sky-100 text-sky-800',
  [ApprovalActionType.MGR_REJECTED]: 'bg-red-100 text-red-800',
  [ApprovalActionType.APPR_REVIEW_START]: 'bg-amber-100 text-amber-800',
  [ApprovalActionType.APPROVED]: 'bg-emerald-100 text-emerald-800',
  [ApprovalActionType.APPR_REJECTED]: 'bg-red-100 text-red-800',
  [ApprovalActionType.PAYMENT_COMPLETED]: 'bg-emerald-200 text-emerald-900',
};

/** Japanese labels for payment type dropdown options. */
export const PAYMENT_TYPE_LABELS_JP: Record<PaymentType, string> = {
  [PaymentType.EXPENSE_REIMBURSE]: '経費精算',
  [PaymentType.SERVICE_PAYMENT]: 'サービス支払',
  [PaymentType.ADVANCE_PAYMENT]: '前払い',
  [PaymentType.OTHER]: 'その他',
};

/** English labels for payment type dropdown options. */
export const PAYMENT_TYPE_LABELS_EN: Record<PaymentType, string> = {
  [PaymentType.EXPENSE_REIMBURSE]: 'Expense Reimbursement',
  [PaymentType.SERVICE_PAYMENT]: 'Service Payment',
  [PaymentType.ADVANCE_PAYMENT]: 'Advance Payment',
  [PaymentType.OTHER]: 'Other',
};

/** Japanese labels for payment method dropdown options. */
export const PAYMENT_METHOD_LABELS_JP: Record<PaymentMethod, string> = {
  [PaymentMethod.BANK_TRANSFER]: '銀行振込',
  [PaymentMethod.CASH]: '現金',
  [PaymentMethod.CHECK]: '小切手',
};

/** English labels for payment method dropdown options. */
export const PAYMENT_METHOD_LABELS_EN: Record<PaymentMethod, string> = {
  [PaymentMethod.BANK_TRANSFER]: 'Bank Transfer',
  [PaymentMethod.CASH]: 'Cash',
  [PaymentMethod.CHECK]: 'Check',
};

/** ISO currency codes for display. */
export const CURRENCY_CODES: Record<Currency, string> = {
  [Currency.MMK]: 'MMK',
  [Currency.USD]: 'USD',
  [Currency.JPY]: 'JPY',
  [Currency.THB]: 'THB',
};

/** Japanese labels for user role display. */
export const ROLE_LABELS_JP: Record<UserRole, string> = {
  [UserRole.APPLICANT]: '申請者',
  [UserRole.MANAGER]: '担当マネージャー',
  [UserRole.APPROVER]: '最終承認者',
  [UserRole.ACCOUNTING]: '経理担当者',
  [UserRole.ADMIN]: 'システム管理者',
};

/** English labels for user role display. */
export const ROLE_LABELS_EN: Record<UserRole, string> = {
  [UserRole.APPLICANT]: 'Applicant',
  [UserRole.MANAGER]: 'Manager',
  [UserRole.APPROVER]: 'Approver',
  [UserRole.ACCOUNTING]: 'Accounting',
  [UserRole.ADMIN]: 'Admin',
};

/**
 * Status IDs where the applicant can edit the request.
 * Used in conditional rendering of Edit/Submit buttons.
 */
export const EDITABLE_STATUSES: PaymentStatus[] = [
  PaymentStatus.DRAFT,
  PaymentStatus.REJECTED_MANAGER,
  PaymentStatus.REJECTED_APPROVER,
];

/**
 * Payment methods that require bank_account_info to be filled.
 * Used in frontend validation (VAL-APP-005).
 */
export const BANK_INFO_REQUIRED_METHODS: PaymentMethod[] = [
  PaymentMethod.BANK_TRANSFER,
  PaymentMethod.CASH,
];

// ------------------------------------------------------------------
// 3. JWT PAYLOAD (decoded from localStorage accessToken)
// ------------------------------------------------------------------

/**
 * Decoded JWT payload structure.
 * Populated by authService.getCurrentUser() via base64 decode.
 * See: DD_COMMON_07 §1.2
 */
export interface JwtPayload {
  /** user_id primary key */
  sub: number;
  email: string;
  /** String role code e.g. 'APPLICANT' */
  role: string;
  /** Numeric role_id e.g. 1 */
  roleId: number;
  branch: string;
  employeeNumber: string;
  fullName: string;
  /** Issued at (Unix timestamp) — set by JWT library at signing time */
  iat: number;
  /** Expiration (Unix timestamp) — set by JWT library at signing time */
  exp: number;
}

// ------------------------------------------------------------------
// 4. ENTITY INTERFACES
// All dates are ISO 8601 strings. NUMERIC/BIGINT columns are strings.
// See: DD_COMMON_03 §3
// ------------------------------------------------------------------

export interface User {
  userId: number;
  email: string;
  fullName: string;
  employeeNumber: string;
  department: string | null;
  branch: string;
  roleId: number;
  isActive: boolean;
  createdDate: string;
  modifiedDate: string;
  lastLoginDate: string | null;
}

/** Minimal user info for display in lists and approval timelines. */
export interface UserSummary {
  userId: number;
  fullName: string;
  employeeNumber: string;
  branch: string;
}

export interface PaymentRequest {
  paymentRequestId: number;
  /** Format: PRF-YYYY-NNNNNN */
  requestNumber: string;
  applicantUserId: number;
  managerUserId: number | null;
  finalApproverUserId: number | null;
  accountingUserId: number | null;
  currentAssignedToUserId: number | null;
  /** YYYY-MM-DD */
  applicationDate: string;
  /** YYYY-MM-DD */
  desiredPaymentDate: string;
  /** NUMERIC(12,2) returned as string to prevent JS float precision loss */
  totalAmount: string;
  currencyId: number;
  paymentTypeId: number;
  paymentMethodId: number;
  purpose: string;
  bankAccountInfo: string | null;
  requestContent: string;
  hasReceipt: boolean;
  statusId: number;
  submittedToManagerDate: string | null;
  managerVerificationDate: string | null;
  submittedToApproverDate: string | null;
  approvalDate: string | null;
  paymentCompletedDate: string | null;
  createdDate: string;
  modifiedDate: string;
  isDeleted: boolean;
}

export interface PaymentBreakdownItem {
  paymentBreakdownItemId: number;
  paymentRequestId: number;
  /** 1-indexed line number, max 15 */
  lineNumber: number;
  /** YYYY-MM-DD */
  itemDate: string;
  description: string;
  /** NUMERIC(10,2) as string */
  amount: string;
  /** NUMERIC(10,2) as string, nullable */
  quantity: string | null;
  /** NUMERIC(10,2) as string, nullable */
  unitPrice: string | null;
  createdDate: string;
  modifiedDate: string;
}

export interface ApprovalLog {
  /** BIGSERIAL returned as string to prevent JS integer overflow */
  approvalLogId: string;
  paymentRequestId: number;
  actionTakenByUserId: number;
  actionTypeId: number;
  previousStatusId: number | null;
  newStatusId: number | null;
  comment: string | null;
  ipAddress: string;
  userAgent: string;
  /** ISO 8601 UTC timestamp */
  timestamp: string;
}

export interface ReceiptFile {
  receiptFileId: number;
  paymentRequestId: number;
  originalFileName: string;
  storedFileName: string;
  fileStoragePath: string;
  /** BIGINT as string (bytes) */
  fileSize: string;
  mimeType: string;
  uploadedByUserId: number;
  uploadedDate: string;
  isDeleted: boolean;
}

// ------------------------------------------------------------------
// 5. COMPOSITE VIEW TYPES (API response shapes with relations loaded)
// See: DD_COMMON_03 §4
// ------------------------------------------------------------------

/**
 * Flattened shape used in dashboard data tables.
 * Returned by list endpoints — omits heavy relation fields.
 */
export interface PaymentRequestListItem {
  paymentRequestId: number;
  requestNumber: string;
  applicationDate: string;
  totalAmount: string;
  /** Resolved currency code string e.g. 'MMK' */
  currencyCode: string;
  statusId: number;
  createdDate: string;
}

/** ApprovalLog with the actor's user info populated. */
export interface ApprovalLogWithUser extends ApprovalLog {
  actionTakenByUser: UserSummary;
}

/**
 * Full detail view returned by GET /payment-requests/:id.
 * Contains all relations: applicant, manager, breakdown items, logs, files.
 */
export interface PaymentRequestDetailView extends PaymentRequest {
  applicant: UserSummary;
  manager: UserSummary | null;
  finalApprover: UserSummary | null;
  /** Resolved currency code string */
  currencyCode: string;
  /** Resolved payment type name */
  paymentTypeName: string;
  /** Resolved payment method name */
  paymentMethodName: string;
  breakdownItems: PaymentBreakdownItem[];
  receiptFiles: ReceiptFile[];
  approvalLogs: ApprovalLogWithUser[];
}

// ------------------------------------------------------------------
// 6. API RESPONSE TYPES
// See: DD_COMMON_03 §5
// ------------------------------------------------------------------

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ValidationErrorDetail {
  field: string;
  /** Error code e.g. 'VAL-APP-001' */
  code: string;
  /** Japanese user-facing message */
  message: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: ValidationErrorDetail[];
  timestamp: string;
  path: string;
}

export interface ActionResponse {
  success: boolean;
  message: string;
}

// ------------------------------------------------------------------
// 7. FORM DATA TYPES (used in React form state management)
// See: DD_COMMON_03 §6
// ------------------------------------------------------------------

export interface PaymentRequestFormValues {
  applicationDate: string;
  desiredPaymentDate: string;
  currencyId: number | null;
  paymentTypeId: number | null;
  paymentMethodId: number | null;
  purpose: string;
  bankAccountInfo: string;
  requestContent: string;
  hasReceipt: boolean;
  /** Manager selected from dropdown */
  managerUserId: number | null;
  breakdownItems: BreakdownItemFormValues[];
}

export interface BreakdownItemFormValues {
  lineNumber: number;
  itemDate: string;
  description: string;
  /** Stored as string to preserve decimal display in inputs */
  amount: string;
  quantity: string;
  unitPrice: string;
}

/** Generic option shape for select dropdowns populated from lookup endpoints. */
export interface LookupOption {
  id: number;
  code: string;
  name: string;
}

// ------------------------------------------------------------------
// 8. WEBSOCKET EVENT PAYLOADS
// See: DD_COMMON_03 §7, Development Rules §8.4
// ------------------------------------------------------------------

export interface StatusUpdatePayload {
  paymentRequestId: number;
  requestNumber: string;
  previousStatusId: number;
  newStatusId: number;
  actionByUserId: number;
  actionByUserName: string;
  timestamp: string;
}

export interface NotificationPayload {
  type: 'status_change' | 'action_required';
  title: string;
  message: string;
  paymentRequestId: number;
  timestamp: string;
}
