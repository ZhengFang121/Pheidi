export const parsePositiveInteger = (value: unknown, fallback: number) => {
  if (typeof value !== 'string') return fallback

  const parsedValue = Number.parseInt(value, 10)

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback
}
