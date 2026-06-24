# Feature Specification: Search Button for Admin Screens

**Feature Branch**: `feature/search-button-admin-screens`

**Created**: 2026-06-24

**Status**: Draft

**Input**: User description: "add search button in user management screen and audit logs screen."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explicit Search Button (Priority: P1)

As an administrator, I want to see a search button next to the filter fields on the user management and audit logs screens, so that I can explicitly trigger a search when I'm ready instead of having results update automatically as I type.

**Why this priority**: This is the core request - adding a search button provides explicit control over when searches execute, which some users prefer over automatic debounced search.

**Independent Test**: Can be fully tested by navigating to either screen, entering filter criteria, and clicking the search button to see results update.

**Acceptance Scenarios**:

1. **Given** I am on the user management screen, **When** I enter search criteria and click the search button, **Then** the user list updates to match my filters
2. **Given** I am on the audit logs screen, **When** I enter search criteria and click the search button, **Then** the audit log list updates to match my filters
3. **Given** I have entered filter criteria, **When** I press Enter in a text field, **Then** the search is triggered (same as clicking the search button)
4. **Given** filters have changed but search hasn't been triggered, **When** I view the screen, **Then** I can see there are unsaved filter changes (optional visual indicator)

---

### Edge Cases

- What happens when I click search with empty filters? The system should display all records (default view).
- How does the system handle rapid button clicks? The button should be disabled during loading to prevent duplicate requests.
- What happens if the search request fails? The system should display an error message and maintain the current results.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: User management screen MUST display a search button next to the filter fields
- **FR-002**: Audit logs screen MUST display a search button next to the filter fields
- **FR-003**: Clicking the search button MUST trigger a search with the current filter values
- **FR-004**: Pressing Enter in text input fields MUST trigger the search (same as clicking the button)
- **FR-005**: The search button MUST be disabled while a search is in progress to prevent duplicate requests
- **FR-006**: The search button MUST use the existing design system styling (blue-900 background, white text, rounded-lg)
- **FR-007**: Automatic debounced search on filter change MUST be removed to rely solely on the search button

### Key Entities

- **User Management Screen**: Admin page for managing user accounts with keyword, role, and status filters
- **Audit Logs Screen**: Admin page for viewing system audit logs with date range, request number, action type, and actor name filters

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can trigger a search with a single click after entering filter criteria
- **SC-002**: Search results appear within 1 second of clicking the search button
- **SC-003**: Users can press Enter in text fields to trigger search as an alternative to clicking

## Clarifications

### Session 2026-06-24

- Q: Should the screen load with all records displayed or show an empty state on initial load? → A: Load all records on initial page load (maintains current UX)

## Assumptions

- The existing debounced auto-search behavior will be replaced by explicit search button
- The search button will use the same styling as the existing "新規ユーザー登録" button (blue-900, white text)
- Both screens will have identical search button behavior for consistency
- The button label will be "検索" (Search) in Japanese to match the existing UI language
- Initial page load displays all records; search button only applies to filter changes
