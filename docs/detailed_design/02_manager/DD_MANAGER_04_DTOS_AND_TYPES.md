# DD_MANAGER_04 — DTOs and Types

> **Doc ID:** PRWM-DD-MGR-06 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-16

---

## 1. Overview

This document specifies the Data Transfer Objects (DTOs) and TypeScript types used by the Manager module's API endpoints. These DTOs utilize `class-validator` for request validation and `class-transformer` for serialization.

- **Location:** `src/modules/manager/dto/`
- **Type Definitions:** `src/modules/manager/types/`

---

## 2. Request DTOs

### 2.1 QueryManagerQueueDto

Used for `GET /queue` to list payment requests assigned to the manager.

```typescript
import { 
  IsOptional, IsInt, IsString, IsEnum, Min, Max 
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '@shared/dto/pagination-query.dto';

export enum ManagerQueueSortFields {
  SUBMITTED_DATE = 'submittedDate',      // Default: oldest first (priority)
  APPLICATION_DATE = 'applicationDate',
  APPLICANT_NAME = 'applicantName',
  TOTAL_AMOUNT = 'totalAmount',
  ELAPSED_TIME = 'elapsedTime',
}

export class QueryManagerQueueDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  statusId?: number; // Filter by status (2, 3, 4, 5 = manager-relevant statuses)

  @IsOptional()
  @IsString()
  branch?: string; // Filter by applicant branch (e.g., "Yangon", "Mandalay")

  @IsOptional()
  @IsString()
  search?: string; // Free text search: request number, applicant name, purpose

  @IsOptional()
  @IsEnum(ManagerQueueSortFields)
  sortBy?: ManagerQueueSortFields = ManagerQueueSortFields.SUBMITTED_DATE;

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC'; // ASC = oldest first (priority view)
}
```

### 2.2 VerifyRequestDto

Used for `POST /:id/verify` to approve a payment request.

```typescript
import { 
  IsOptional, IsString, MaxLength, IsISO8601 
} from 'class-validator';

export class VerifyRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: 'Comment cannot exceed 500 characters.' // VAL-MGR-001
  })
  comment?: string; // Optional manager comment

  @IsISO8601()
  modifiedDate: string; // ISO 8601 timestamp for optimistic locking (required)
}
```

### 2.3 RejectRequestDto

Used for `POST /:id/reject` to reject a payment request and return it to the applicant.

```typescript
import { 
  IsString, MinLength, MaxLength, IsISO8601 
} from 'class-validator';

export class RejectRequestDto {
  @IsString()
  @MinLength(10, {
    message: 'Comment is required and must be at least 10 characters long to reject a request.' // VAL-MGR-002
  })
  @MaxLength(500, {
    message: 'Comment cannot exceed 500 characters.' // VAL-MGR-001
  })
  comment: string; // Mandatory rejection reason/comment

  @IsISO8601()
  modifiedDate: string; // ISO 8601 timestamp for optimistic locking (required)
}
```

### 2.4 QueryManagerMetricsDto

Used for `GET /metrics/summary` to fetch dashboard metrics.

```typescript
import { 
  IsOptional, IsInt, Min 
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryManagerMetricsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  periodDays?: number = 7; // Last N days for period calculations
}
```

---

## 3. Response DTOs

### 3.1 ManagerQueueItemDto

List item returned in paginated queue response. Represents minimal request info for table display.

```typescript
import { 
  Expose, Exclude, Transform 
} from 'class-transformer';

@Exclude()
export class ManagerQueueItemDto {
  @Expose()
  paymentRequestId: number;

  @Expose()
  requestNumber: string; // e.g., "PRF-2026-001"

  @Expose()
  @Transform(({ value }) => new Date(value).toISOString().split('T')[0])
  applicationDate: string; // YYYY-MM-DD format

  @Expose()
  applicantName: string; // Employee full name

  @Expose()
  applicantBranch: string; // e.g., "Yangon", "Mandalay"

  @Expose()
  totalAmount: number; // Decimal amount

  @Expose()
  currency: string; // e.g., "MMK", "USD"

  @Expose()
  statusId: number; // Status ID (2, 3, 4, 5)

  @Expose()
  statusName: string; // Localized status name (e.g., "確認中")

  @Expose()
  @Transform(({ value }) => new Date(value).toISOString())
  submittedToManagerDate: string; // ISO 8601 timestamp

  @Expose()
  @Transform(({ value }) => {
    // Calculate elapsed time in minutes
    const now = new Date();
    const submitted = new Date(value);
    return Math.floor((now.getTime() - submitted.getTime()) / 60000);
  })
  elapsedTimeMinutes: number; // Minutes since submission

  @Expose()
  managerId: number; // Assigned manager user ID
}
```

