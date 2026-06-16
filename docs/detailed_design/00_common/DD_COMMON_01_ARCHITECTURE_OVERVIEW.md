# DD_COMMON_01 — Architecture Overview

> **Doc ID:** PRWM-DD-COM-001 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-16

---

## 1. System Overview

The Payment Request Workflow Management (PRWM) system is a dual-application architecture — a **NestJS REST API backend** and a **React SPA frontend** — connected via HTTP and WebSocket protocols.

### 1.1 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Backend Framework** | NestJS | 11.x | REST API, dependency injection, modular architecture |
| **Backend Language** | TypeScript | 5.7+ | Strict mode, type safety |
| **ORM** | TypeORM | 0.3.20 | PostgreSQL entity mapping, query builder, migrations |
| **Database** | PostgreSQL | 16 | Primary data store, ACID transactions |
| **Cache / Session** | Redis (Memurai) | 4+ | Session storage, caching, rate limiting |
| **Auth** | Passport + JWT | RS256 | Authentication, role-based access control |
| **Validation** | class-validator / class-transformer | 0.14+ | DTO validation, input sanitization |
| **WebSocket** | Socket.IO | 4.8+ | Real-time status notifications |
| **Frontend Framework** | React | 19 | Component-based SPA |
| **Frontend Build** | Vite | 8.x | Dev server, bundling, HMR |
| **Frontend CSS** | Tailwind CSS | 3.x | Utility-first styling |
| **Frontend Routing** | react-router-dom | 7.x | Client-side routing |
| **HTTP Client** | Axios | 1.7+ | API communication |
| **Icons** | lucide-react | 0.469+ | Icon library |
| **Testing** | Jest + Supertest | 30+ | Unit, integration, E2E tests |

---

## 2. System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        Browser["Browser (Chrome/Edge)"]
    end

    subgraph "Frontend (React + Vite)"
        ViteDev["Vite Dev Server<br/>:5173"]
        ReactApp["React SPA"]
        AxiosClient["Axios HTTP Client"]
        SocketClient["Socket.IO Client"]
    end

    subgraph "Backend (NestJS)"
        NestAPI["NestJS API Server<br/>:3000"]
        WSGateway["WebSocket Gateway<br/>:3001"]
        
        subgraph "Request Pipeline"
            Middleware["Global Middleware<br/>(CORS, Rate Limit, Logger)"]
            Guards["Guards<br/>(JWT → Roles → Ownership)"]
            Pipes["Validation Pipe<br/>(class-validator)"]
            Controllers["Controllers<br/>(Route Handlers)"]
            Services["Services<br/>(Business Logic)"]
        end
    end

    subgraph "Data Layer"
        PostgreSQL["PostgreSQL 16<br/>:5432<br/>payment_request_db"]
        Redis["Redis (Memurai)<br/>:6379"]
        FileSystem["Local File System<br/>./uploads/"]
    end

    Browser --> ViteDev
    ViteDev --> ReactApp
    ReactApp --> AxiosClient
    ReactApp --> SocketClient
    AxiosClient -->|"/api/* proxy"| NestAPI
    SocketClient -->|"WS :3001"| WSGateway

    NestAPI --> Middleware --> Guards --> Pipes --> Controllers --> Services
    Services --> PostgreSQL
    Services --> Redis
    Services --> FileSystem
    Services --> WSGateway

    style Browser fill:#e2e8f0
    style NestAPI fill:#1e3a8a,color:#fff
    style WSGateway fill:#1e3a8a,color:#fff
    style PostgreSQL fill:#336791,color:#fff
    style Redis fill:#dc382d,color:#fff
    style ViteDev fill:#646cff,color:#fff
