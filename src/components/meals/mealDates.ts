function parseDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`)
}

export function formatMealDate(date: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parseDateOnly(date))
}
