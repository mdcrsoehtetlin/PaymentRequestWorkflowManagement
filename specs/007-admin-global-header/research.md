# Research: Global Header with Language Switcher for Admin Panel

**Date**: 2026-06-26
**Feature**: 007-admin-global-header

## Research Tasks

### 1. How does the shared LanguageSwitcher manage language state?

**Decision**: Uses `useTranslation()` from react-i18next. `i18n.changeLanguage(code)` persists to localStorage automatically. No props required.

**Rationale**: The component is self-contained — reads current language from i18next context, writes via `i18n.changeLanguage()`. State is global across all components using react-i18next.

**Alternatives considered**:
- Custom context provider: Unnecessary — react-i18next already provides global state
- Props-based: Rejected — would require threading state through unrelated components

### 2. What is the exact visual style of the non-admin Header?

**Decision**: `h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30`

**Rationale**: The admin header should match this styling exactly for visual consistency (FR-004). Since the admin header only contains LanguageSwitcher (no hamburger, no notification bell), it simplifies to: same outer container + right-aligned LanguageSwitcher.

**Alternatives considered**:
- Fixed positioning: Rejected — non-admin Header uses `sticky`, matching is required
- Different background: Rejected — spec requires same visual styling

### 3. Does AdminDashboardShell need any layout changes?

**Decision**: No structural changes needed. The `<main>` element is `flex-1 overflow-auto`. Adding a sticky header inside `<main>` before `<Outlet />` will work with the existing flex layout.

**Rationale**: The sticky header will scroll with the main content but remain visible at the top of the viewport. The existing `p-6` padding on the content div provides spacing below the header.

**Alternatives considered**:
- Restructure to flex-col: Unnecessary — sticky positioning handles the layout without restructuring
- Move header outside main: Would interfere with sidebar layout

### 4. Will the header interfere with the admin sidebar?

**Decision**: No. The header is inside `<main>` (right side), not overlapping the sidebar (left side). The sidebar is a fixed 256px (`w-64`) column.

**Rationale**: The `flex h-screen` layout with `w-64` sidebar + `flex-1` main means the header only affects the main content area. No z-index conflicts since the header uses `z-30` and the sidebar is a separate flex item.

## Summary

All research questions resolved with low-risk decisions. The implementation is a single-file change: import `LanguageSwitcher`, add a `<header>` element with matching styles, place `LanguageSwitcher` right-aligned inside it.
