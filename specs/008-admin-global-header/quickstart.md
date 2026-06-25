# Quickstart Validation: Admin Global Header with Language Switch

**Date**: 2026-06-25
**Feature**: 008-admin-global-header

## Prerequisites

- Application running (`npm run start:dev` for backend, `npm run dev` for frontend)
- Admin user logged in
- Navigate to Admin panel (`/admin`)

## Validation Scenarios

### Scenario 1: Header Visibility

1. Navigate to any admin screen (e.g., User Management)
2. **Verify**: A minimal header bar is visible at the top of the page
3. **Verify**: The header contains only the language switcher (no title, no notification bell)
4. **Verify**: The header is styled consistently (white background, bottom border)

### Scenario 2: Language Switch

1. On any admin screen, click the language switcher in the header
2. **Verify**: A dropdown appears with English, Japanese, and Myanmar options
3. Select "English"
4. **Verify**: Interface labels update immediately (button text, table headers, etc.)
5. Select "日本語"
6. **Verify**: Interface labels update to Japanese

### Scenario 3: Language Persistence Across Admin Pages

1. Switch language to English on the User Management page
2. Navigate to Master Data
3. **Verify**: Language remains English
4. Navigate to Audit Logs
5. **Verify**: Language remains English

### Scenario 4: Responsive Header

1. Resize browser to mobile viewport (< 768px)
2. **Verify**: Header with language switcher remains visible at the top
3. **Verify**: Language switcher is still functional on mobile

### Scenario 5: Cross-Panel Consistency

1. Navigate to a non-admin panel (e.g., Applicant Dashboard)
2. **Verify**: Header with language switcher is visible (via DashboardLayout)
3. Switch language in the non-admin panel
4. Navigate to the Admin panel
5. **Verify**: Language selection persists (shared i18n state)

## Expected Outcomes

- All 5 scenarios pass without errors in browser console
- Header is minimal — only language switcher, no other elements
- Language switch is instant (no loading delay)
- Layout remains stable (no content shift when header is added)
