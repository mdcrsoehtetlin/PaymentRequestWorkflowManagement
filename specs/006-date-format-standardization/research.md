# Research: Date Format Standardization

**Feature**: 006-date-format-standardization
**Date**: 2026-06-23

## R1: Existing Date Formatting Utilities

**Decision**: Modify existing `frontend/src/utils/format.ts` — already contains `formatDate()` and `formatDateTime()`

**Rationale**: The codebase already has a centralized date formatting module. The functions use `toLocaleDateString('ja-JP')` with `month: '2-digit', day: '2-digit'` (zero-padded). Updating these functions is simpler than creating a new utility.

**Alternatives considered**:
- Create new `date-formatter.ts` — rejected (redundant, existing file already serves this purpose)
- Use `date-fns` library — rejected (no new dependencies per Constitution §3, pure JS date methods sufficient)

## R2: Zero-Padding Removal Strategy

**Decision**: Use `month: 'numeric'` and `day: 'numeric'` instead of `month: '2-digit'` and `day: '2-digit'`

**Rationale**: The `Intl.DateTimeFormat` options `month: 'numeric'` and `day: 'numeric'` produce non-padded values (5, 28) instead of padded (05, 28). This is the standard JavaScript approach — no custom string manipulation needed.

**Alternatives considered**:
- Custom string replace after formatting — rejected (fragile, unnecessary when Intl API supports this natively)
- Manual padding removal with regex — rejected (complexity without benefit)

## R3: DateTime Format Seconds

**Decision**: Add `second: '2-digit'` to the `Intl.DateTimeFormat` options in `formatDateTime()`

**Rationale**: The user specified `HH:mm:ss` format. The current `formatDateTime()` only includes hours and minutes. Adding seconds is a single option addition.

**Alternatives considered**:
- Custom string concatenation — rejected (Intl API is cleaner and timezone-aware)
- Separate seconds parameter — rejected (over-engineering for a simple format change)

## R4: Separator Character

**Decision**: Use `/` separator via `toLocaleDateString('ja-JP')` — the `ja-JP` locale already uses `/` as the date separator

**Rationale**: The `ja-JP` locale produces `YYYY/MM/DD` format by default. With `month: 'numeric'` and `day: 'numeric'`, it produces `YYYY/M/D` (no padding). No custom separator logic needed.

**Alternatives considered**:
- Custom separator replacement — rejected (Intl API handles this)
- Different locale — rejected (`ja-JP` already produces the desired `/` separator)
