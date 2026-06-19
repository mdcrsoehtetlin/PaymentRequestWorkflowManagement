# DD_COMMON_09 — Database Access Patterns

> **Doc ID:** PRWM-DD-COM-09 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-16

---

## 1. Overview

The system uses **TypeORM** to access PostgreSQL. This document defines the standard patterns for queries, transactions, pagination, and data handling (especially `NUMERIC` types).

---

## 2. TypeORM Entity Patterns

All entities must extend standard TypeORM annotations and strictly map to the `03_データベース設計書_DATABASE_SPEC.md` schema.

### 2.1 NUMERIC Handling (CRITICAL)

PostgreSQL `NUMERIC` (and `BIGINT`) must be mapped to `string` in TypeScript to prevent precision loss.

```typescript
// Correct mapping
@Column({ type: 'numeric', precision: 12, scale: 2 })
amount: string;

// INCORRECT — will cause JS precision loss
// @Column({ type: 'numeric', precision: 12, scale: 2 })
// amount: number; 
```

### 2.2 Date Handling

Use standard TS `Date` for timestamps, mapped to `timestamp` or `timestamptz`.

```typescript
@CreateDateColumn({ name: 'created_date' })
createdDate: Date;

@UpdateDateColumn({ name: 'modified_date' })
modifiedDate: Date;

@Column({ type: 'date', name: 'application_date' })
applicationDate: string; // 'YYYY-MM-DD'
```

### 2.3 Foreign Keys and Relations

Relationships must explicitly define the join column name.

```typescript
@ManyToOne(() => User)
@JoinColumn({ name: 'applicant_user_id' })
applicant: User;
```

---

## 3. Query Patterns

### 3.1 Basic CRUD (Repository API)

Use the standard Repository methods for simple operations.

```typescript
// Find one by ID
const request = await this.repo.findOne({
  where: { paymentRequestId: id, isDeleted: false },
  relations: ['applicant', 'breakdownItems'],
});

// Insert new
const newRequest = this.repo.create(dtoData);
await this.repo.save(newRequest);

// Soft delete
await this.repo.update(id, { isDeleted: true });
```

### 3.2 Complex Queries (QueryBuilder)

Use `QueryBuilder` for complex joins, aggregations, or dynamic filtering.

```typescript
async findFilteredRequests(
  userId: number,
  statusId?: number,
  page: number = 1,
  limit: number = 10
): Promise<[PaymentRequest[], number]> {
  const query = this.repo.createQueryBuilder('pr')
    .leftJoinAndSelect('pr.applicant', 'applicant')
    .where('pr.applicantUserId = :userId', { userId })
    .andWhere('pr.isDeleted = false');

  if (statusId) {
    query.andWhere('pr.statusId = :statusId', { statusId });
  }

  query.orderBy('pr.createdDate', 'DESC')
    .skip((page - 1) * limit)
    .take(limit);

  // getManyAndCount returns both data and total items for pagination
  return query.getManyAndCount();
}
```

---

## 4. Transaction Management

Any operation that modifies multiple tables (e.g., submitting a request creates the request, breakdown items, and an approval log) MUST be wrapped in a transaction.

### 4.1 Transaction Pattern (DataSource)

```typescript
import { DataSource, EntityManager } from 'typeorm';

@Injectable()
export class ApplicantService {
  constructor(private dataSource: DataSource) {}

  async submitToManager(id: number, userId: number, dto: SubmitToManagerDto) {
    // Start transaction
    return await this.dataSource.transaction(async (manager: EntityManager) => {
      
      // 1. Update PaymentRequest
      await manager.update(PaymentRequest, id, {
        statusId: PaymentStatus.SUBMITTED_MANAGER,
        managerUserId: dto.managerUserId,
        submittedToManagerDate: new Date(),
      });

      // 2. Create ApprovalLog
      const log = manager.create(ApprovalLog, {
        paymentRequestId: id,
        actionTakenByUserId: userId,
        actionTypeId: ApprovalActionType.SUBMITTED,
        previousStatusId: PaymentStatus.DRAFT,
        newStatusId: PaymentStatus.SUBMITTED_MANAGER,
        comment: dto.comment || null,
        ipAddress: 'extracted_from_req',
        userAgent: 'extracted_from_req',
      });
      await manager.save(log);

      return true; // Commit
    }); // Rollback automatically on throw
  }
}
```

---

## 5. Pagination Implementation

Standardize pagination calculation across all modules.

```typescript
export function buildPaginationMeta(
  totalItems: number,
  page: number,
  pageSize: number
): PaginationMeta {
  return {
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
  };
}

// Controller usage
const [items, total] = await this.service.findAll(page, pageSize);
return {
  data: items,
  meta: buildPaginationMeta(total, page, pageSize),
};
```

---

## 6. Concurrent Modification (Optimistic Locking)

To prevent users from overwriting each other's changes, use the `modifiedDate` or a dedicated `version` column.

```typescript
// Entity definition
@VersionColumn()
version: number;

// Update payload includes version
@Patch(':id')
async update(@Param('id') id: number, @Body() dto: UpdateDto) {
  try {
    const request = await this.repo.findOneBy({ paymentRequestId: id });
    if (request.version !== dto.version) {
       // Handled by TypeORM implicitly if save() is used with version
       // Or manually throw
    }
    
    // TypeORM automatically increments version on save
    Object.assign(request, dto);
    await this.repo.save(request);
  } catch (error) {
    if (error instanceof OptimisticLockVersionMismatchError) {
      throw new ConflictException('この申請は他のユーザーによって更新されました');
    }
    throw error;
  }
}
```

---

## 7. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_COMMON_08](./DD_COMMON_08_ERROR_HANDLING.md) | Mapping DB errors to HTTP exceptions |
| [DD_APPLICANT_07](../01_applicant/DD_APPLICANT_07_BUSINESS_LOGIC.md) | Transaction boundaries in the Applicant module |
| [Database Spec](../../core_ja/03_データベース設計書_DATABASE_SPEC.md) | Database schema details |
