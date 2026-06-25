# Data Model: Admin Global Header with Language Switch

**Date**: 2026-06-25
**Feature**: 008-admin-global-header

## Entity Changes

**None.** This feature is purely UI — no new entities, no schema changes, no migrations.

## Existing State (No Changes)

### Language Preference (i18n)

Managed by `i18next` + `react-i18next`:
- **State**: Current language code (`en`, `ja`, `my`)
- **Persistence**: `localStorage` (managed by i18next)
- **Shared**: Across all components and panels — no new persistence needed
