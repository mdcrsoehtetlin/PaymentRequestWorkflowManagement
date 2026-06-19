# Architecture Audit Report

**Target Document:** `DD_COMMON_01_ARCHITECTURE_OVERVIEW.md`  
**Audit Scope:** Completeness, Exactness, and Deviations of the current codebase against the Architecture Overview.

## ✅ Fully Compliant

*   **Technology Stack & Foundation:** NestJS, React + Vite, PostgreSQL + TypeORM, and Socket.IO are correctly bootstrapped and configured.
*   **Module Isolation:** The folder structure strictly isolates feature modules (`applicant`, `manager`, `approver`, `accounting`, `admin`) and a `shared` module, strictly adhering to the dependency rules.
*   **TypeORM Entities:** Exactly 5 database entities exist in `shared/entities` (`approval-log`, `payment-breakdown-item`, `payment-request`, `receipt-file`, `user`).
*   **Security Guards (RBAC & Ownership):** `JwtAuthGuard`, `RolesGuard`, and `OwnershipGuard` are present. The `OwnershipGuard` accurately checks if the requester owns the resource.
*   **Enums & Types:** `src/modules/shared/types/index.ts` correctly maps string roles and numeric database IDs. `UserRole` (5 numeric roles), `RoleCode` (5 string roles), `PaymentStatus` (10 statuses), and `ApprovalActionType` (10 types) exactly match the specification.
*   **WebSocket Gateway Methods:** The `websocket.gateway.ts` properly implements `sendStatusUpdate` and `sendPersonalNotification` to mimic the push-notification flow defined in the documentation.
*   **File Upload Limits:** The `.env` file correctly defines `MAX_FILE_SIZE=10485760` (10MB), fulfilling the specification constraints.

## ❌ Missing Implementations

*   **Rate Limiting (Global & Auth):** The specification requires a Redis counter to limit requests (100/min globally, 10/min for auth). There is no `ThrottlerModule` or custom rate-limiter set up in `app.module.ts`.
*   **Redis Session Storage:** The design dictates that tokens must be stored in Redis as `session:{token}` with a 1-hour sliding TTL. The current `auth.service.ts` only generates stateless JWTs and does not integrate with Redis for session validation/invalidation.

## ⚠️ Deviations & Mismatches

*   **Environment & Port Allocations:**
    *   *Spec:* API Server on `3000`, WebSocket Gateway on `3001`.
    *   *Code:* `main.ts` listens to `process.env.PORT ?? 3005` (ignoring `APP_PORT=3000` from `.env`). 
    *   *WebSocket:* The `@WebSocketGateway()` decorator lacks a specific port configuration, causing it to fall back to the main HTTP server's port (`3005`). 
    *   *Vite Config:* The `vite.config.ts` proxy incorrectly forwards both `/api` and `/socket.io` to `http://127.0.0.1:3005`.
*   **JWT Algorithm & Expiration Time:**
    *   *Spec:* RS256 algorithm. Access Token: 15 minutes.
    *   *Code:* The JWT is signed using the default symmetric algorithm (`HS256`). Furthermore, the `.env` configuration sets `JWT_EXPIRATION=3600s` (1 hour) instead of 15 minutes.
*   **Module Structure:** An `auth` module exists in `src/modules/auth`. While this is a standard NestJS practice, it is technically an extra module that is not explicitly represented in the isolated 5-Feature Module architecture diagram. 
