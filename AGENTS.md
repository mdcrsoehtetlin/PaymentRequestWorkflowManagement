<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at specs/005-english-localization/plan.md

## Development Rules (BINDING — read before any code generation)

All code MUST comply with the full development rules specification:
docs/core_ja/02_開発ルール_DEVELOPMENT_RULES.md

Key highlights:
- Naming conventions: camelCase vars/functions, PascalCase classes/components, snake_case DB columns, kebab-case files
- TypeScript: `strict: true`, explicit return types, no `any` in app code, JSDoc on all public methods
- Module isolation: no cross-module imports (use shared layer only)
- UI/UX: Tailwind tokens only (no arbitrary hex), `focus:ring-indigo-500`, `bg-blue-900`, `text-slate-900/500/400`, workflow status colors per §9.2.2
- Performance: 300ms debounce on all search/filter inputs
- Security: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles()` on all endpoints
- Tests: `npm run lint` (0 errors), `npm run build` (0 errors), `npm run test` (all pass) before any commit
<!-- SPECKIT END -->
