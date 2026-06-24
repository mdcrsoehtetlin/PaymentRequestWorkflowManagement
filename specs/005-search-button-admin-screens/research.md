# Research: Search Button for Admin Screens

**Date**: 2026-06-24

## Research Tasks

### 1. Existing Button Pattern Analysis

**Finding**: The "新規ユーザー登録" button in UserManagementWorkspace uses:
```tsx
className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium"
```

**Recommended Pattern**: Use same styling for search button with "検索" label and Search icon.

### 2. Debounced Search Removal

**Finding**: Both screens use `useEffect` with 300ms debounce to auto-fetch on filter change.

**Current Pattern** (UserManagementWorkspace):
```tsx
useEffect(() => {
  if (debounceRef.current) clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => fetchUsers(), 300);
  return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
}, [filters, pagination.page, pagination.pageSize, fetchUsers]);
```

**Required Change**: Remove debounce useEffect, keep initial load useEffect, add explicit search handler.

### 3. Enter Key Handling

**Finding**: Text inputs need onKeyDown handler to trigger search on Enter.

**Recommended Pattern**:
```tsx
onKeyDown={(e) => {
  if (e.key === 'Enter') {
    handleSearch();
  }
}}
```

### 4. Button Loading State

**Finding**: Need to disable button during loading to prevent duplicate requests.

**Recommended Pattern**: Use existing `isLoading` state to conditionally disable button.
```tsx
<button disabled={isLoading} className="...">
```

### 5. Initial Load Behavior

**Finding**: Per clarification, initial page load should display all records.

**Implementation**: Keep existing initial load useEffect that fetches data on mount without filters.