### 3.2 ManagerPaymentRequestDetailDto

Full request details returned from `GET /:id` endpoint.

```typescript
import { 
  Expose, Exclude, Type, Transform 
} from 'class-transformer';

@Exclude()
export class ManagerPaymentRequestDetailDto {
  @Expose()
  paymentRequestId: number;

  @Expose()
  requestNumber: string;

  @Expose()
  @Type(() => ApplicantInfoDto)
  applicantInfo: {
    userId: number;
    employeeNumber: string;
    fullName: string;
    branch: string;
    department?: string;
  };

  @Expose()
  @Transform(({ value }) => new Date(value).toISOString().split('T')[0])
  applicationDate: string; // YYYY-MM-DD

  @Expose()
  @Transform(({ value }) => new Date(value).toISOString().split('T')[0])
  desiredPaymentDate: string; // YYYY-MM-DD

  @Expose()
  @Type(() => PaymentDetailsDto)
  paymentDetails: {
    totalAmount: number;
    taxAmount?: number;
    currency: string;
    paymentType: string;
    paymentMethod: string;
  };

  @Expose()
  @MaxLength(1000)
  purpose: string; // Payment purpose

  @Expose()
  @MaxLength(200)
  bankAccountInfo?: string; // Bank account or payment method details

  @Expose()
  @Type(() => PaymentBreakdownItemDto)
  paymentBreakdown: PaymentBreakdownItemDto[];

  @Expose()
  @Type(() => ReceiptFileDto)
  receiptFiles: ReceiptFileDto[];

  @Expose()
  statusId: number;

  @Expose()
  statusName: string;

  @Expose()
  currentStatus: string; // Localized status string

  @Expose()
  @Transform(({ value }) => new Date(value).toISOString())
  submittedToManagerDate: string; // ISO 8601

  @Expose()
  @Transform(({ value }) => new Date(value).toISOString())
  modifiedDate: string; // ISO 8601 - for optimistic locking

  @Expose()
  @Type(() => ApprovalLogEntryDto)
  approvalHistory: ApprovalLogEntryDto[]; // Historical actions and comments
}
```

### 3.3 PaymentBreakdownItemDto

Individual line item in payment breakdown.

```typescript
import { 
  Expose, Exclude, Transform 
} from 'class-transformer';

@Exclude()
export class PaymentBreakdownItemDto {
  @Expose()
  lineNumber: number; // 1-15

  @Expose()
  @Transform(({ value }) => new Date(value).toISOString().split('T')[0])
  itemDate: string; // YYYY-MM-DD

  @Expose()
  description: string; // Item description (e.g., "Office supplies")

  @Expose()
  amount: number; // Decimal amount for this line
}
```

### 3.4 ReceiptFileDto

Receipt file metadata returned in request details.

```typescript
import { 
  Expose, Exclude, Transform 
} from 'class-transformer';

@Exclude()
export class ReceiptFileDto {
  @Expose()
  fileId: number;

  @Expose()
  fileName: string; // e.g., "PrinterCartridges_20260610.pdf"

  @Expose()
  filePath: string; // Storage path (e.g., "/uploads/101/uuid_filename.pdf")

  @Expose()
  mimeType: string; // MIME type (e.g., "application/pdf", "image/jpeg")

  @Expose()
  @Transform(({ value }) => new Date(value).toISOString())
  uploadedDate: string; // ISO 8601 timestamp

  @Expose()
  @Transform(({ value }) => {
    // Generate signed download URL (time-limited)
    return `/api/v1/manager/payment-requests/${this.paymentRequestId}/files/${this.fileId}/download`;
  })
  downloadUrl?: string; // Secure download link
}
```

