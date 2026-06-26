# Research: Clear Filters Button for Admin Search Panels

**Date**: 2026-06-26
**Feature**: 006-clear-filters-button

## R1: SearchFilterBar API Compatibility

**Decision**: Use SearchFilterBar as-is with no shared component modifications.

**Rationale**: The SearchFilterBar already supports all required functionality:
- `fields: FilterField[]` — declarative field definitions
- `onApply(values)` — called on Search button click with local draft values
- `onClear()` — called on Clear Filters button click
- `showClearButton` / `showClearButton` — controls button visibility
- Local draft state — values only submitted on Apply, not on every keystroke

**Alternatives considered**:
- Modifying SearchFilterBar to add Enter-to-search support: Rejected — would require shared layer modification (requires Project Leader approval per Constitution §II)
- Modifying SearchFilterBar to add prefix prop for PRF-: Rejected — same shared layer restriction
- Using `actions` slot for custom buttons: Not needed — standard Search/Clear buttons suffice

## R2: PRF- Prefix on Audit Log Request Number

**Decision**: Use placeholder hint "PRF-..." instead of a visual prefix, and strip/validate in onApply.

**Rationale**: The SearchFilterBar has no `prefix` prop on FilterField. Adding one would modify the shared component (Constitution §II restriction). A placeholder provides the same UX hint without shared layer changes.

**Alternatives considered**:
- Adding `prefix` prop to FilterField: Requires shared layer approval
- Storing "PRF-{number}" in state: Breaks API integration (API expects number without prefix)
- Using `actions` slot: Structurally doesn't work — actions is in the button row, not alongside fields

## R3: Button Label Language (English vs Japanese)

**Decision**: Keep SearchFilterBar's English labels ("Search", "Clear Filters") as-is.

**Rationale**: The SearchFilterBar is a shared component used across the application. Its current labels are in English. Changing to Japanese would modify the shared component. Both labels are widely understood in a technical/admin context.

**Alternatives considered**:
- Modifying SearchFilterBar labels: Shared layer restriction
- Using `actions` slot for Japanese buttons with `showSearchButton={false}`: Over-engineered for this use case
- Adding i18n support: Scope creep, not in original request

## R4: Enter-to-Search Behavior

**Decision**: SearchFilterBar does not support Enter-to-search natively. Users must click the Search button.

**Rationale**: The current inline panels have Enter-to-search on text fields via `onKeyDown` handlers. SearchFilterBar does not wire this. Adding it would require modifying the shared component. The Search button click is sufficient for the feature scope.

**Alternatives considered**:
- Adding `onKeyDown` handler to SearchFilterBar: Shared layer restriction
- This is acceptable — the spec requires a search button, and clicking is the primary interaction pattern

## R5: Date Validation in Audit Logs

**Decision**: Keep date validation logic (`startDate > endDate`) in the parent's fetch handler, not in SearchFilterBar.

**Rationale**: SearchFilterBar does not support cross-field validation. The date validation error state (`dateError`) is managed by AuditLogWorkspace. When Clear Filters is clicked, the parent's `onClear` handler clears the error state alongside resetting filter values.

## R6: Page Reset Timing

**Decision**: Page resets to 1 only on `onApply` (Search click), not on individual filter value changes.

**Rationale**: SearchFilterBar maintains local draft state. Parent is not notified of changes until Apply is clicked. This is actually better UX — no premature page reset on typos or incomplete filter entry. The current behavior of resetting page on every keystroke/selection change is suboptimal.
