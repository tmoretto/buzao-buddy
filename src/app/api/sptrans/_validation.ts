const MAX_SEARCH_TERM_LENGTH = 80;

export function parsePositiveIntParam(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function normalizeSearchTerm(value: string | null): string | null {
  const term = value?.trim();
  if (!term || term.length > MAX_SEARCH_TERM_LENGTH) {
    return null;
  }

  return term;
}