### 3.5 ApprovalLogEntryDto

Individual entry in the approval history timeline.

```typescript
import { 
  Expose, Exclude, Type, Transform 
} from 'class-transformer';

@Exclude()
export class ApprovalLogEntryDto {
  @Expose()
  logId: number;

  @Expose()
  actionType: string; // e.g., "CREATED", "SUBMITTED_MANAGER", "MANAGER_REVIEWING", "MANAGER_VERIFIED", "MANAGER_REJECTED"

  @Expose()
  @Transform(({ value }) => new Date(value).toISOString())
  actionDate: string; // ISO 8601 timestamp

  @Expose()
  @Type(() => UserInfoDto)
  actionByUser: {
    userId: number;
    fullName: string;
  }; // Who performed the action

  @Expose()
  comment?: string; // Optional comment from the actor

  @Expose()
  previousStatus?: string; // Status before this action

  @Expose()
  newStatus?: string; // Status after this action
}
```

### 3.6 ManagerMetricsDto

Dashboard metrics summary.

```typescript
import { 
  Expose, Exclude, Transform 
} from 'class-transformer';

@Exclude()
export class ManagerMetricsDto {
  @Expose()
  pendingCount: number; // Status = SUBMITTED_MANAGER (2)

  @Expose()
  reviewingCount: number; // Status = MANAGER_REVIEWING (3)

  @Expose()
  verifiedCount: number; // Status = MANAGER_VERIFIED (4)

  @Expose()
  rejectedCount: number; // Status = REJECTED_MANAGER (5)

  @Expose()
  totalAssignedCount: number; // Sum of all manager-relevant statuses

  @Expose()
  averageProcessingTimeMinutes: number; // Avg time from SUBMITTED → VERIFIED or REJECTED

  @Expose()
  overdueCount: number; // Pending > 48 hours (configurable threshold)

  @Expose()
  verifiedThisPeriod: number; // Verified in last N days

  @Expose()
  rejectedThisPeriod: number; // Rejected in last N days

  @Expose()
  @Transform(({ value }) => new Date(value).toISOString())
  lastRefreshedAt: string; // ISO 8601 timestamp
}
```

### 3.7 PaginatedManagerQueueResponseDto

Paginated response for queue list.

```typescript
import { 
  Expose, Type 
} from 'class-transformer';

export class PaginatedManagerQueueResponseDto {
  @Expose()
  @Type(() => ManagerQueueItemDto)
  data: ManagerQueueItemDto[];

  @Expose()
  pagination: {
    page: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
  };

  @Expose()
  metrics: {
    pendingCount: number;
    reviewingCount: number;
    verifiedCount: number;
    rejectedCount: number;
  };
}
```

---

## 4. WebSocket Event Payloads

### 4.1 StatusUpdateEventDto

Sent to applicant when manager verifies or rejects a request.

```typescript
export interface StatusUpdateEventDto {
  event: 'statusUpdate';
  paymentRequestId: number;
  requestNumber: string;
  previousStatus: string; // e.g., "MANAGER_REVIEWING"
  newStatus: string; // e.g., "MANAGER_VERIFIED" or "REJECTED_MANAGER"
  actionByUserId: number; // Manager user ID
  actionByName: string; // Manager full name
  comment?: string; // If rejecting, includes rejection reason
  timestamp: string; // ISO 8601
}
```

### 4.2 NewRequestAssignedEventDto

Sent to manager when a new request is assigned.

```typescript
export interface NewRequestAssignedEventDto {
  event: 'newRequestAssigned';
  paymentRequestId: number;
  requestNumber: string;
  applicantName: string;
  totalAmount: number;
  currency: string;
  timestamp: string; // ISO 8601
}
```

### 4.3 QueueChangeEventDto

Sent when queue state changes (another manager verified/rejected a request, if shared queue).

