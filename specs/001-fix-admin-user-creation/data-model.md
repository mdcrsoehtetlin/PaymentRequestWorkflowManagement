# Data Model: Fix Admin User Creation Password Validation Error

**Date**: 2026-06-24
**Feature**: fix-admin-user-creation

## Overview

This fix does not introduce new entities or modify the database schema. It only changes the validation behavior of the `CreateUserDto` class.

## Entities (Unchanged)

### User Account (existing)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `user_id` | SERIAL | PK, auto-increment | Primary key |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Login identifier |
| `password_hash` | VARCHAR(512) | NOT NULL | Bcrypt hash (12 rounds) |
| `full_name` | VARCHAR(200) | NOT NULL | User's full name |
| `employee_number` | VARCHAR(20) | UNIQUE, NOT NULL | Employee ID |
| `department` | VARCHAR(100) | NULLABLE | Department name |
| `branch` | VARCHAR(100) | NOT NULL | Office branch |
| `role_id` | INT | FK → user_roles, NOT NULL | User's role |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Account status |
| `created_date` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation |
| `modified_date` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last modification |
| `last_login_date` | TIMESTAMPTZ | NULLABLE | Last login timestamp |

### Temporary Password (not an entity)

- **Generated server-side**: 8-character alphanumeric string
- **Lifecycle**: Generated → Displayed to admin → Hashed → Stored → Plaintext discarded
- **Not stored**: Plaintext is never persisted; only the hash is stored

## DTO Changes

### CreateUserDto (Modified)

**Before:**
```typescript
export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  employeeNumber: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  fullName: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  branch: string;

  @IsNotEmpty()
  @IsInt()
  roleId: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsNotEmpty()        // ❌ CAUSES VALIDATION ERROR
  @IsString()          // ❌ CAUSES VALIDATION ERROR
  @MinLength(8)        // ❌ CAUSES VALIDATION ERROR
  @MaxLength(50)       // ❌ CAUSES VALIDATION ERROR
  password: string;
}
```

**After:**
```typescript
export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  employeeNumber: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  fullName: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  branch: string;

  @IsNotEmpty()
  @IsInt()
  roleId: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()        // ✅ Field is now optional
  @IsString()          // ✅ Type safety maintained
  password?: string;   // ✅ Optional field
}
```

## Validation Rules (Updated)

| Field | Old Rule | New Rule | Reason |
|-------|----------|----------|--------|
| `password` | Required, 8-50 chars | Optional, string only | Auto-generated server-side |

## State Transitions

No state transitions are affected by this fix.

## Relationships

No relationship changes required.

---

*End of Data Model*
