# Feature Specification: Date Format Standardization

**Feature Branch**: `feature/006-date-format-standardization`

**Created**: 2026-06-23

**Status**: Draft

**Input**: User description: "date format change. eg. that is date time format -2026/5/28 10:30:00. that is date format 2026/5/28"

**Constitution Version**: 2.2.0

## Constitution Compliance

This feature adheres to the following constitution principles:

| Principle | Section | Compliance |
|-----------|---------|------------|
| I. Naming Conventions & Type Safety | §1.1, §1.2, §1.5 | Utility file MUST use `kebab-case` (`date-formatter.ts`); functions MUST use `camelCase` (`formatDisplayDate`, `formatDisplayDateTime`); all return types MUST be explicitly annotated; JSDoc `@description` and `@returns` tags required on public methods; imports MUST follow strict ordering |
| II. Module-Based Directory Isolation | §2.2, §2.4 | Utility MUST be placed in the shared layer (`frontend/src/utils/date-formatter.ts`) — shared layer is accessible to all modules without approval; no cross-module imports required |
| V. Global UI/UX Design System | §9.2.2, §9.3.2 | Date format is a visual standard affecting all status displays, tables, and detail panels; typography consistency MUST be maintained using the `Inter` font type scale |
| VI. Architecture Compliance | §10.1, §10.2 | Presentation layer only (frontend display format); no changes to API layer (backend remains ISO 8601); path alias `@/utils/date-formatter` MUST be used |
| VII. Performance | §10.3 | No performance impact — utility function is a pure synchronous transformation with no caching required |
| VIII. Git Branching & Commits | §3 | Branch naming: `feature/006-date-format-standardization`; commit prefix: `feat: dates-standardize date format display` |

## User Scenarios & Testing

### User Story 1 — Consistent Date and DateTime Display (Priority: P1)

A user viewing any screen in the application (audit logs, payment request details, user management, timestamps) sees dates and date-times displayed in a consistent, standardized format throughout the entire application.

**Why this priority**: Date format inconsistency affects every page that displays timestamps — a core visual element across all roles.

**Independent Test**: Navigate to Audit Logs, User Management, and Payment Request detail pages; verify all date/datetime values use the standardized format.

**Acceptance Scenarios**:

1. **Given** a user views any timestamp in the application, **When** the value includes both date and time, **Then** it displays as `YYYY/M/D HH:mm:ss` (e.g., `2026/5/28 10:30:00`)
2. **Given** a user views any date-only value in the application, **When** the value has no time component, **Then** it displays as `YYYY/M/D` (e.g., `2026/5/28`)
3. **Given** a user views the Audit Log table, **When** looking at the Timestamp column, **Then** each value uses the `YYYY/M/D HH:mm:ss` format
4. **Given** a user views the User Management table, **When** looking at Created Date or Last Login columns, **Then** dates use the standardized format

---

### Edge Cases

- How are null/empty dates handled? (Display as "—" or dash, consistent with current behavior)
- Are milliseconds included in datetime display? (No — seconds precision only: `HH:mm:ss`)
- What about dates that are already stored as date-only (no time component)? (Display as `YYYY/M/D` without a time portion)
- What about UTC vs local time? (Keep existing timezone behavior — only change display format)

## Requirements

### Functional Requirements

- **FR-001**: ALL datetime values displayed in the application MUST use the format `YYYY/M/D HH:mm:ss` (e.g., `2026/5/28 10:30:00`)
- **FR-002**: ALL date-only values displayed in the application MUST use the format `YYYY/M/D` (e.g., `2026/5/28`)
- **FR-003**: Month and day values MUST NOT be zero-padded (use `5/28` not `05/28`)
- **FR-004**: Date separator MUST be forward slash `/` (not dash `-` or dot `.`)
- **FR-005**: DateTime format MUST include hours, minutes, and seconds separated by colons (`HH:mm:ss`)
- **FR-006**: Null or empty date values MUST display as "—" (em dash), consistent with current empty-field behavior
- **FR-007**: A centralized date formatting utility MUST be created in `frontend/src/utils/date-formatter.ts` and used across all components to ensure consistency (Constitution §2.4 — shared layer, accessible to all modules)
- **FR-008**: The utility file MUST use `kebab-case` naming (`date-formatter.ts`); functions MUST use `camelCase` (`formatDisplayDate`, `formatDisplayDateTime`); all return types MUST be explicitly annotated with JSDoc `@description` and `@returns` tags (Constitution §1.1, §1.2)
- **FR-009**: Import ordering in consuming files MUST follow the constitution standard: framework imports first, then third-party, then shared utilities, then local imports (Constitution §1.5)
- **FR-010**: Audit Log Timestamp column MUST display datetime in `YYYY/M/D HH:mm:ss` format
- **FR-011**: User Management created date, modified date, and last login columns MUST use the standardized format
- **FR-012**: Payment request detail timestamps (application date, desired payment date, submission dates, approval date) MUST use the standardized format
- **FR-013**: MetadataDetailPanel timestamp display MUST use the standardized format

### Key Entities

- **Date Format**: `YYYY/M/D` — year/month/day with forward slash separator, no zero-padding
- **DateTime Format**: `YYYY/M/D HH:mm:ss` — date format plus hours:minutes:seconds
- **Empty Value**: `—` (em dash) for null/empty date fields
- **Utility Module**: `frontend/src/utils/date-formatter.ts` — shared layer, accessible to all frontend modules (Constitution §2.4)

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of date and datetime values across all screens display in the standardized format
- **SC-002**: Zero instances of old date formats (ISO `YYYY-MM-DD`, Japanese `YYYY年MM月DD日`, zero-padded `MM/DD`) remain visible in the UI
- **SC-003**: A single centralized formatting function is used for all date rendering — no inline date formatting logic scattered across components
- **SC-004**: Visual walkthrough of Audit Logs, User Management, Master Data, and Payment Request pages confirms consistent date formatting
- **SC-005**: `npm run lint` passes with zero errors; `npm run build` passes with zero TypeScript errors (Constitution §1.4)

## Out of Scope

- Changing date input formats in form fields (date pickers may keep their native format)
- Changing how dates are stored in the database
- Changing API request/response date formats (backend remains ISO 8601)
- Adding timezone conversion or localization-aware formatting
- Changing date formats in non-admin pages (applicant, manager, approver, accounting dashboards) unless they share the same components

## Assumptions

- The current application displays dates in various formats (ISO 8601 `YYYY-MM-DD`, `toLocaleString()`, etc.) — this feature standardizes them all
- The new format `YYYY/M/D` is locale-independent and explicitly requested by the user
- Backend API responses continue to use ISO 8601 format — only the frontend display layer changes
- A shared utility function (e.g., `formatDisplayDate` and `formatDisplayDateTime`) will be created in `frontend/src/utils/date-formatter.ts` (shared layer per Constitution §2.4 — no approval needed for shared utils)
- Existing components that render dates (DataTable columns, detail panels, modals) will be updated to use the new utility
- All commits will follow Conventional Commits: `feat: dates-standardize date format display` (Constitution §3)
