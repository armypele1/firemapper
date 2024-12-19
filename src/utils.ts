/**
 * Returns true if arrays are equal
 *
 * @export
 * @param {Array<unknown>} arr1
 * @param {Array<unknown>} arr2
 * @returns {boolean}
 */
export function arraysAreEqual(arr1: unknown[], arr2: unknown[]): boolean {
  if (arr1.length !== arr2.length) {
    return false;
  }

  return arr1.every((a, i) => a === arr2[i]);
}
