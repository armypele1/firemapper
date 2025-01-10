import { DocumentReference, FieldValue } from '@google-cloud/firestore';
import { Transform } from 'class-transformer';
import { FIRESTORE_TRANSFORMS } from './types.js';

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

export function isDocumentReference(x: unknown): x is DocumentReference {
  return typeof x === 'object' && x !== null && x.constructor.name === 'DocumentReference';
}

const isFieldValue = (value: unknown) => {
  return FIRESTORE_TRANSFORMS.includes(value?.constructor.name as any);
};

export const serializeWithFirestoreDatatypes = (obj: any) => {
  const serialize = (value: unknown): any => {
    if (isDocumentReference(value)) {
      return value;
    }

    if (isFieldValue(value)) {
      return value;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(serialize);
    }

    // Handle objects
    if (value && typeof value === 'object') {
      return Object.entries(value).reduce((acc: { [key: string]: any }, [key, val]) => {
        acc[key] = serialize(val);
        return acc;
      }, {});
    }

    // Handle primitive values
    return value;
  };

  return serialize(obj);
};
