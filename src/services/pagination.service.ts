import { PaginationMeta } from "../utils/interfaces/pagination-meta.interface";

export class PaginationService {
  calculateOffset(limit: number, page: number) {
    return (page - 1) * limit;
  }

  createMeta(
    limit: number,
    page: number,
    count: number
  ): PaginationMeta | void {
    const totalPages = Math.ceil(count / limit);
    if (page > totalPages) return;

    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      itemsPerPage: limit,
      totalItems: count,
      currentPage: page,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      firstPage: page == 1,
      lastPage: page >= totalPages,
    };
  }
}
