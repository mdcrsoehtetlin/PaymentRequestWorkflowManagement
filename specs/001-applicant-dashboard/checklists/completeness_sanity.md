# Specification Quality Checklist: Completeness & Sanity

**Purpose**: Unit Tests for Requirements Quality - Sanity check before planning
**Created**: 2026-06-19
**Feature**: [spec.md](../spec.md)

## Requirement Completeness

- [x] CHK001 - Are mandatory vs optional fields explicitly defined for the "relaxed validation" during Draft creation? [Completeness, Spec §Scenario 2]
- [x] CHK002 - Are requirements specified for list display edge cases, such as an empty state (0 requests) or navigating past the last page? [Completeness, Spec §Scenario 1]
- [x] CHK003 - Is the exact generation logic for the `PRF-YYYY-NNNNNN` identifier clearly documented (e.g., sequence reset rules)? [Completeness, Spec §Scenario 2]

## Requirement Clarity

- [x] CHK004 - Is the "strict validation" required for Manager submission explicitly enumerated field-by-field? [Clarity, Spec §Scenario 3]
- [x] CHK005 - Are the specific visual tokens for the status badges explicitly mapped to the Design System rather than left ambiguous? [Clarity, Spec §FR-005]

## Consistency & Flow

- [x] CHK006 - Do the read-only restrictions consistently apply to both the form inputs and the receipt upload component across all non-editable workflow states? [Consistency, Spec §Scenario 4]
- [x] CHK007 - Are the requirements clear on what happens to attached receipt files when their parent Draft request is soft-deleted? [Consistency, Spec §Scenario 7]
- [x] CHK008 - Does the workflow explicitly define whether an Applicant can cancel a request that is currently in `SUBMITTED_MANAGER` status? [Gap, Consistency]

## Exception & Recovery Coverage

- [x] CHK009 - Are requirements defined for the UI behavior and user recovery path when a receipt file upload fails (e.g., network timeout, MIME rejection)? [Recovery, Spec §Scenario 4]
- [x] CHK010 - Is the system's fallback behavior specified when the real-time WebSocket connection drops while a status update occurs? [Recovery, Spec §Scenario 8]
- [x] CHK011 - Are degradation requirements defined if the Redis cache is temporarily unavailable when fetching lookup tables? [Exception, Spec §NFR-007]
- [x] CHK012 - Are clear user-facing error messages defined for optimistic concurrency conflicts (HTTP 409)? [Recovery, Spec §Assumptions 7]

## Measurability & Traceability

- [x] CHK013 - Can the success criterion of "completed end-to-end under 5 minutes" be objectively measured without ambiguity? [Measurability, Spec §Success Criteria 1]
