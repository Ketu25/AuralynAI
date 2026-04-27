/**
 * Formats a YYYY-MM-DD date string as "Month DD, YYYY" (e.g. "April 10, 2026").
 * Parses the components directly so the result is timezone-independent.
 */
export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
}
