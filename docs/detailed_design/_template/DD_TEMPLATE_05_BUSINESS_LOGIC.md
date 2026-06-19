# DD_{MODULE}_05 — Business Logic

> **Doc ID:** PRWM-DD-{MOD}-05 | **Version:** 1.0 | **Status:** Draft  
> **Last Updated:** YYYY-MM-DD

---

## 1. Overview

This document specifies the core business logic, transaction boundaries, and state transition rules implemented in the `{ModuleName}Service`.

- **Location:** `src/modules/{moduleName}/{moduleName}.service.ts`

---

## 2. Core Service Methods

### 2.1 `methodName(userId: number, dto: DtoClass)`

1. **Guards/Validation:** [e.g., Check if request status is correct, ownership check]
2. **Logic:**
   - [Step 1: Update PaymentRequest status]
   - [Step 2: Insert ApprovalLog with specific action type]
   - [Step 3: Any specific business calculation]
   - **Notification:** [e.g., Call WebsocketGateway]
3. **Transaction Boundaries:** [Define what tables must be wrapped in a single DB transaction]

*(Duplicate section 2.1 for each major business action)*

---

## 3. Data Calculation & Validation Rules

[Detail any specific business rules from the Requirement Specification that apply here.]

### 3.1 Rule A
- [Condition and Enforcement]

---

## 4. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [Requirement Spec](../../../core_ja/01_要件定義書_REQUIREMENT_SPEC.md) | Source business rules |
