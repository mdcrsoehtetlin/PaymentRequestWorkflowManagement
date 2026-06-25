# Feature Specification: Clear Filters Button

**Feature Branch**: `006-clear-filters-button`

**Created**: 2026-06-25

**Status**: Draft

**Input**: User description: "add clear filters button in Search Panel of User Management Screen and Audit Logs Screen."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Clear All Filters in User Management (Priority: P1)

As an admin user, I want to reset all applied filters in the User Management search panel back to their default empty state so that I can quickly return to viewing the full unfiltered user list without manually clearing each field.

**Why this priority**: This is the primary use case. The User Management screen is a core admin function, and clearing filters is a frequent operation when navigating between different search contexts.

**Independent Test**: Can be fully tested by applying one or more filters (keyword, role, status) in the User Management screen, clicking the Clear Filters button, and verifying all fields reset and the full user list reloads.

**Acceptance Scenarios**:

1. **Given** the user has entered a keyword and selected a role filter in User Management, **When** the user clicks the Clear Filters button, **Then** all filter fields (keyword, role, status) reset to their empty/default values and the full unfiltered user list is displayed.
2. **Given** the user has no filters applied in User Management, **When** the user views the search panel, **Then** the Clear Filters button is visible but visually disabled (grayed out) to indicate no action is needed.
3. **Given** the user has applied filters and the filtered results are displayed, **When** the user clicks Clear Filters, **Then** the pagination resets to page 1 and the complete user list loads.

---

### User Story 2 - Clear All Filters in Audit Logs (Priority: P2)

As an admin user, I want to reset all applied filters in the Audit Logs search panel back to their default empty state so that I can quickly return to viewing the full unfiltered audit log without manually clearing each field.

**Why this priority**: This is equally important for the Audit Logs screen, which has more filter fields (request number, actor name, action type, date range), making manual clearing more tedious.

**Independent Test**: Can be fully tested by applying one or more filters in the Audit Logs screen, clicking the Clear Filters button, and verifying all fields reset and the full audit log reloads.

**Acceptance Scenarios**:

1. **Given** the user has entered a request number, selected an action type, and set date filters in Audit Logs, **When** the user clicks the Clear Filters button, **Then** all filter fields (request number, actor name, action type, start date, end date) reset to their empty/default values and the full unfiltered audit log is displayed.
2. **Given** the user has applied filters and the filtered results are displayed, **When** the user clicks Clear Filters, **Then** the pagination resets to page 1 and the complete audit log loads.
3. **Given** the user has a date validation error displayed, **When** the user clicks Clear Filters, **Then** the date validation error message is also cleared.

---

### Edge Cases

- What happens when the user clicks Clear Filters while a search request is in progress? The button should be disabled during loading to prevent conflicting state updates.
- What happens when filters are already at default values? The Clear Filters button is visually disabled (grayed out) to indicate no action is needed, while remaining visible for layout stability.
- What happens when Clear Filters is clicked and the API call fails? The filters should still be cleared locally; the error should be handled by the existing error handling flow.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a Clear Filters button in the search panel of the User Management screen.
- **FR-002**: System MUST display a Clear Filters button in the search panel of the Audit Logs screen.
- **FR-003**: When clicked, the Clear Filters button MUST reset all filter fields to their initial empty values (empty string for all fields in both screens).
- **FR-004**: When clicked, the Clear Filters button MUST reset pagination to page 1.
- **FR-005**: When clicked, the Clear Filters button MUST automatically trigger a fresh data fetch with the cleared filters, displaying the full unfiltered dataset.
- **FR-006**: The Clear Filters button MUST be visually disabled (grayed out, non-interactive) when all filter fields are already at their default empty values. The button MUST remain visible at all times to maintain layout stability and discoverability.
- **FR-007**: The Clear Filters button MUST be disabled while a data fetch is in progress (loading state).
- **FR-008**: In Audit Logs, clicking Clear Filters MUST also clear any displayed date validation error messages.
- **FR-009**: The Clear Filters button MUST follow the existing design system styling (consistent with other buttons in the search panel).

### Key Entities

- **Filter State**: The set of current filter values (keyword, roleId, isActive for User Management; requestNumber, actorName, actionTypeId, startDate, endDate for Audit Logs). Each starts as an empty string.
- **Pagination State**: Page number, page size, total items, total pages. Resets to page 1 on filter clear.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can clear all filters and return to the full dataset in under 1 second (button click to data displayed).
- **SC-002**: Users complete the "clear and re-search" workflow in a single click instead of manually clearing 3-5 individual fields.
- **SC-003**: Zero user errors when clearing filters (no residual filter state, no pagination mismatch).

## Assumptions

- The Clear Filters button will be placed within the existing search panel layout, adjacent to the existing Search button.
- Both screens use inline filter panels (not the shared SearchFilterBar component), so the button will be added inline in each screen.
- The button label will use the existing Japanese UI text convention (e.g., "フィルタをクリア" or similar).
- Filter state is managed via `useState` in both screens; clearing means resetting to the initial empty-string values.
- Both screens already have a `handleSearch()` function that can be called after clearing filters to trigger a fresh fetch.

## Clarifications

### Session 2026-06-25

- Q: Should the Clear Filters button be hidden or disabled when no filters are active? → A: Disabled state — show button always, visually disabled (grayed out) when no filters active. Maintains layout stability, improves discoverability, and follows standard enterprise UI patterns.