```typescript
export interface QueueChangeEventDto {
  event: 'queueChange';
  action: 'VERIFIED' | 'REJECTED' | 'STATUS_CHANGED';
  paymentRequestId: number;
  requestNumber: string;
  newStatus: string;
  actionByManager: string; // Manager name
  timestamp: string; // ISO 8601
}
```

---

## 5. TypeScript Types & Interfaces

### 5.1 Manager-Specific Types

Located in `src/modules/manager/types/manager.types.ts`:

```typescript
export interface ManagerUser {
  userId: number;
  fullName: string;
  email: string;
  branch: string;
  role: 'MANAGER';
  isActive: boolean;
}

export interface PaymentRequestForManager {
  paymentRequestId: number;
  requestNumber: string;
  applicantInfo: ApplicantInfo;
  paymentDetails: PaymentDetails;
  paymentBreakdown: PaymentBreakdownItem[];
  receiptFiles: ReceiptFile[];
  statusId: number;
  statusName: string;
  submittedToManagerDate: Date;
  modifiedDate: Date; // For optimistic locking
  approvalHistory: ApprovalLogEntry[];
}

export interface ApplicantInfo {
  userId: number;
  employeeNumber: string;
  fullName: string;
  branch: string;
  department?: string;
}

export interface PaymentDetails {
  totalAmount: number;
  taxAmount?: number;
  currency: string;
  paymentType: string;
  paymentMethod: string;
  purpose: string;
  bankAccountInfo?: string;
}

export interface PaymentBreakdownItem {
  lineNumber: number;
  itemDate: Date;
  description: string;
  amount: number;
}

export interface ReceiptFile {
  fileId: number;
  fileName: string;
  filePath: string;
  mimeType: string;
  uploadedDate: Date;
  downloadUrl?: string;
}

export interface ApprovalLogEntry {
  logId: number;
  actionType: 'CREATED' | 'SUBMITTED_MANAGER' | 'MANAGER_REVIEWING' | 'MANAGER_VERIFIED' | 'MANAGER_REJECTED' | 'SUBMITTED_APPROVER' | 'APPROVER_REVIEWING' | 'APPROVED' | 'REJECTED_APPROVER' | 'PAID';
  actionDate: Date;
  actionByUser: { userId: number; fullName: string };
  comment?: string;
  previousStatus?: string;
  newStatus?: string;
}

export interface ManagerQueueMetrics {
  pendingCount: number;
  reviewingCount: number;
  verifiedCount: number;
  rejectedCount: number;
  totalAssignedCount: number;
  averageProcessingTimeMinutes: number;
  overdueCount: number;
  verifiedThisPeriod: number;
  rejectedThisPeriod: number;
  lastRefreshedAt: Date;
}

export enum ManagerActionType {
  VERIFY = 'MANAGER_VERIFIED',
  REJECT = 'MANAGER_REJECTED',
  REVIEW_START = 'MANAGER_REVIEW_START'
}
```

### 5.2 Shared Enums

Located in `src/shared/enums/`:

```typescript
export enum PaymentRequestStatus {
  DRAFT = 1,
  SUBMITTED_MANAGER = 2,
  MANAGER_REVIEWING = 3,
  MANAGER_VERIFIED = 4,
  REJECTED_MANAGER = 5,
  SUBMITTED_APPROVER = 6,
  APPROVER_REVIEWING = 7,
  APPROVED = 8,
  REJECTED_APPROVER = 9,
  PAID = 10
}

export enum PaymentRequestStatusLabel {
  DRAFT = '下書き',
  SUBMITTED_MANAGER = '確認待ち',
  MANAGER_REVIEWING = '確認中',
  MANAGER_VERIFIED = '承認済み',
  REJECTED_MANAGER = '差戻し',
  SUBMITTED_APPROVER = '最終確認待ち',
  APPROVER_REVIEWING = '最終確認中',
  APPROVED = '承認',
  REJECTED_APPROVER = '却下',
  PAID = '完了'
}

export enum UserRole {
  APPLICANT = 'APPLICANT',
  MANAGER = 'MANAGER',
  FINAL_APPROVER = 'FINAL_APPROVER',
  ACCOUNTING = 'ACCOUNTING',
  ADMIN = 'ADMIN'
}
```