```

---

## 3. Four-Layer Architecture

```mermaid
graph LR
    subgraph "Layer 1: Presentation"
        A1["React Pages"]
        A2["Shared Components"]
        A3["Hooks & Services"]
    end

    subgraph "Layer 2: API"
        B1["Controllers"]
        B2["DTOs"]
        B3["Guards & Decorators"]
    end

    subgraph "Layer 3: Business Logic"
        C1["Services"]
        C2["Validators"]
        C3["WebSocket Gateway"]
    end

    subgraph "Layer 4: Data Access"
        D1["TypeORM Entities"]
        D2["Repositories"]
        D3["Migrations"]
    end

    A1 --> B1
    A3 --> B1
    B1 --> C1
    B2 --> C1
    C1 --> D1
    C1 --> D2
    C3 --> A3
```

### Layer Responsibilities

| Layer | Responsibility | Allowed Dependencies |
|-------|---------------|---------------------|
| **Presentation** | UI rendering, form handling, client-side state, API calls | Layer 2 (via HTTP/WS), shared types |
| **API** | Route handling, request validation, response formatting | Layer 3, DTOs, Guards |
| **Business Logic** | Core business rules, status transitions, audit logging, notifications | Layer 4, shared services |
| **Data Access** | Database queries, transactions, entity definitions | PostgreSQL, Redis |

### Dependency Rules

| ✅ Allowed | ❌ Forbidden |
|------------|-------------|
| Layer 1 → Layer 2 (via HTTP) | Layer 2 → Layer 1 |
| Layer 2 → Layer 3 | Layer 4 → Layer 3 |
| Layer 3 → Layer 4 | Layer 1 → Layer 4 (direct DB access) |
| Any layer → Shared types/enums | Cross-module imports (e.g., applicant → manager) |

---

## 4. Request/Response Flow

### 4.1 REST API Call Flow

```mermaid
sequenceDiagram
    participant Browser
    participant Vite as Vite Proxy (:5173)
    participant NestJS as NestJS API (:3000)
    participant Guard as Auth Guards
    participant Pipe as Validation Pipe
    participant Controller
    participant Service
    participant TypeORM as TypeORM
    participant DB as PostgreSQL

    Browser->>Vite: GET /api/v1/applicant/payment-requests
    Vite->>NestJS: Proxy → localhost:3000
    NestJS->>Guard: JwtAuthGuard → RolesGuard
    Guard-->>NestJS: ✅ Authorized (APPLICANT)
    NestJS->>Pipe: Validate Query DTO
    Pipe-->>NestJS: ✅ Valid
    NestJS->>Controller: getMyRequests(userId, query)
    Controller->>Service: getMyRequests(userId, page, limit, statusId)
    Service->>TypeORM: createQueryBuilder()
    TypeORM->>DB: SELECT ... WHERE applicant_user_id = $1
    DB-->>TypeORM: ResultSet
    TypeORM-->>Service: Entity[]
    Service-->>Controller: { data, meta }
    Controller-->>NestJS: Response JSON
    NestJS-->>Vite: 200 OK
    Vite-->>Browser: JSON Response
```

### 4.2 WebSocket Notification Flow

```mermaid
sequenceDiagram
    participant Applicant as Applicant Browser
    participant API as NestJS API
    participant WS as WebSocket Gateway (:3001)
    participant Manager as Manager Browser

    Note over Applicant,Manager: Applicant submits request to Manager

    Applicant->>API: POST /submit-manager
    API->>API: Update status 1→2
    API->>API: Create approval_log
    API->>WS: sendStatusUpdate("MANAGER", payload)
    API->>WS: sendPersonalNotification(managerId, payload)
    API-->>Applicant: 200 OK (updated request)
    WS-->>Manager: emit("statusUpdate", payload)
    WS-->>Manager: emit("notification", payload)
    Manager->>Manager: Refresh dashboard, show toast
