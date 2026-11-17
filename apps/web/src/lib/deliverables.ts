export function numberedDeliverables<T extends { deliverable: string }>(items: T[]): string[] {
  const totals = new Map<string, number>();
  const seen = new Map<string, number>();
  for (const item of items) totals.set(item.deliverable, (totals.get(item.deliverable) || 0) + 1);
  return items.map(item => {
    const count = (seen.get(item.deliverable) || 0) + 1;
    seen.set(item.deliverable, count);
    const total = totals.get(item.deliverable) || 1;
    return total > 1 ? `${item.deliverable} ${count}/${total}` : item.deliverable;
  });
}
