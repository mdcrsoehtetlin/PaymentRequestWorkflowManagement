# Database Access Patterns Audit Report

**Target Document:** `DD_COMMON_09_DATABASE_ACCESS_PATTERNS.md`  
**Audit Scope:** Completeness, Exactness, and Deviations of the TypeORM entities, query patterns, transaction handling, and pagination mapping.

## ✅ Fully Compliant

*   **TypeORM Entities Handling (NUMERIC Types):** The requirement to map PostgreSQL `NUMERIC` types to `string` in TypeScript to prevent precision loss is strictly followed. Variables like `totalAmount` in `payment-request.entity.ts` and `amount`, `quantity`, `unitPrice` in `payment-breakdown-item.entity.ts` correctly use `@Column({ type: 'numeric', ... })` and are typed as `string`.
*   **TypeORM Entities Handling (Date Types):** `Date` mappings perfectly align with the document. Timestamps like `createdDate` map to standard TS `Date` using `@CreateDateColumn`, and `applicationDate` strictly defines `type: 'date'` mapped to `Date | string`.
*   **Foreign Keys and Relations:** Relationships correctly and explicitly define join column names, such as `@JoinColumn({ name: 'applicant_user_id' }) applicant: User;`.
*   **Transaction Management Pattern:** Multi-table operations correctly use the `DataSource` transaction manager. E.g., `ApplicantService.submitToManager` successfully wraps `PaymentRequest` updates and `ApprovalLog` creations inside `this.dataSource.transaction(async (manager: EntityManager) => { ... })`.
*   **Pagination Implementation:** The `buildPaginationMeta` utility function (`src/modules/shared/utils/pagination.util.ts`) flawlessly matches the exact logic, signature, and mathematical calculation `Math.ceil(totalItems / pageSize)` described in the documentation.
*   **Version Column Annotation:** The `@VersionColumn() version: number;` is properly present on the `PaymentRequest` entity to enable optimistic locking.

## ❌ Missing Implementations

*   **Concurrent Modification Handling:**
    *   **No OptimisticLockVersionMismatchError Handling:** The specification requires wrapping update logic in a try-catch block to catch `OptimisticLockVersionMismatchError` and throw a specific `ConflictException('この申請は他のユーザーによって更新されました')`. This is **completely missing** from the codebase.
    *   **Missing Update Endpoint:** The documented `@Patch(':id') async update(...)` endpoint intended to demonstrate optimistic locking with version payloads does not exist.
*   **Soft Delete Logic:**
    *   The document explicitly describes the pattern for soft deleting (`await this.repo.update(id, { isDeleted: true });`). However, in `ApplicantService.softDeleteDraft`, the logic is missing entirely; it only contains a `// Soft delete logic placeholder` comment.
*   **Basic CRUD Completion:** `submitToApprover` in `ApplicantService` only contains `// Update logic placeholder` instead of database interaction logic.

## ⚠️ Deviations & Mismatches

*   **QueryBuilder Lacks Specified Join:** The documentation's `QueryBuilder` example (Section 3.2) explicitly includes `.leftJoinAndSelect('pr.applicant', 'applicant')` to eagerly load relations during pagination. The implementation in `ApplicantService.getMyRequests` omits this join completely, meaning the result sets will be missing the required applicant relation data.
*   **Transaction Audit Log Abstraction:** Section 4.1's exact snippet demonstrates creating the `ApprovalLog` directly within the transaction block via `manager.create(...)` and `manager.save(...)`. The codebase deviated from this by abstracting the log creation into `this.auditLogService.createLog(manager, ...)`. While functionally correct and arguably a cleaner architecture, it is technically an undocumented deviation from the explicit reference code.
