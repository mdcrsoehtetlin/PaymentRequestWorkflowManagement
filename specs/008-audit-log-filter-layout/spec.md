# Feature Specification: Audit Log Filter Layout Fix

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "in audit logs screen request number text box should be Prefix PRF-[Textbox].and, Search and Clear Filter buttons position need to fix. search condition and buttons should divide with divitor and button position is right side."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Request Number PRF- Prefix (Priority: P1)

As an administrator viewing audit logs, I want the request number text box to display a static "PRF-" prefix before the input, so that I understand the expected format and don't need to type the prefix myself.

**Why this priority**: Core usability improvement — reduces user error and clarifies input format.

**Independent Test**: Navigate to Audit Logs screen, verify "PRF-" is displayed before the request number input, type a number, verify the search works with the prefix.

**Acceptance Scenarios**:

1. **Given** I am on the Audit Logs screen, **When** I look at the request number filter, **Then** I see "PRF-" displayed as a static prefix before the text input
2. **Given** I type "123" in the request number field, **When** I click Search, **Then** the system searches for request number "PRF-123"
3. **Given** I clear the request number field, **When** I look at the field, **Then** the "PRF-" prefix remains visible

---

### User Story 2 - Filter Layout with Divider and Right-Aligned Buttons (Priority: P1)

As an administrator, I want the search filter fields and action buttons to be visually separated by a divider, with buttons positioned on the right side, so that the filter area is clearly organized and easy to scan.

**Why this priority**: Visual clarity improvement — makes the filter UI more intuitive.

**Independent Test**: Navigate to Audit Logs screen, verify a vertical divider separates filter fields from buttons, verify buttons are aligned to the right.

**Acceptance Scenarios**:

1. **Given** I am on the Audit Logs screen, **When** I look at the filter bar, **Then** I see a vertical divider separating the search fields from the Search/Clear buttons
2. **Given** I am on the Audit Logs screen, **When** I look at the button area, **Then** the Search and Clear Filters buttons are positioned on the right side of the divider

---

### Edge Cases

- What happens on mobile viewports? The divider and button layout should stack vertically on small screens.
- What happens when all filter fields are empty? The Clear Filters button should be disabled, divider remains visible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The request number text input MUST display a static "PRF-" prefix before the input field
- **FR-002**: The "PRF-" prefix MUST be non-editable (display only, not part of the input)
- **FR-003**: When the user types in the request number field, the submitted value MUST include the "PRF-" prefix
- **FR-004**: The filter bar MUST display a vertical divider between the search fields and the action buttons
- **FR-005**: The Search and Clear Filters buttons MUST be positioned to the right of the divider
- **FR-006**: On mobile viewports, the divider and buttons should stack vertically below the filter fields

### Key Entities

- **Request Number Input**: Text input with static "PRF-" prefix
- **Filter Bar Layout**: Search fields | divider | action buttons (right-aligned)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify the request number format (PRF-xxx) without external documentation
- **SC-002**: The filter bar has a clear visual separation between input fields and action buttons
- **SC-003**: The layout is consistent and intuitive on both desktop and mobile viewports

## Assumptions

- The "PRF-" prefix is only for display and user guidance — the API still receives the full request number
- The divider is a visual separator (vertical line), not a functional boundary
- The SearchFilterBar shared component should be modified to support the prefix and divider layout, as this pattern may apply to other admin screens
- The existing SearchFilterBar props (`showSearchButton`, `showClearButton`) remain unchanged
