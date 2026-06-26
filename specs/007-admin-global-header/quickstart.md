# Quickstart: Global Header with Language Switcher for Admin Panel

**Date**: 2026-06-26
**Feature**: 007-admin-global-header

## Prerequisites

- Node.js 24+ installed
- Frontend dev server running (`npm run dev` in `frontend/`)
- Browser open to `http://localhost:5173/admin/users`

## Validation Scenarios

### Scenario 1: Header Visible on Admin Panel

1. Navigate to `http://localhost:5173/admin/users`
2. **Expected**: A white header bar (h-16) is visible at the top of the main content area, containing a language switcher dropdown
3. **Pass criteria**: Header matches the visual style of the non-admin header (white bg, bottom border, sticky)

### Scenario 2: Language Switcher Functional

1. On any admin screen, click the language switcher dropdown
2. Select "日本語" (Japanese)
3. **Expected**: All admin screen text updates to Japanese
4. Select "English" again
5. **Expected**: All admin screen text reverts to English

### Scenario 3: Language Persists Across Admin Screens

1. Switch language to "日本語" on `/admin/users`
2. Navigate to `/admin/master-data`
3. **Expected**: Language remains Japanese on the new screen

### Scenario 4: Language Persists Across Panels

1. Switch language to "日本語" on `/admin/users`
2. Navigate to a non-admin panel (e.g., `/applicant/requests`)
3. **Expected**: Language remains Japanese on the non-admin panel

### Scenario 5: Mobile Responsive

1. Resize browser to mobile viewport (< 768px)
2. Navigate to any admin screen
3. **Expected**: Header remains visible, language switcher is accessible

### Scenario 6: Sidebar Unaffected

1. On any admin screen, verify the sidebar is unchanged
2. **Expected**: Sidebar remains fixed at 256px width, no layout shift or overlap

## Build Verification

```bash
cd frontend
npm run lint       # 0 errors
npm run build      # 0 errors
```
