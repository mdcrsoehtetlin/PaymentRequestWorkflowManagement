# Feature Specification: Table Sorting for Admin Workspaces

**Feature Branch**: `003-table-sorting`

**Created**: 2026-06-22

**Status**: Draft

**Input**: User description: "i want to add sorting in user management resul and audit log result."

## User Scenarios & Testing

### User Story 1 - Sort Audit Log Results by Clicking Column Headers (Priority: P1)

An admin user viewing the audit log needs to sort results by different columns (timestamp, request ID, actor name, action type) to quickly find specific records. Clicking a column header sorts ascending, clicking again toggles to descending.

**Why this priority**: Audit log is the primary investigation tool for admins; sorting is the most requested usability improvement.

**Independent Test**: Can be tested by navigating to Audit Log workspace and clicking any column header — results reorder immediately without page reload.

**Acceptance Scenarios**:

1. **Given** the audit log table has loaded, **When** the user clicks the "日時" column header, **Then** results sort by timestamp ascending with a sort indicator visible
2. **Given** results are sorted ascending by timestamp, **When** the user clicks "日時" again, **Then** results sort by timestamp descending
3. **Given** results are sorted by timestamp, **When** the user clicks "リクエストID" header, **Then** results re-sort by request ID and the sort indicator moves to that column
4. **Given** the user applies a filter and sorts a column, **When** the filter changes, **Then** the sort order is preserved and re-applied to the new data

---

### User Story 2 - Sort User Management Results by Clicking Column Headers (Priority: P2)

An admin user managing system users needs to sort the user list by columns (name, email, role, branch, status, created date) to find users faster.

**Why this priority**: User management is a secondary admin task; audit log sorting is more frequently used.

**Independent Test**: Can be tested by navigating to User Management workspace and clicking any column header — results reorder without page reload.

**Acceptance Scenarios**:

1. **Given** the user management table has loaded, **When** the user clicks the "名前" column header, **Then** results sort by name ascending with a visible indicator
2. **Given** results are sorted by name, **When** the user clicks "名前" again, **Then** results sort descending
3. **Given** the user is on page 3 with a sort applied, **When** sorting by a different column, **Then** pagination resets to page 1
4. **Given** a sort order is active, **When** the user changes page, **Then** the sort order is preserved on the new page

---

### Edge Cases

- What happens when sorting a column that contains identical values in multiple rows? (Stable sort — secondary sort order is undefined but should not lose any rows)
- What happens when the user sorts while data is still loading? (Sort click is ignored during loading state)
- How does the system handle very long text fields in sorted columns? (Natural string comparison using locale-aware sorting for Japanese text)

## Requirements

### Functional Requirements

- **FR-001**: Admin users MUST be able to click any sortable column header in the audit log table to toggle ascending/descending sort
- **FR-002**: Admin users MUST be able to click any sortable column header in the user management table to toggle ascending/descending sort
- **FR-003**: The currently active sort column MUST display a visual indicator (up/down arrow icon) showing the current sort direction
- **FR-004**: Clicking a different sort column MUST remove the indicator from the previous column and apply it to the new one
- **FR-005**: Changing the sort column MUST reset pagination to page 1
- **FR-006**: Changing filters or page MUST preserve the current sort order
- **FR-007**: Sort MUST be applied client-side to already-loaded data; no additional API calls for sorting

### Key Entities

- **DataTable Component**: Existing shared component with `sorting` prop supporting `sortBy`, `sortOrder`, `onSortChange` — reuse existing infrastructure
- **AuditLogRecord**: Existing type with fields `timestamp`, `paymentRequestId`, `actorName`, `actionTypeId`, `ipAddress` — all sortable
- **UserRecord**: Existing user type with fields `fullName`, `email`, `role`, `branch`, `isActive` — all sortable

## Success Criteria

### Measurable Outcomes

- **SC-001**: Admin can sort audit log results by any data column with at most 2 clicks (one to enable, second to reverse)
- **SC-002**: Sort state is visually clear — user can identify which column is sorted and in which direction at a glance
- **SC-003**: Sort operation completes within the same render cycle as the click (no loading spinners for client-side sort)
- **SC-004**: User management table supports sorting on at least 6 columns (name, email, role, branch, status, created date)

## Out of Scope

- Server-side sorting (sort parameters sent to API)
- Multi-column sorting
- Sort persistence across sessions
- Custom sort functions per column type

## Assumptions

- Both tables load all data for the current page into the browser — sorting is client-side only (no server-side sort params)
- The existing `DataTable` component's `sorting` prop interface is sufficient and will not require changes
- Sortable columns include all data columns except the "actions" (eye icon) column
- Japanese locale string comparison is acceptable for name/email sorting
