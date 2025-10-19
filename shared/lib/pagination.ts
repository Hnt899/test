export function buildSlidingWindow(current: number, total: number, windowSize = 3) {
  if (total <= 0) return [] as number[];
  const size = Math.min(windowSize, total);
  let start = current - 1;

  if (start < 1) {
    start = 1;
  }

  const maxStart = total - size + 1;
  if (start > maxStart) {
    start = Math.max(1, maxStart);
  }

  return Array.from({ length: size }, (_, index) => start + index);
}
