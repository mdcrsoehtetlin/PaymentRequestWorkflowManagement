import React from 'react';

interface DashboardKpiGridProps {
  /** KpiCard components to render in the grid */
  children: React.ReactNode;
}

/**
 * @description Grid wrapper for KPI summary cards on all dashboards.
 * Enforces the exact layout from §9.5.7:
 * - `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8`
 *
 * Developers must wrap their KpiCard components in this grid to guarantee
 * consistent spacing and responsive breakpoints across all dashboards.
 *
 * @param children - KpiCard components (typically 3-5)
 *
 * @example
 * ```tsx
 * <DashboardKpiGrid>
 *   <KpiCard label="Drafts" count={3} icon={<FileEdit />} colorClasses="..." />
 *   <KpiCard label="Submitted" count={5} icon={<Send />} colorClasses="..." />
 *   <KpiCard label="Rejected" count={1} icon={<XCircle />} colorClasses="..." />
 *   <KpiCard label="Approved" count={12} icon={<CheckCircle />} colorClasses="..." />
 * </DashboardKpiGrid>
 * ```
 */
export function DashboardKpiGrid({ children }: DashboardKpiGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {children}
    </div>
  );
}
