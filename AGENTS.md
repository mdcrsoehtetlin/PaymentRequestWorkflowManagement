<!-- SPECKIT START -->
## Development Rules (BINDING — read before any code generation)

All code MUST comply with the full development rules specification:
docs/core_ja/02_開発ルール_DEVELOPMENT_RULES.md

**Full AI guardrails**: .github/copilot-instructions.md

Key highlights:
- Naming conventions: camelCase vars/functions, PascalCase classes/components, snake_case DB columns, kebab-case files
- TypeScript: `strict: true`, explicit return types, no `any` in app code, JSDoc on all public methods
- Module isolation: no cross-module imports (use shared layer only)
- UI/UX: Tailwind tokens only (no arbitrary hex), `focus:ring-indigo-500`, `bg-blue-900`, `text-slate-900/500/400`, workflow status colors per §9.2.2
- Performance: 300ms debounce on all search/filter inputs
- Security: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles()` on all endpoints
- Tests: `npm run lint` (0 errors), `npm run build` (0 errors), `npm run test` (all pass) before any commit

## HARD BLOCKERS — Shared Layer & Cross-Module

- **DO NOT** modify `src/modules/shared/` or `frontend/src/components/shared/` without explicit Project Leader approval.
- **DO NOT** import from another role module (applicant ↔ manager ↔ approver ↔ accounting ↔ admin is FORBIDDEN).
- Run `bash scripts/verify-all.sh` to validate all rules before committing.
<!-- SPECKIT END -->
