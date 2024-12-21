export function trimPlural(s: string | undefined): string | undefined {
  if (!s) return;

  if (s.endsWith('s')) {
    return s.slice(0, -1);
  }

  return s;
}
