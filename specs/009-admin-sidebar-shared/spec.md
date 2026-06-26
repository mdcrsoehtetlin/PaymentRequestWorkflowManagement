# Feature Specification: Admin Panel Sidebar Uses Shared Component

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Admin Panel Navigation Panel should use share components."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Sidebar Uses Shared Sidebar Component (Priority: P1)

As a developer, I want the admin panel's sidebar navigation to use the shared Sidebar component instead of an inline implementation, so that the admin panel benefits from consistent styling, mobile responsiveness, and centralized menu configuration.

**Why this priority**: Code consistency and maintainability — eliminates duplicate sidebar implementations.

**Independent Test**: Navigate to admin panel, verify sidebar displays correctly with all navigation items, verify mobile hamburger menu works, verify logout functionality.

**Acceptance Scenarios**:

1. **Given** I am on the admin panel, **When** I look at the sidebar, **Then** I see the same sidebar component used by other panels (applicant, manager, approver, accounting)
2. **Given** I am on the admin panel on a mobile viewport, **When** I click the hamburger menu, **Then** the sidebar opens as an overlay (same behavior as other panels)
3. **Given** I am on the admin panel, **When** I click a navigation item, **Then** the active state is highlighted correctly
4. **Given** I am on the admin panel, **When** I click logout, **Then** I am redirected to the login page

---

### Edge Cases

- What happens if the admin panel has different navigation items than other panels? The shared Sidebar already supports role-based menu configuration.
- What happens on mobile viewports? The shared Sidebar already handles mobile overlay behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The admin panel MUST use the shared Sidebar component (`frontend/src/components/layout/Sidebar.tsx`) instead of its inline sidebar implementation
- **FR-002**: The shared Sidebar's ADMIN role configuration MUST display the correct Japanese navigation labels (ユーザー管理, マスターデータ, 監査ログ)
- **FR-003**: The admin panel MUST use the shared DashboardLayout component or replicate its structure (Sidebar + Header + Footer pattern)
- **FR-004**: Mobile hamburger menu behavior MUST work consistently with other panels
- **FR-005**: The admin panel sidebar MUST maintain the same visual appearance (blue-900 background, white text, active state styling)

### Key Entities

- **Shared Sidebar** (`frontend/src/components/layout/Sidebar.tsx`): Existing reusable sidebar component
- **Shared DashboardLayout** (`frontend/src/components/layout/DashboardLayout.tsx`): Existing layout wrapper combining Sidebar + Header + Footer
- **AdminDashboardShell** (`frontend/src/pages/admin/AdminDashboardShell.tsx`): Target file for refactoring

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin panel sidebar renders using the shared Sidebar component
- **SC-002**: Mobile hamburger menu works on admin panel
- **SC-003**: Navigation items display with correct Japanese labels
- **SC-004**: No duplicate sidebar implementation code remains

## Assumptions

- The shared Sidebar component's ADMIN role configuration will be updated to include Japanese labels
- The admin panel may need to adopt the DashboardLayout wrapper or a similar pattern
- The admin panel's header (with LanguageSwitcher) will be preserved alongside the shared Sidebar
- The admin panel's footer behavior (if any) will be handled by the shared Footer component or omitted if not needed
