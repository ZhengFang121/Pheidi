export const isDuplicateKeyError = (error: unknown) => {
  return typeof error === 'object' && error !== null && Reflect.get(error, 'code') === 11000
}
