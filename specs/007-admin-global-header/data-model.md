# Data Model: Global Header with Language Switcher for Admin Panel

**Date**: 2026-06-26
**Feature**: 007-admin-global-header

## Entities

No new database entities or data structures are introduced by this feature.

## State

### Language State (existing — react-i18next)

| Field | Type | Source | Persistence |
|-------|------|--------|-------------|
| `i18n.language` | `string` (`'en'` / `'ja'` / `'my'`) | react-i18next context | localStorage |

- State is global — shared across all components and panels
- `LanguageSwitcher` reads via `useTranslation()` and writes via `i18n.changeLanguage()`
- No new state management or context providers needed

## Relationships

```
AdminDashboardShell
  └── <header> (new)
        └── LanguageSwitcher (shared component)
              └── useTranslation() → i18n.language (global state)
```

## Validation Rules

| Rule | Description |
|------|-------------|
| Language code | Must be one of `'en'`, `'ja'`, `'my'` (enforced by LanguageSwitcher) |

## State Transitions

None. Language state transitions are handled by react-i18next internally.
