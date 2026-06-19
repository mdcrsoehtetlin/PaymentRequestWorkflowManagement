// ============================================================
// src/modules/shared/types/index.ts
// Shared types, enums, and interfaces for the backend.
// Single source of truth — all modules import from here.
// See: docs/detailed_design/00_common/DD_COMMON_03_SHARED_TYPES.md
// ============================================================

// ------------------------------------------------------------------
// 1. ENUMS — Map directly to database lookup table IDs
// ------------------------------------------------------------------

/**
 * Maps to payment_statuses.status_id in PostgreSQL.
 * CRITICAL: These integer values must exactly match the DB rows.
 * See: 03_データベース設計書_DATABASE_SPEC.md §3.4
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
 * Used in approval_logs to record what action was performed.
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

/**
 * Maps to user_roles.role_id in PostgreSQL.
 * Numeric enum used in RBAC guards and JWT roleId field.
 */
export enum UserRole {
  APPLICANT = 1,
  MANAGER = 2,
  APPROVER = 3,
  ACCOUNTING = 4,
  ADMIN = 5,
}

/**
 * String role codes used in JWT payload `role` field and @Roles() decorator.
 * RolesGuard compares user.role (string) against these values.
 */
export enum RoleCode {
  APPLICANT = 'APPLICANT',
  MANAGER = 'MANAGER',
  APPROVER = 'APPROVER',
  ACCOUNTING = 'ACCOUNTING',
  ADMIN = 'ADMIN',
}

/**
 * Maps to payment_types.payment_type_id in PostgreSQL.
 */
export enum PaymentType {
  EXPENSE_REIMBURSE = 1,
  SERVICE_PAYMENT = 2,
  ADVANCE_PAYMENT = 3,
  OTHER = 4,
}

/**
 * Maps to payment_methods.payment_method_id in PostgreSQL.
 */
export enum PaymentMethod {
  BANK_TRANSFER = 1,
  CASH = 2,
  CHECK = 3,
}

/**
 * Maps to currencies.currency_id in PostgreSQL.
 */
export enum Currency {
  MMK = 1,
  USD = 2,
  JPY = 3,
  THB = 4,
}

// ------------------------------------------------------------------
// 2. HELPER CONSTANTS
// ------------------------------------------------------------------

/**
 * Status IDs that allow the applicant to edit the request.
 * Used in service-layer business rule checks.
 * See: DD_COMMON_08 error code ERR-APP-422-01
 */
export const EDITABLE_STATUSES: PaymentStatus[] = [
  PaymentStatus.DRAFT,
  PaymentStatus.REJECTED_MANAGER,
  PaymentStatus.REJECTED_APPROVER,
];

/**
 * Payment methods that REQUIRE bank_account_info to be filled.
 * See: VAL-APP-005 in DD_COMMON_04.
 */
export const BANK_INFO_REQUIRED_METHODS: PaymentMethod[] = [
  PaymentMethod.BANK_TRANSFER,
  PaymentMethod.CASH,
];

export const ROLE_CODES: Record<UserRole, RoleCode> = {
  [UserRole.APPLICANT]: RoleCode.APPLICANT,
  [UserRole.MANAGER]: RoleCode.MANAGER,
  [UserRole.APPROVER]: RoleCode.APPROVER,
  [UserRole.ACCOUNTING]: RoleCode.ACCOUNTING,
  [UserRole.ADMIN]: RoleCode.ADMIN,
};

export const CURRENCY_CODES: Record<Currency, string> = {
  [Currency.MMK]: 'MMK',
  [Currency.USD]: 'USD',
  [Currency.JPY]: 'JPY',
  [Currency.THB]: 'THB',
};

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

export const PAYMENT_TYPE_LABELS_JP: Record<PaymentType, string> = {
  [PaymentType.EXPENSE_REIMBURSE]: '経費精算',
  [PaymentType.SERVICE_PAYMENT]: 'サービス支払',
  [PaymentType.ADVANCE_PAYMENT]: '前払い',
  [PaymentType.OTHER]: 'その他',
};

export const PAYMENT_METHOD_LABELS_JP: Record<PaymentMethod, string> = {
  [PaymentMethod.BANK_TRANSFER]: '銀行振込',
  [PaymentMethod.CASH]: '現金',
  [PaymentMethod.CHECK]: '小切手',
};

export const ROLE_LABELS_JP: Record<UserRole, string> = {
  [UserRole.APPLICANT]: '申請者',
  [UserRole.MANAGER]: '担当マネージャー',
  [UserRole.APPROVER]: '最終承認者',
  [UserRole.ACCOUNTING]: '経理担当者',
  [UserRole.ADMIN]: 'システム管理者',
};

// ------------------------------------------------------------------
// 3. JWT PAYLOAD
// ------------------------------------------------------------------

/**
 * Structure of the decoded JWT payload attached to every request.
 * Available via the @CurrentUser() decorator in controllers.
 * See: DD_COMMON_07 §1.2, Development Rules §5.2
 */
export interface JwtPayload {
  /** user_id — primary key from the users table */
  sub: number;
  email: string;
  /** String role code e.g. 'APPLICANT' — matches RoleCode enum */
  role: string;
  /** Numeric role_id from user_roles table — matches UserRole enum */
  roleId: number;
  /** User's branch name — critical for Mandalay alert business logic */
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
