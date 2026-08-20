export const escapeRegularExpression = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
