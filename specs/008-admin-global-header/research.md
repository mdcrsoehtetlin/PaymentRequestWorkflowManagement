# Research: Admin Global Header with Language Switch

**Date**: 2026-06-25
**Feature**: 008-admin-global-header

## Research Items

### 1. Admin Panel Layout Architecture

**Decision**: Add a minimal header bar directly inside `AdminDashboardShell.tsx` rather than refactoring to use the shared `DashboardLayout`.

**Rationale**: The admin shell has its own standalone sidebar structure (hardcoded nav links, different from the shared `Sidebar` component). Refactoring to use `DashboardLayout` would require significant changes to the admin sidebar, which is out of scope. Adding a simple header div with `LanguageSwitcher` inside the existing shell is the minimal, lowest-risk approach.

**Alternatives considered**:
- Refactor `AdminDashboardShell` to use `DashboardLayout` — rejected because it would require replacing the admin's custom sidebar with the shared `Sidebar` component, which has different menu configuration and structure
- Create a new `AdminHeader` component — rejected because the header is minimal (just a div + LanguageSwitcher); a separate component is unnecessary

### 2. LanguageSwitcher Import Pattern

**Decision**: Import `LanguageSwitcher` directly from the shared component file, matching the pattern used by the existing `Header.tsx`.

**Rationale**: `Header.tsx` already imports `LanguageSwitcher` directly (`import { LanguageSwitcher } from '../shared/LanguageSwitcher'`). Following the same pattern maintains consistency.

**Alternatives considered**:
- Import from barrel `index.ts` — both work, but direct import matches existing `Header.tsx` convention

### 3. Header Styling

**Decision**: Use a sticky top bar with `bg-white border-b border-slate-200` styling, matching the non-admin `Header` component's visual pattern, with flex layout placing the language switcher on the right.

**Rationale**: FR-006 requires design system consistency with non-admin panels. The existing `Header` uses similar styling. Keeping the bar minimal (no title, no icons) means we only need the container + right-aligned `LanguageSwitcher`.

**Alternatives considered**:
- Use `bg-blue-900` (brand color) — rejected because the admin sidebar already uses this color; a white header provides better visual separation
- No background (transparent) — rejected because it would blend with page content and reduce discoverability
