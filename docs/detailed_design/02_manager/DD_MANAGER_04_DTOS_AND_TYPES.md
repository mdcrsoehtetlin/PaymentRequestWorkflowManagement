# DD_MANAGER_04 窶・DTOs and Types

> **Doc ID:** PRWM-DD-MANAGER-04 | **Version:** 1.0 | **Status:** Draft  
> **Last Updated:** YYYY-MM-DD

---

## 1. Overview

This document specifies the Data Transfer Objects (DTOs) used by the `manager` module's API endpoints.

- **Location:** `src/modules/manager/dto/`

---

## 2. Request DTOs

### 2.1 `ActionmanagerDto`

Used for `POST /api/v1/...`.

```typescript
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class ActionmanagerDto {
  // Define properties, types, and validation decorators
  
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
```

*(Duplicate section 2.1 for each DTO in the module)*

---

## 3. Custom Response Types (If Any)

[Define any module-specific TypeScript interfaces returned by the API that are not already in the Shared Types document.]

---

## 4. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_TEMPLATE_03](./DD_TEMPLATE_03_API_ENDPOINTS.md) | Endpoints that consume these DTOs |
| [DD_COMMON_04](../../00_common/DD_COMMON_04_SHARED_VALIDATION.md) | Base validation rules |
