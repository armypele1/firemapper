import { Firestore } from '@google-cloud/firestore';
import { getFiremapperStorage } from '../storage/storage-utils.js';
import type { SerializedDocRef } from '../types.js';
import { isDocumentReference } from '../utils.js';

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

  private isSerializedDocRef(value: unknown): value is SerializedDocRef {
    return (
      typeof value === 'object' &&
      value !== null &&
      '__docRef' in value &&
      typeof (value as SerializedDocRef).path === 'string'
    );
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
      return value;
    });
  }

  public deserialize<T>(data: string): T {
    return JSON.parse(data, (_, value) => {
      if (this.isSerializedDocRef(value)) {
        return this.firestoreRef.doc(value.path);
      }
      return value;
    });
  }
}
