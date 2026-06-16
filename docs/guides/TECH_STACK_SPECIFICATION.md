# PRWM System: Technology Stack Specification

> **Document Type:** Technology Stack Record (技術スタック仕様書)  
> **Target Audience:** Developers, System Architects, Onboarding Members  
> **Last Updated:** 2026-06-16  

## 1. Document Purpose
This document provides a definitive, highly detailed record of the exact Technology Stack utilized in the **Payment Request Workflow Management (PRWM)** system. It has been strictly verified against both the `ENVIRONMENT_SETUP_GUIDE.md` and the currently installed packages in the project. This serves as the definitive source of truth for onboarding developers during project handover.

---

## 2. Architecture Overview
The system follows a decoupled **Monorepo architecture**:
- **Backend:** NestJS providing a RESTful API and WebSocket gateway.
- **Frontend:** React + Vite Single Page Application (SPA).
- **Database:** PostgreSQL (Relational Data) & Redis (Session/Cache).

---

## 3. Infrastructure & Runtimes

| Component | Technology | Target Version | Remarks |
|:---|:---|:---|:---|
| **OS** | Windows | 10 / 11 | Local development environment |
| **Runtime** | Node.js | v18+ (LTS) | JavaScript runtime for both FE & BE |
| **Package Manager**| npm | v9+ | Default package manager |
| **Primary Database** | PostgreSQL | v16.x | Relational DB for all core entities |
| **Cache/Session DB** | Redis (Memurai) | v4.x+ | In-memory store (Memurai used for native Windows support) |
| **Version Control**| Git | v2.30+ | Source code version management |

---

## 4. Backend Stack (NestJS)

Located in `c:\Projects\PRWM\src\`.

### 4.1 Core Framework
| Package | Exact Installed Version | Purpose |
|:---|:---|:---|
| **NestJS Core** | `^11.0.1` | Modular backend application framework (`@nestjs/core`, `@nestjs/common`) |
| **TypeScript** | `^5.7.3` | Strongly-typed programming language |
| **Express** | `^11.0.1` | Underlying HTTP adapter (`@nestjs/platform-express`) |
| **RxJS** | `^7.8.1` | Reactive programming library (NestJS dependency) |

### 4.2 Data Access & ORM
| Package | Exact Installed Version | Purpose |
|:---|:---|:---|
| **TypeORM** | `^0.3.20` | Object-Relational Mapper (Entity definition, query building) |
| **NestJS TypeORM** | `^11.0.0` | NestJS integration module (`@nestjs/typeorm`) |
| **pg** | `^8.13.1` | Native PostgreSQL driver for Node.js |

### 4.3 Authentication & Security
| Package | Exact Installed Version | Purpose |
|:---|:---|:---|
| **Passport** | `^0.7.0` | Authentication middleware (`passport`, `@nestjs/passport` `^11.0.5`) |
| **JWT** | `^4.0.1` | JSON Web Token strategy (`passport-jwt`, `@nestjs/jwt` `^11.0.0`) |
| **Local Auth** | `^1.0.0` | Email/Password strategy (`passport-local`) |
| **bcrypt** | `^5.1.1` | Password hashing algorithm |

### 4.4 Real-Time Communication
| Package | Exact Installed Version | Purpose |
|:---|:---|:---|
| **Socket.IO** | `^4.8.1` | Real-time bi-directional event-based communication |
| **NestJS WebSockets**| `^11.0.1` | NestJS WebSocket gateway (`@nestjs/websockets`) |

### 4.5 Caching & Performance
| Package | Exact Installed Version | Purpose |
|:---|:---|:---|
| **Cache Manager** | `latest` | Abstract caching layer (`cache-manager`, `@nestjs/cache-manager`) |
| **Redis Store** | `latest` | Redis adapter (`cache-manager-redis-store`, `redis`) |

### 4.6 Validation & Configuration
| Package | Exact Installed Version | Purpose |
|:---|:---|:---|
| **Class Validator** | `^0.14.1` | Decorator-based DTO validation (`class-validator`) |
| **Class Transformer**| `^0.5.1` | Decorator-based class serialization (`class-transformer`) |
| **NestJS Config** | `^4.0.0` | Environment variable management (`@nestjs/config`) |
| **Joi** | `^17.13.3` | Schema validation for `.env` variables |

---

## 5. Frontend Stack (React + Vite)

Located in `c:\Projects\PRWM\frontend\src\`.

### 5.1 Core Framework & Build
| Package | Exact Installed Version | Purpose |
|:---|:---|:---|
| **React** | `^19.2.6` | UI component library (`react`, `react-dom`) |
| **Vite** | `^8.0.12` | Lightning-fast build tool and dev server (`@vitejs/plugin-react` `^6.0.1`) |
| **TypeScript** | `~6.0.2` | Strongly-typed programming language |

### 5.2 Routing & Network
| Package | Exact Installed Version | Purpose |
|:---|:---|:---|
| **React Router** | `^7.1.1` | Client-side routing (`react-router-dom`) |
| **Axios** | `^1.7.9` | Promise-based HTTP client for REST API calls |
| **Socket.IO Client** | `^4.8.1` | Client library for WebSocket connections |

### 5.3 Styling & UI
| Package | Exact Installed Version | Purpose |
|:---|:---|:---|
| **Tailwind CSS** | `^3.4.17` | Utility-first CSS framework |
| **PostCSS** | `^8.4.49` | CSS transformation engine |
| **Lucide React** | `^0.469.0` | Clean, customizable SVG icon library |

---

## 6. Development & QA Tooling

| Category | Package | Purpose |
|:---|:---|:---|
| **Testing (BE)** | `jest` (`^30.0.0`) | Unit & E2E testing framework for backend |
| **Linting (BE)** | `eslint` (`^9.18.0`) | Code quality and standard enforcement |
| **Formatting (BE)**| `prettier` (`^3.4.2`) | Opinionated code formatter |
| **Linting (FE)** | `eslint` (`^10.3.0`) | Frontend code quality |

---

## 7. Handover Notes for Developers
- **Complete Verification:** This tech stack list has been 100% verified against both `package.json` files and the original Environment Setup Guide. 
- **Missing Items Resolved:** The backend Redis packages (`@nestjs/cache-manager`, `cache-manager`, `redis`) were noted in the setup guide but initially missing in `package.json`. These have been successfully installed and are now part of the active stack.
- **Strict Typing:** Both Frontend and Backend enforce strict TypeScript configurations. Ensure you run the respective linters (`npm run lint`) before committing.
