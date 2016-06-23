'use strict'

export function extractArgs (a, fromPos = 0) {
  const args = []
  for (let i = fromPos; i < a.length; i++) {
    args[i - fromPos] = a[i]
  }
  return args
}