```

---

## 5. Module Communication Architecture

### 5.1 Module Isolation

```mermaid
graph TB
    subgraph "Shared Module"
        Entities["TypeORM Entities<br/>(5 entities)"]
        WSGateway["WebSocket Gateway"]
        Guards["Auth Guards"]
        Filters["Exception Filters"]
    end

    subgraph "Feature Modules (Isolated)"
        App["Applicant Module"]
        Mgr["Manager Module"]
        Apr["Approver Module"]
        Acc["Accounting Module"]
        Adm["Admin Module"]
    end

    App -->|"imports"| Entities
    App -->|"uses"| WSGateway
    Mgr -->|"imports"| Entities
    Mgr -->|"uses"| WSGateway
    Apr -->|"imports"| Entities
    Acc -->|"imports"| Entities
    Adm -->|"imports"| Entities

    App -.-x|"FORBIDDEN"| Mgr
    Mgr -.-x|"FORBIDDEN"| Apr
    Apr -.-x|"FORBIDDEN"| Acc

    style App fill:#dbeafe
    style Mgr fill:#fef3c7
    style Apr fill:#e0e7ff
    style Acc fill:#fce7f3
    style Adm fill:#d1fae5
```

### 5.2 Communication Rules

| Rule | Description |
|------|-------------|
| **Import Shared** | ✅ All modules may import from `SharedModule` (entities, gateway) |
| **Cross-Module Import** | ❌ FORBIDDEN. `applicant.service.ts` must NEVER import from `manager.service.ts` |
| **Cross-Module Communication** | Use WebSocket events or shared database records only |
| **Shared Layer Modification** | Requires Project Leader approval + regression test of all modules |

---

## 6. Environment & Port Allocation

| Service | Default Port | Config Variable |
|---------|-------------|----------------|
| NestJS API Server | 3000 | `APP_PORT` |
| WebSocket Gateway | 3001 | `WS_PORT` |
| Vite Dev Server | 5173 | `vite.config.ts → server.port` |
| PostgreSQL | 5432 | `DB_PORT` |
| Redis (Memurai) | 6379 | `REDIS_PORT` |

### Vite Proxy Configuration

| Frontend Path | Proxied To | Purpose |
|--------------|-----------|---------|
| `/api/*` | `http://localhost:3000` | All REST API calls |
| `/socket.io/*` | `http://localhost:3001` (WebSocket) | Socket.IO transport |

---

## 7. Security Architecture

```mermaid
graph LR
    subgraph "3-Layer Guard Chain"
        G1["JwtAuthGuard<br/>Validates JWT token"]
        G2["RolesGuard<br/>Checks @Roles() metadata"]
        G3["OwnershipGuard<br/>Verifies resource ownership"]
    end

    Request["Incoming Request"] --> G1 --> G2 --> G3 --> Handler["Controller Handler"]
    G1 -->|"401"| Reject1["Unauthorized"]
    G2 -->|"403"| Reject2["Forbidden (wrong role)"]
    G3 -->|"403"| Reject3["Forbidden (not owner)"]
```

| Security Layer | Implementation | Details |
|---------------|---------------|---------|
| **Authentication** | JWT (RS256) | Access token: 15min, Refresh token: 7 days (HttpOnly cookie) |
| **Password** | bcrypt | 12 salt rounds |
| **Session** | Redis | `session:{token}`, 1h sliding TTL |
| **Authorization** | RBAC | 5 roles, guard chain per endpoint |
| **Input Validation** | class-validator | On every DTO |
| **File Upload** | MIME whitelist | PDF, JPEG, JPG, PNG; max 10MB/file |
| **CORS** | Whitelist | Via environment variable |
| **Rate Limiting** | Redis counter | 100/min global, 10/min auth |

---

## 8. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_COMMON_02](./DD_COMMON_02_PROJECT_STRUCTURE.md) | Detailed file/folder structure |
| [DD_COMMON_07](./DD_COMMON_07_AUTH_AND_MIDDLEWARE.md) | Full auth/middleware specification |
| [DD_COMMON_09](./DD_COMMON_09_DATABASE_ACCESS_PATTERNS.md) | TypeORM patterns and transactions |
| [Development Rules](../../core_ja/02_開発ルール_DEVELOPMENT_RULES.md) | Binding coding standards |
| [Environment Setup](../../guides/ENVIRONMENT_SETUP_GUIDE.md) | Local development setup |
