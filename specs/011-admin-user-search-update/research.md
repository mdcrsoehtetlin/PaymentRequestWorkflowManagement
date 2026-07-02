# Phase 0: Research

**Decision**: Use standard TypeORM query builder with conditional `andWhere` clauses.
**Rationale**: Simplest and most robust way to handle dynamic AND conditions without complex object construction.
**Alternatives considered**: Using `find` options object (can be tricky with dynamic AND/OR combinations and `Like` operators).

**Decision**: Handle `EMP-` prefix purely on the frontend UI component.
**Rationale**: The `EMP-` prefix is a visual affordance. The backend should only care about the pure data value (the number itself).
**Alternatives considered**: Backend stripping of the prefix. Rejected because it complicates the backend API contract and violates separation of concerns.
