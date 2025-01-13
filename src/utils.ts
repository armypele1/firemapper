import { DocumentReference, GeoPoint, Timestamp } from '@google-cloud/firestore';
import {
  FIRESTORE_TRANSFORMS,
  type SerializedDocRef,
  type SerializedGeoPoint,
  type SerializedTimestamp,
} from './types.js';

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

export function isTimestamp(x: unknown): x is Timestamp {
  return typeof x === 'object' && x !== null && 'toDate' in x;
}

export function isGeoPoint(x: unknown): x is GeoPoint {
  return typeof x === 'object' && x !== null && x.constructor.name === 'GeoPoint';
}

function isFieldValue(value: unknown) {
  return FIRESTORE_TRANSFORMS.includes(value?.constructor.name as any);
}

export function isSerializedDocRef(value: unknown): value is SerializedDocRef {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__docRef' in value &&
    typeof (value as SerializedDocRef).path === 'string'
  );
}

export function isSerializedGeoPoint(value: unknown): value is SerializedGeoPoint {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__geoPoint' in value &&
    typeof (value as any).latitude === 'number' &&
    typeof (value as any).longitude === 'number'
  );
}

export function isSerializedTimestamp(value: unknown): value is SerializedTimestamp {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__timestamp' in value &&
    typeof (value as any).value === 'string'
  );
}

export const serializeWithFirestoreDatatypes = (obj: any) => {
  const serialize = (value: unknown): any => {
    if (
      isDocumentReference(value) ||
      isTimestamp(value) ||
      isGeoPoint(value) ||
      isFieldValue(value)
    ) {
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
