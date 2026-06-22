# Feature Specification: Audit Log Search Enhancement

**Feature Branch**: `002-audit-log-search`

**Created**: 2026-06-22

**Status**: Draft

**Input**: User description: "i want to add new search condition and want to fix existing in audit log screen"

## Metadata Header
- **Target Screen ID**: SCR_005_C_AUDIT_LOGS
- **Function ID**: FN-005003
- **Command Tag**: `/speckit-specify`
- **Document Reference Alignment**:
  - Requirement Reference: [01_要件定義書_REQUIREMENT_SPEC.md](file:///d:/AI/開発/PaymentRequestWorkflowManagement/docs/core_ja/01_要件定義書_REQUIREMENT_SPEC.md) (Section 4.5)
  - Functional Spec Reference: [ADMIN_04_機能設計書_FUNCTIONAL_SPEC.md](file:///d:/AI/開発/PaymentRequestWorkflowManagement/docs/screens/05_admin_dashboard/ADMIN_04_機能設計書_FUNCTIONAL_SPEC.md)
  - Screen Items Spec Reference: [ADMIN_05_画面項目設計書_SCREEN_ITEMS.md](file:///d:/AI/開発/PaymentRequestWorkflowManagement/docs/screens/05_admin_dashboard/ADMIN_05_画面項目設計書_SCREEN_ITEMS.md)

---

## Clarifications

### Session 2026-06-22
- Q: What should happen to the existing `userId` numeric filter when adding `actorName` text search? → A: Remove the numeric userId field entirely; use actorName text search as the sole user-targeted filter.
- Q: Should the Action Type dropdown display Japanese labels or English names? → A: Japanese labels consistent with the rest of the admin UI.
- Q: Should the Action Type dropdown show all action types or only those with matching logs? → A: Show all 10 types from the `approval_action_types` table.

---

## User Scenarios & Testing *(mandatory)*

### Functional Overview
This feature enhances the Audit Log workspace search functionality. Administrators need more precise filtering options to efficiently locate specific transaction records within the global audit log. The current search (start date, end date, user ID) is insufficient for daily auditing workflows.

### User Story 1 - Filter by Action Type (Priority: P1)

Administrators need to filter audit logs by the type of action performed (e.g., submission, verification, approval, rejection) to quickly isolate specific workflow events without scanning all records.

**Why this priority**: Action type is the most commonly used filter for audit investigations. Without it, administrators must manually scan hundreds of entries.

**Independent Test**: Can be verified by selecting an action type filter and confirming only matching action types appear in the results grid.

**Acceptance Scenarios**:

1. **Given** the Admin is on the Audit Log workspace, **When** they open the action type dropdown, **Then** all 10 action types are listed with Japanese labels (e.g., "作成", "提出", "マネージャー確認", "承認", "差戻し", "支払完了").
2. **Given** the Admin selects an action type from the dropdown (e.g., "承認"), **Then** the grid displays only logs where `action_type_id` matches the selected value.
3. **Given** the Admin has applied an action type filter and clears it, **When** they remove the filter selection, **Then** all action types are shown again.

---

### User Story 2 - Search by Request ID (Priority: P1)

Administrators need to find all audit log entries related to a specific payment request by its Request ID to trace the full approval history.

**Why this priority**: Request ID is the primary key for tracing a request's lifecycle. This is essential for compliance audits and dispute resolution.

**Independent Test**: Can be verified by entering a known Request ID and confirming only related audit log entries appear.

**Acceptance Scenarios**:

1. **Given** the Admin is on the Audit Log workspace, **When** they enter a valid Request ID (numeric) in the search field, **Then** the grid displays only logs for that payment request.
2. **Given** the Admin enters a non-existent Request ID, **When** they trigger the search, **Then** the grid displays an empty state message "該当するログが見つかりません".

---

### User Story 3 - Search by Actor Name (Replaces Existing userId Filter) (Priority: P2)

Administrators need to search audit logs by the name of the user who performed the action. The existing numeric userId search field is removed and replaced with a free-text actor name search.

**Why this priority**: Administrators often know the person's name but not their numeric ID. Fuzzy name search is more intuitive and reduces lookup friction.

**Independent Test**: Can be verified by typing a partial or full actor name and confirming matching results without needing to know the user's numeric ID.

**Acceptance Scenarios**:

1. **Given** the Admin is on the Audit Log workspace, **When** they look for the user search field, **Then** the old numeric userId input is gone, replaced by a text input labeled "実行者名".
2. **Given** the Admin types a partial actor name (e.g., "Soe") in the actor name search field, **Then** the grid displays logs where the actor's full name contains the search term (case-insensitive).
3. **Given** the Admin types a name with no matching records, **When** they trigger the search, **Then** the grid displays an empty state message "該当するログが見つかりません".

---

### User Story 4 - Fix: Auto-trigger Search with Debounce (Priority: P2)

The current search requires manual button click. This should be replaced with auto-triggered search using a debounce mechanism to provide instant feedback as filters change.

**Why this priority**: Reduces friction and matches the pattern used in the User Management workspace. The existing search button is redundant.

**Independent Test**: Can be verified by changing any filter value and observing the grid auto-refreshes within 300ms without clicking a search button.

**Acceptance Scenarios**:

1. **Given** the Admin adjusts any filter (date, action type, request ID, actor name), **When** they stop typing or change a dropdown value, **Then** the grid automatically refreshes after a 300ms debounce delay.
2. **Given** the Admin changes multiple filters in quick succession, **When** the debounce timer resets on each change, **Then** only one API request is sent after the final change.

---

### Edge Cases

- **Empty Results**: When no logs match the combined filter criteria, the grid must display an informative empty state: "該当するログが見つかりません".
- **Invalid Request ID**: Non-numeric or zero values must be ignored (not sent to the API) to prevent server errors.
- **Concurrent Filter Changes**: Rapid filter changes must be debounced so only the latest filter state triggers a search request.
- **Date Range Validation**: If start date exceeds end date, the search must not be triggered and an inline validation message must be displayed.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-ALG-01**: System MUST provide a dropdown filter for action type, populated from the `approval_action_types` table. Dropdown labels MUST use Japanese display names (e.g., "作成", "提出", "承認") matching the action type's semantic meaning.
- **FR-ALG-02**: System MUST provide a text input for searching by payment request ID (numeric).
- **FR-ALG-03**: System MUST replace the existing numeric userId search field with a text input for searching by actor name (partial match, case-insensitive).
- **FR-ALG-04**: System MUST replace the existing manual search button with automatic debounced search (300ms delay) on any filter change.
- **FR-ALG-05**: System MUST reset pagination to page 1 when any filter value changes.
- **FR-ALG-06**: System MUST support combining multiple filters (AND logic) — e.g., action type + date range + actor name.
- **FR-ALG-07**: System MUST NOT send empty or invalid filter values (empty strings, null, zero) in the API request.
- **FR-ALG-08**: System MUST display an empty state message when no records match the combined filters.
- **FR-ALG-09**: System MUST validate that start date does not exceed end date; if invalid, skip search and show inline error message "開始日は終了日より後に設定できません".

### Fields Matrix Table

| Field Name (Physical) | Logical Name | Component Type | Data Type | Constraints | Validation | HTTP Param |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `startDate` | Start Date | Date Picker | DATE | Optional, format YYYY-MM-DD | Must not exceed endDate | `startDate` |
| `endDate` | End Date | Date Picker | DATE | Optional, format YYYY-MM-DD | Must not be before startDate | `endDate` |
| `actionTypeId` | Action Type | Dropdown | INT | Optional, FK to `approval_action_types` | Valid action type ID | `actionTypeId` |
| `requestId` | Request ID | Number Input | INT | Optional, positive integer | Ignored if empty or zero | `requestId` |
| `actorName` | Actor Name | Text Input | VARCHAR(200) | Optional, max 200 chars | Partial case-insensitive match | `actorName` |

### Key Entities

- **ApprovalLog**: Immutable audit trail. Key filterable attributes: `timestamp`, `action_type_id` (FK), `payment_request_id` (FK), `action_taken_by_user_id` (FK), `action_taken_by_user.full_name` (relation).
- **ApprovalActionType**: Static lookup defining action type names. Attributes: `action_type_id` (PK), `action_type_name`.
- **User**: Used for actor name resolution via `action_taken_by_user_id` FK relation.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-ALG-01**: Audit log searches applying any combination of filters return results within ≤ 1.5 seconds for datasets up to 10,000 records.
- **SC-ALG-02**: Debounced search triggers at most one API request per filter change sequence (no duplicate requests).
- **SC-ALG-03**: Administrators can locate a specific audit log entry within 3 filter adjustments on average.
- **SC-ALG-04**: All filter states (including empty grid) render without layout shift or console errors.

---

## Assumptions

- **A-ALG-01**: The `approval_action_types` table is properly seeded with action type records corresponding to all workflow actions.
- **A-ALG-02**: The backend API supports the additional query parameters (`actionTypeId`, `requestId`, `actorName`) and implements case-insensitive partial matching for actor name.
- **A-ALG-03**: The existing date range validation (start ≤ end, end not in future) is already implemented on the backend and remains unchanged.
- **A-ALG-04**: No performance indexing changes are needed — existing B-Tree indexes on `timestamp`, `action_type_id`, and `payment_request_id` are sufficient.

---

## Verification & Test Boundary Criteria

### Automated Integration Test Cases
- **TC-ALG-POS-01 (Action Type Filter)**: Applying `actionTypeId=5` returns only logs with matching action type.
- **TC-ALG-POS-02 (Request ID Filter)**: Applying `requestId=3` returns only logs for that payment request.
- **TC-ALG-POS-03 (Actor Name Search)**: Applying `actorName=Soe` returns logs where actor name contains "Soe" (case-insensitive).
- **TC-ALG-POS-04 (Combined Filters)**: Applying `startDate`, `actionTypeId`, and `requestId` together returns logs matching all criteria (AND logic).
- **TC-ALG-NEG-01 (No Results)**: Applying a filter combination that matches no records returns HTTP 200 with empty `data` array.
- **TC-ALG-NEG-02 (Invalid Date Range)**: Setting startDate after endDate returns HTTP 400 with validation error.
- **TC-ALG-NEG-03 (Empty Filters)**: Sending all filters as empty/null returns full unfiltered result set.

### Automated Unit Test Command
```bash
# Run tests for the admin module audit log search
npm run test -- --testPathPattern=admin
```
