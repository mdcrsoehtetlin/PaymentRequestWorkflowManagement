export enum PaymentStatus {
  DRAFT = 1,
  SUBMITTED_MANAGER = 2,
  REJECTED_MANAGER = 3,
  APPROVED_MANAGER = 4,
  SUBMITTED_APPROVER = 5,
  REJECTED_APPROVER = 6,
  APPROVED_APPROVER = 7,
  PROCESSING_ACCOUNTING = 8,
  COMPLETED = 9,
}

export enum ApprovalActionType {
  SUBMITTED = 1,
  APPROVED = 2,
  REJECTED = 3,
  RETURNED = 4,
}

export enum RoleCode {
  APPLICANT = 'APPLICANT',
  MANAGER = 'MANAGER',
  APPROVER = 'APPROVER',
  ACCOUNTING = 'ACCOUNTING',
  ADMIN = 'ADMIN',
}

export interface JwtPayload {
  sub: number;
  email: string;
  role: RoleCode;
  roleId: number;
  branch: string;
  employeeNumber: string;
  fullName: string;
  iat?: number;
  exp?: number;
}

export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: { field: string; code: string; message: string }[];
  timestamp: string;
  path: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export const STATUS_LABELS_JP: Record<number, string> = {
  [PaymentStatus.DRAFT]: '下書き',
  [PaymentStatus.SUBMITTED_MANAGER]: '課長承認待ち',
  [PaymentStatus.REJECTED_MANAGER]: '課長差戻し',
  [PaymentStatus.APPROVED_MANAGER]: '課長承認済',
  [PaymentStatus.SUBMITTED_APPROVER]: '部長承認待ち',
  [PaymentStatus.REJECTED_APPROVER]: '部長差戻し',
  [PaymentStatus.APPROVED_APPROVER]: '部長承認済',
  [PaymentStatus.PROCESSING_ACCOUNTING]: '経理処理中',
  [PaymentStatus.COMPLETED]: '完了',
};

export const STATUS_COLORS: Record<number, string> = {
  [PaymentStatus.DRAFT]: 'bg-slate-100 text-slate-800',
  [PaymentStatus.SUBMITTED_MANAGER]: 'bg-amber-100 text-amber-800',
  [PaymentStatus.REJECTED_MANAGER]: 'bg-red-100 text-red-800',
  [PaymentStatus.APPROVED_MANAGER]: 'bg-blue-100 text-blue-800',
  [PaymentStatus.SUBMITTED_APPROVER]: 'bg-amber-100 text-amber-800',
  [PaymentStatus.REJECTED_APPROVER]: 'bg-red-100 text-red-800',
  [PaymentStatus.APPROVED_APPROVER]: 'bg-blue-100 text-blue-800',
  [PaymentStatus.PROCESSING_ACCOUNTING]: 'bg-purple-100 text-purple-800',
  [PaymentStatus.COMPLETED]: 'bg-emerald-100 text-emerald-800',
};

export const EDITABLE_STATUSES = [
  PaymentStatus.DRAFT,
  PaymentStatus.REJECTED_MANAGER,
  PaymentStatus.REJECTED_APPROVER,
];

export const ACTION_LABELS_JP: Record<number, string> = {
  [ApprovalActionType.SUBMITTED]: '申請',
  [ApprovalActionType.APPROVED]: '承認',
  [ApprovalActionType.REJECTED]: '却下',
  [ApprovalActionType.RETURNED]: '差戻し',
};

export const ACTION_BADGE_COLORS: Record<number, string> = {
  [ApprovalActionType.SUBMITTED]: 'bg-blue-100 text-blue-800',
  [ApprovalActionType.APPROVED]: 'bg-emerald-100 text-emerald-800',
  [ApprovalActionType.REJECTED]: 'bg-red-100 text-red-800',
  [ApprovalActionType.RETURNED]: 'bg-amber-100 text-amber-800',
};
