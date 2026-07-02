# Feature Specification: Admin User Search Update

**Feature Branch**: `[011-admin-user-search-update]`

**Created**: 2026-07-01

**Status**: Draft

**Input**: User description: "in user management screen, i want to change search by keyword text box to Employee Number Search box and Employee name text box. Employee Number text box is like prefix EMP-[textbox]. use admin panel search filter bar."

## Clarifications

### Session 2026-07-01

- Q: How should the search combine Employee Number and Name when both are populated? → A: AND condition (results must match both fields)
- Q: How should the system handle a user manually typing 'EMP-' into the Employee Number field, given the prefix is already visually present? → A: Automatically strip the typed 'EMP-' prefix so only the numbers remain

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Search by Employee Number (Priority: P1)

As an Administrator in the User Management screen, I want to search for a user by their specific employee number using a dedicated input field with an "EMP-" prefix, so that I can quickly find an exact match for an employee.

**Why this priority**: Employee number is a unique identifier, making it the most precise way to find a specific user account for management tasks.

**Independent Test**: Can be fully tested by entering a known employee number in the new text box and verifying that only the matching user is displayed.

**Acceptance Scenarios**:

1. **Given** the admin is on the User Management screen, **When** they type "12345" into the Employee Number search box (which displays "EMP-"), **Then** the user list filters to show only the user with employee number "EMP-12345".
2. **Given** the admin is on the User Management screen, **When** they type a non-existent employee number, **Then** the user list shows an empty state or "No users found" message.
3. **Given** the admin is typing in the Employee Number search box, **When** they manually type the prefix "EMP-12345", **Then** the system automatically strips the typed "EMP-" prefix and only the numbers remain in the value.

---

### User Story 2 - Search by Employee Name (Priority: P1)

As an Administrator in the User Management screen, I want to search for users by their name using a dedicated input field, so that I can find employee accounts when I don't know their exact employee number.

**Why this priority**: Name search is the most common fallback when exact identifiers are unknown, essential for daily administrative tasks.

**Independent Test**: Can be fully tested by entering a partial or full name and verifying that the list filters to matching users.

**Acceptance Scenarios**:

1. **Given** the admin is on the User Management screen, **When** they type "John" into the Employee Name search box, **Then** the user list filters to show all users containing "John" in their name.
2. **Given** the admin has both Employee Number "123" and Employee Name "John" populated, **When** they perform the search, **Then** the results only show users matching BOTH the number and the name (AND condition).

---

### Edge Cases

- When a user types "EMP-" manually into the Employee Number box, the system automatically strips the typed 'EMP-' prefix so only the numbers remain.
- When both Employee Number and Employee Name fields are populated, the search uses an AND condition (results must match both fields).
- What happens if the user types rapidly in the search boxes? (Should respect the 300ms debounce performance rule).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST replace the existing generic "search by keyword" text box in the admin panel search filter bar with two distinct input fields: "Employee Number" and "Employee Name".
- **FR-002**: The "Employee Number" text box MUST include a visual, non-editable prefix of "EMP-".
- **FR-003**: System MUST filter the user list based on the Employee Number field.
- **FR-004**: System MUST filter the user list based on the Employee Name field.
- **FR-005**: System MUST apply a 300ms debounce to the search inputs to prevent excessive API calls.
- **FR-006**: System MUST enforce Role-Based Access Control using JwtAuthGuard and RolesGuard on all endpoints.
- **FR-007**: System MUST adhere to the premium enterprise dashboard aesthetic and exact Color Tokens from the Design System.
- **FR-008**: System MUST comply with WCAG 2.1 AA accessibility requirements (contrast ratios, focus indicators, keyboard navigation, ARIA labels).

### Key Entities *(include if feature involves data)*

- **User**: The employee account being searched for. Key attributes involved are Employee Number and Name.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can successfully locate a specific user by Employee Number on the first attempt 100% of the time (assuming the user exists).
- **SC-002**: Search results update smoothly without UI freezing, utilizing a 300ms debounce.
- **SC-003**: API response time for search queries remains under the P95 < 200ms target.

## Assumptions

- The backend API either already supports specific field filtering (Employee Number, Name) or can be easily adapted from the previous keyword search.
- "EMP-" is a globally fixed prefix for all employee numbers in the system.
