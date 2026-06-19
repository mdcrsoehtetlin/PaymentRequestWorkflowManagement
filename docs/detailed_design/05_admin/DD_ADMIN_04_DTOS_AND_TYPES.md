# DD_ADMIN_04 — DTOs and Types

> **Doc ID:** PRWM-DD-ADM-04 | **Version:** 1.0 | **Status:** Draft  
> **Last Updated:** 2026-06-17

---

## 1. Overview

This document specifies the Data Transfer Objects (DTOs) and response types
used by the Admin module's API endpoints.

- **Location:** `src/modules/admin/dto/`

The Admin DTOs cover three functional areas:

1. User management
2. Read-only master data verification
3. Global audit log inspection

---

## 2. Request DTOs

### 2.1 `QueryAdminUsersDto`

Used for `GET /api/v1/admin/users`.

```typescript
import { IsOptional, IsString, IsEnum, IsInt, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export enum AdminUserSortField {
  EMPLOYEE_NUMBER = 'employeeNumber',
  FULL_NAME = 'fullName',
  EMAIL = 'email',
  BRANCH = 'branch',
  ROLE_NAME = 'roleName',
  IS_ACTIVE = 'isActive',
}

export enum AdminUserStatusFilter {
  ALL = 'ALL',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class QueryAdminUsersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roleId?: number;

  @IsOptional()
  @IsEnum(AdminUserStatusFilter)
  status?: AdminUserStatusFilter = AdminUserStatusFilter.ALL;

  @IsOptional()
  @IsEnum(AdminUserSortField)
  sortBy?: AdminUserSortField = AdminUserSortField.EMPLOYEE_NUMBER;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.ASC;
}
```

### 2.2 `CreateAdminUserDto`

Used for `POST /api/v1/admin/users`.

```typescript
import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAdminUserDto {
  @IsString()
  @MaxLength(20)
  employeeNumber: string;

  @IsString()
  @MaxLength(200)
  fullName: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MaxLength(100)
  branch: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  roleId: number;

  @IsBoolean()
  isActive: boolean;
}
```

### 2.3 `UpdateAdminUserDto`

Used for `PATCH /api/v1/admin/users/:id`.

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateAdminUserDto } from './create-admin-user.dto';

export class UpdateAdminUserDto extends PartialType(CreateAdminUserDto) {}
```

### 2.4 `ToggleUserActiveDto`

Used for `PATCH /api/v1/admin/users/:id/toggle-active`.

```typescript
import { IsBoolean } from 'class-validator';

export class ToggleUserActiveDto {
  @IsBoolean()
  isActive: boolean;
}
```

### 2.5 `QueryMasterDataDto`

Used for `GET /api/v1/admin/master-data`.

```typescript
import { IsEnum, IsOptional } from 'class-validator';

export enum MasterDataCategory {
  SYSTEM_ROLES = 'SYSTEM_ROLES',
  PAYMENT_STATUSES = 'PAYMENT_STATUSES',
  PAYMENT_TYPES = 'PAYMENT_TYPES',
  PAYMENT_METHODS = 'PAYMENT_METHODS',
  CURRENCIES = 'CURRENCIES',
}

export class QueryMasterDataDto {
  @IsOptional()
  @IsEnum(MasterDataCategory)
  category?: MasterDataCategory = MasterDataCategory.PAYMENT_TYPES;
}
```

### 2.6 `QueryAuditLogsDto`

Used for `GET /api/v1/admin/audit-logs`.

```typescript
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAuditLogsDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  startDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 50;
}
```

---

## 3. Custom Response Types

### 3.1 `AdminUserListItem`

Used by the user list table.

```typescript
export interface AdminUserListItem {
  userId: number;
  employeeNumber: string;
  fullName: string;
  email: string;
  branch: string;
  roleId: number;
  roleName: string;
  isActive: boolean;
}
```

### 3.2 `AdminUserDetail`

Used by register/edit and detail reads.

```typescript
export interface AdminUserDetail extends AdminUserListItem {
  createdDate: string;
  modifiedDate: string;
  lastLoginDate?: string | null;
}
```

### 3.3 `MasterDataRow`

Used by the read-only master data workspace.

```typescript
export interface MasterDataRow {
  id: number;
  code: string;
  name: string;
  isActive?: boolean;
  displayOrder?: number;
}
```

### 3.4 `MasterDataResponse`

```typescript
import { MasterDataCategory } from './query-master-data.dto';

export interface MasterDataResponse {
  category: MasterDataCategory;
  rows: MasterDataRow[];
}
```

### 3.5 `AuditLogListItem`

Used by the audit log table.

```typescript
export interface AuditLogListItem {
  approvalLogId: string;
  timestamp: string;
  requestNumber: string;
  actionType: string;
  performedBy: string;
  ipAddress: string;
  comment?: string | null;
}
```

### 3.6 `AuditLogDetail`

Used by the right-side metadata panel in the audit log workspace.

```typescript
export interface AuditLogDetail extends AuditLogListItem {
  previousStatus?: string | null;
  newStatus?: string | null;
  userAgent?: string | null;
}
```

### 3.7 `PaginatedResponse<T>`

Shared response envelope used by list endpoints.

```typescript
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

## 4. Shared Type Notes

- `AdminUserStatusFilter` matches the User Management status dropdown
  (`All`, `Active`, `Inactive`).
- `MasterDataCategory` defines the allowed master data tabs in the Admin UI.
- User forms intentionally do not include payment workflow fields.
- The admin user form does not expose receipt, payment, approval, or password
  fields.

---

## 5. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_ADMIN_03](./DD_ADMIN_03_API_ENDPOINTS.md) | Endpoints that consume these DTOs |
| [DD_ADMIN_02](./DD_ADMIN_02_FRONTEND_ADMIN_PANEL.md) | Frontend page design and data usage |
| [DD_ADMIN_05](./DD_ADMIN_05_BUSINESS_LOGIC.md) | Service-layer logic that uses these DTOs |
| [DD_COMMON_04](../00_common/DD_COMMON_04_SHARED_VALIDATION.md) | Base validation rules |
| [DD_COMMON_03](../00_common/DD_COMMON_03_SHARED_TYPES.md) | Shared enums and common response envelopes |
