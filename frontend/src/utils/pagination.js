/**
 * Pagination utilities
 * Handle paginated API responses
 */

/**
 * Calculate pagination info from API response
 */
export function getPaginationInfo(data) {
  if (!data?.pagination) {
    return {
      limit: 20,
      offset: 0,
      total: 0,
      currentPage: 1,
      totalPages: 1,
    };
  }

  const { limit, offset, total } = data.pagination;

  return {
    limit,
    offset,
    total,
    currentPage: Math.floor(offset / limit) + 1,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Format offset for next page
 */
export function getNextPageOffset(limit, offset, total) {
  const nextOffset = offset + limit;
  return nextOffset < total ? nextOffset : offset;
}

/**
 * Format offset for previous page
 */
export function getPreviousPageOffset(limit, offset) {
  return offset >= limit ? offset - limit : 0;
}

/**
 * Check if more pages available
 */
export function hasNextPage(limit, offset, total) {
  return offset + limit < total;
}

/**
 * Check if previous page available
 */
export function hasPreviousPage(offset) {
  return offset > 0;
}
