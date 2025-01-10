import { Firestore, GeoPoint, Timestamp } from '@google-cloud/firestore';
import { getFiremapperStorage } from '../storage/storage-utils.js';
import type { SerializedDocRef } from '../types.js';
import {
  isDocumentReference,
  isGeoPoint,
  isSerializedDocRef,
  isSerializedTimestamp,
  isTimestamp,
} from '../utils.js';

// TODO Create one universal document serializer to be used across the codebase
/**
 * Serialize and deserialize data that includes complex firestore data types
 */
export class CacheSerializer {
  private firestoreRef: Firestore;

  constructor() {
    const { firestoreRef } = getFiremapperStorage();

    if (!firestoreRef) {
      throw new Error('Firestore reference is not initialized');
    }

    this.firestoreRef = firestoreRef;
  }

  /**
   * Serialize data for cache, handles complex firestore data types
   * @param data
   * @returns
   */
  public serialize(data: any): string {
    return JSON.stringify(data, (_, value) => {
      if (isDocumentReference(value)) {
        return {
          __docRef: true,
          path: value.path,
        };
      }
      if (isTimestamp(value))
        return {
          __timestamp: true,
          value: value.toDate().toISOString(),
        };
      if (isGeoPoint(value)) {
        return {
          __geoPoint: true,
          latitude: value.latitude,
          longitude: value.longitude,
        };
      }
      return value;
    });
  }

  public deserialize<T>(data: string): T {
    return JSON.parse(data, (_, value) => {
      if (isSerializedDocRef(value)) {
        return this.firestoreRef.doc(value.path);
      }
      if (isSerializedTimestamp(value)) {
        return Timestamp.fromDate(new Date(value.value));
      }
      if (isGeoPoint(value)) {
        return new GeoPoint(value.latitude, value.longitude);
      }
      return value;
    });
  }
}
