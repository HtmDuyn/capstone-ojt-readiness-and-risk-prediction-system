export function paginateItems<T>(items: readonly T[], requestedPage: number, limit: number) {
  const pages = Math.max(1, Math.ceil(items.length / limit));
  const page = Math.max(1, Math.min(requestedPage, pages));
  const offset = (page - 1) * limit;
  return { page, pages, offset, items: items.slice(offset, offset + limit) };
}

// Header checkboxes only change the visible page; other pages retain their selections.
export function selectPage(previous: ReadonlySet<number>, ids: readonly number[], checked: boolean) {
  const next = new Set(previous);
  for (const id of ids) {
    if (checked) next.add(id);
    else next.delete(id);
  }
  return next;
}

export function pageNumbers(page: number, pages: number): (number | 'ellipsis')[] {
  const visible = [...new Set([1, pages, page - 1, page, page + 1])]
    .filter(value => value >= 1 && value <= pages).sort((a, b) => a - b);
  return visible.flatMap((value, index) => index > 0 && value - visible[index - 1] > 1
    ? ['ellipsis' as const, value] : [value]);
}
