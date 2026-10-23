interface Page<T> { items: T[]; total: number; limit: number }

// Existing screens filter and count locally, so retain all rows. Limit parallel
// requests to avoid exhausting the API's small database connection pool.
export async function loadAllPages<T>(fetchPage: (page: number) => Promise<Page<T>>): Promise<T[]> {
  const first = await fetchPage(1);
  if (!Number.isInteger(first.limit) || first.limit < 1) throw new Error('Invalid page limit');
  const items = [...first.items];
  const pages = Math.ceil(first.total / first.limit);
  for (let start = 2; start <= pages; start += 2) {
    const results = await Promise.all(
      Array.from({ length: Math.min(2, pages - start + 1) }, (_, index) => fetchPage(start + index))
    );
    results.forEach(result => items.push(...result.items));
  }
  return items;
}
