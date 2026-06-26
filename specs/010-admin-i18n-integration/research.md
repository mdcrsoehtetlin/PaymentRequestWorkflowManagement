# Research: Admin Screen i18n Integration

**Date**: 2026-06-26
**Feature**: 010-admin-i18n-integration

## R1: react-i18next Hook Pattern

**Decision**: Use `useTranslation()` hook at component top-level, destructure `t` function.

**Rationale**: This is the standard react-i18next pattern already used in `Sidebar.tsx`. The `t()` function is called inline within JSX and component logic. No HOC wrapper needed.

**Pattern**:
```tsx
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('admin.user_management.title')}</h1>;
}
```

**Alternatives considered**: `withTranslation()` HOC — rejected because hooks are the modern React pattern and all existing components use functional components with hooks.

## R2: Static Config Objects with Translation Keys

**Decision**: Refactor static `roleMenuConfig` in `Sidebar.tsx` to a function that returns config using `t()`.

**Rationale**: The current `roleMenuConfig` is a module-level `const` object with hardcoded strings. Since `t()` requires being inside a React component (or hook), the config must be generated dynamically. Converting it to a function called inside the component body solves this.

**Pattern**:
```tsx
// Before (static — cannot use t())
const roleMenuConfig = { ADMIN: { label: 'Admin Console', items: [...] } }

// After (dynamic — uses t())
function useRoleMenuConfig() {
  const { t } = useTranslation();
  return {
    ADMIN: { label: t('admin.sidebar.admin_console'), items: [
      { label: t('admin.sidebar.user_management'), path: '/admin/users' },
      ...
    ] },
  };
}
```

**Alternatives considered**: i18next `t()` in module scope — rejected because `useTranslation()` must be called inside a component/hook.

## R3: Translation Key Namespace Strategy

**Decision**: Use flat key paths under `admin.*` namespace as already defined in locale files.

**Rationale**: The locale files already have the structure `admin.user_management.title`, `admin.audit_log.filters.request_number`, etc. No namespace restructuring needed.

**Alternatives considered**: Separate i18next namespaces per screen — rejected because the existing locale files use a single flat structure and the project doesn't configure namespace splitting.

## R4: Dropdown Options Translation

**Decision**: Define dropdown option arrays inside the component function body (after `useTranslation()`) so labels use `t()`.

**Rationale**: Filter dropdowns (role options, status options, action type options) currently have hardcoded label arrays. Moving them inside the component allows using `t()` for labels.

**Pattern**:
```tsx
function MyComponent() {
  const { t } = useTranslation();
  
  const roleOptions = [
    { value: '', label: t('common.all') },
    { value: '1', label: t('common.role.applicant') },
    ...
  ];
}
```

**Alternatives considered**: Pre-defined option constants outside component — rejected because labels must be reactive to language changes.

## R5: Interpolation for Dynamic Values

**Decision**: Use i18next interpolation syntax `t('key', { variable: value })` for dynamic content.

**Rationale**: FR-009 requires dynamic values to be passed as interpolation parameters. The locale files already use `{{variable}}` syntax in keys like `common.download_all_receipts`.

**Pattern**:
```tsx
// Locale: "download_all_receipts": "Download All Receipts ({{count}})"
t('common.download_all_receipts', { count: receiptFiles.length })
```

## R6: Fallback Behavior

**Decision**: Rely on i18next's built-in fallback to English (configured as `fallbackLng: 'en'`).

**Rationale**: FR-005 requires English fallback. i18next handles this automatically when `fallbackLng` is configured. No custom fallback logic needed in components.

## R7: ACTION_LABELS Deduplication

**Decision**: Remove duplicate `ACTION_LABELS` maps from `AuditLogWorkspace.tsx` and `MetadataDetailPanel.tsx`. Both should use `t('admin.audit_log.action_label.*')` keys directly.

**Rationale**: The same 10-item map is duplicated in two files. Using `t()` calls directly eliminates the duplication and ensures consistency with locale files.
