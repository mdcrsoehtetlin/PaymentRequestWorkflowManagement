/**
 * @description Barrel export for all shared UI components.
 * All dashboard pages MUST import shared components from this file
 * or directly from the component file — never re-implement locally.
 *
 * See: docs/core_ja/02_開発ルール_DEVELOPMENT_RULES.md §9.5
 * See: .github/copilot-instructions.md §MANDATORY SHARED COMPONENT USAGE
 */

// Layout
export { DashboardKpiGrid } from './DashboardKpiGrid';

// Data Display
export { DataTable } from './DataTable';
export type { Column } from './DataTable';
export { StatusBadge } from './StatusBadge';
export { KpiCard } from './KpiCard';
export { CurrencyDisplay } from './CurrencyDisplay';
export { EmptyState } from './EmptyState';
export { ApprovalTimeline } from './ApprovalTimeline';
export { PageHeader } from './PageHeader';

// Forms & Filters
export { SearchFilterBar } from './SearchFilterBar';
export type { FilterField, SearchFilterBarProps } from './SearchFilterBar';
export { DatePicker } from './DatePicker';

// Actions & Feedback
export { RefreshButton } from './RefreshButton';
export { ConfirmDialog } from './ConfirmDialog';
export { Toast } from './Toast';
export { LoadingSpinner } from './LoadingSpinner';
export { FileUploadDropzone } from './FileUploadDropzone';

// Auth & Navigation
export { ProtectedRoute } from './ProtectedRoute';
export { LanguageSwitcher } from './LanguageSwitcher';
export { ErrorBoundary } from './ErrorBoundary';
