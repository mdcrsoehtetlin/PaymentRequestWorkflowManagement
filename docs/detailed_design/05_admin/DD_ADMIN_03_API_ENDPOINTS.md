# DD_ADMIN_03 窶・API Endpoints

> **Doc ID:** PRWM-DD-ADMIN-03 | **Version:** 1.0 | **Status:** Draft  
> **Last Updated:** YYYY-MM-DD

---

## 1. Controller Setup

- **File:** `src/modules/admin/admin.controller.ts`
- **Base Route:** `/api/v1/admin`
- **Guards:** `@UseGuards(JwtAuthGuard, RolesGuard)` with `@Roles('Admin')`

---

## 2. API Endpoints Contract

### 2.1 [HTTP METHOD] [PATH]

[Brief description of the endpoint's purpose.]

- **Query Params:** [DTO Name or None]
- **URL Params:** [e.g., `id` (ParseIntPipe)]
- **Body:** [DTO Name or None]
- **Response:** `200 OK` `[ResponseType]`
- **Logic:** Calls `service.{methodName}(...)`

*(Duplicate section 2.1 for each endpoint in the module)*

---

## 3. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_TEMPLATE_04](./DD_TEMPLATE_04_DTOS_AND_TYPES.md) | DTO definitions |
| [DD_TEMPLATE_05](./DD_TEMPLATE_05_BUSINESS_LOGIC.md) | Service layer logic |
