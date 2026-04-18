import { useMemo } from 'react';
import Fuse from 'fuse.js';

export function useFuzzySearch<T>(items: T[], keys: string[], query: string, threshold = 0.4): T[] {
  const fuse = useMemo(() => new Fuse(items, { keys, threshold, ignoreLocation: true }), [items, keys, threshold]);
  return useMemo(() => {
    const q = query.trim();
    if (!q) return items;
    return fuse.search(q).map(r => r.item);
  }, [fuse, query, items]);
}
