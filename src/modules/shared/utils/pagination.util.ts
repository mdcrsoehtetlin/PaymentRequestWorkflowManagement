import { PaginationMeta } from '../types';

/**
 * @description Builds the standard PaginationMeta object from raw count + params.
 * Used in all service methods that return PaginatedResponse<T>.
 *
 * @param totalItems - Raw count from TypeORM getManyAndCount()
 * @param page - Current page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns PaginationMeta with totalPages calculated
 *
 * @example
 * const [items, total] = await this.repo.findAndCount({ ... });
 * return {
 *   data: items,
 *   meta: buildPaginationMeta(total, page, pageSize),
 * };
 */
export function buildPaginationMeta(
  totalItems: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  return {
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
  };
}
