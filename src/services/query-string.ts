// Filters as URL search params; an omitted filter is left out.
export function toQueryString(filters: Record<string, string | undefined>): string {
  const params = new URLSearchParams()
  for (const [name, value] of Object.entries(filters)) {
    if (value !== undefined) params.set(name, value)
  }
  const query = params.toString()
  return query === '' ? '' : `?${query}`
}