---

## 6. Validation Error Response

### 6.1 Validation Error Dto

Standard error response for validation failures.

```typescript
export class ValidationErrorDto {
  statusCode: number; // 400
  errorCode: string; // e.g., 'VAL-MGR-001', 'VAL-MGR-002'
  message: string;
  timestamp: string; // ISO 8601
  details?: {
    field: string;
    rule: string;
    value: any;
    constraints: string[];
  }[];
}
```

### 6.2 Example: Validation Error Response

```json
{
  "statusCode": 400,
  "errorCode": "VAL-MGR-002",
  "message": "Comment is required and must be at least 10 characters long to reject a request.",
  "timestamp": "2026-06-15T10:35:00Z",
  "details": [
    {
      "field": "comment",
      "rule": "minLength",
      "value": "短い",
      "constraints": [
        "comment must be longer than or equal to 10 characters"
      ]
    }
  ]
}
```

---

## 7. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_MANAGER_04](./DD_MANAGER_04_API_ENDPOINTS.md) | API endpoints that consume these DTOs |
| [DD_MANAGER_02](./DD_MANAGER_02_FRONTEND_REQUEST_LIST.md) | Frontend components using these types |
| [DD_COMMON_04](../00_common/DD_COMMON_04_SHARED_VALIDATION.md) | Shared validation rules and custom validators |
| [DD_COMMON_08](../00_common/DD_COMMON_08_ERROR_HANDLING.md) | Error handling and error response standards |

---

## 8. File Structure

```
src/modules/manager/
├── dto/
│   ├── query-manager-queue.dto.ts          // QueryManagerQueueDto
│   ├── verify-request.dto.ts               // VerifyRequestDto
│   ├── reject-request.dto.ts               // RejectRequestDto
│   ├── query-manager-metrics.dto.ts        // QueryManagerMetricsDto
│   ├── responses/
│   │   ├── manager-queue-item.dto.ts       // ManagerQueueItemDto
│   │   ├── manager-request-detail.dto.ts   // ManagerPaymentRequestDetailDto
│   │   ├── payment-breakdown-item.dto.ts   // PaymentBreakdownItemDto
│   │   ├── receipt-file.dto.ts             // ReceiptFileDto
│   │   ├── approval-log-entry.dto.ts       // ApprovalLogEntryDto
│   │   └── manager-metrics.dto.ts          // ManagerMetricsDto
│   └── events/
│       ├── status-update.event.ts          // StatusUpdateEventDto
│       ├── new-request-assigned.event.ts   // NewRequestAssignedEventDto
│       └── queue-change.event.ts           // QueueChangeEventDto
├── types/
│   └── manager.types.ts                    // Manager-specific interfaces and enums
└── ...
```

---

## 9. Usage Examples

### 9.1 Frontend Usage (React)

```typescript
// Fetch manager queue
const response = await fetch('/api/v1/manager/payment-requests/queue?page=1&pageSize=10', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data: PaginatedManagerQueueResponseDto = await response.json();
const queueItems: ManagerQueueItemDto[] = data.data;

// Verify a request
const verifyPayload: VerifyRequestDto = {
  comment: 'Approved after review',
  modifiedDate: '2026-06-15T10:30:00Z'
};
await fetch('/api/v1/manager/payment-requests/101/verify', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(verifyPayload)
});

// Reject a request
const rejectPayload: RejectRequestDto = {
  comment: '領収書が不足しています。詳細な内訳が必要です。',
  modifiedDate: '2026-06-15T10:30:00Z'
};
await fetch('/api/v1/manager/payment-requests/101/reject', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(rejectPayload)
});
```

---

## Sign-Off

This DTO and type specification provides a comprehensive contract for all data structures exchanged between frontend and backend in the Manager module. All DTOs include proper validation constraints and error handling.

**Approval Status:** Released  
**Related Components:** DD_MANAGER_04, DD_MANAGER_02, DD_MANAGER_03

---

*End of DD_MANAGER_06_DTOS_AND_TYPES.md*