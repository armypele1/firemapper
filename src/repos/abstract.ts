import {
  DocumentReference,
  type CollectionReference,
  type DocumentSnapshot,
} from '@google-cloud/firestore';
import {
  DEFAULT_PAGE_SIZE,
  type CreateData,
  type DocId,
  type IEntity,
  type EntityConstructor,
  type IRepository,
  type PaginatedQueryOptions,
  type PaginatedResponse,
  type PartialBy,
  type QueryBuilder,
  type SimpleQueryBuilder,
  type SimpleTypedQuery,
  type TypedQuery,
  type TypedUpdateData,
  type ICache,
} from '../types.js';
import { getFiremapperStorage } from '../storage/storage-utils.js';
import type { CollectionMetadata, FireMapperStorageConfig } from '../storage/storage.js';
import { createSimpleTypedQuery, createTypedQuery } from '../query.js';
import { serializeWithFirestoreDatatypes } from '../utils.js';
import { createCacheManager } from '../cache/helpers.js';

/**
 * Dummy class created with the sole purpose to be able to
 * check if other classes are instances of BaseRepository.
 * Typescript is not capable to check instances of generics.
 *
 * @export
 * @class FiremapperRepository
 */
export class FiremapperRepository {}

export abstract class AbstractRepository<T extends IEntity>
  extends FiremapperRepository
  implements IRepository<T>
{
  protected readonly path: string;
  protected readonly colRef: CollectionReference;
  protected readonly baseQuery: TypedQuery<T>;
  protected readonly simpleBaseQuery: SimpleTypedQuery<T>;
  protected readonly colMetadata: CollectionMetadata;
  protected readonly cacheManager: ICache<T> | undefined;

  constructor(constructor: EntityConstructor) {
    super(); // Dummy call
    const { getCollection, config, firestoreRef } = getFiremapperStorage();

    if (!firestoreRef) {
      throw new Error('Firestore reference is not initialized');
    }

    const colMetadata = getCollection(constructor);
    if (!colMetadata) {
      throw new Error(`There is no metadata stored for "${constructor.name}"`);
    }

    if (config.cache) {
      this.cacheManager = createCacheManager<T>(colMetadata);
    }

    this.colMetadata = colMetadata;
    this.path = colMetadata.name;
    this.colRef = firestoreRef.collection(this.path);
    this.baseQuery = createTypedQuery(this.colRef);
    this.simpleBaseQuery = createSimpleTypedQuery(this.colRef);
  }

  protected docToEntity(doc: DocumentSnapshot): T {
    return {
      id: doc.id,
      ref: doc.ref,
      ...doc.data(),
    } as T;
  }

  protected serializableToEntity(
    ref: DocumentReference,
    serializedData: Record<string, unknown>,
  ): T {
    return {
      id: ref.id,
      ref,
      ...serializedData,
    } as T;
  }

  protected toSerializable(item: T | PartialBy<T, 'id'>): Record<string, unknown> {
    const serialized = serializeWithFirestoreDatatypes(item);
    delete serialized.id;
    delete serialized.ref;
    delete serialized.createTime;
    delete serialized.updateTime;

    return serialized;
  }

  protected toFirestoreUpdateData(updates: TypedUpdateData<T>): Record<string, unknown> {
    return serializeWithFirestoreDatatypes(updates);
  }

  protected async applyPagination(
    query: TypedQuery<T>,
    page: PaginatedQueryOptions | undefined,
  ): Promise<{ query: TypedQuery<T>; limit: number | null }> {
    if (!page) {
      return { query, limit: null };
    }
    if (page.startAfter) {
      const startDoc = await this.colRef.doc(page.startAfter).get();
      if (startDoc.exists) {
        query = query.startAfter(startDoc) as TypedQuery<T>;
      }
    } else if (page.endBefore) {
      const endDoc = await this.colRef.doc(page.endBefore).get();
      if (endDoc.exists) {
        query = query.endBefore(endDoc) as TypedQuery<T>;
      }
    }
    const limit = page.limit ?? DEFAULT_PAGE_SIZE;
    query = query.limit(limit + 1) as TypedQuery<T>;
    return { query, limit };
  }

  abstract save(item: CreateData<T>): Promise<T>;

  // void for transaction
  abstract update(item: T, updates: TypedUpdateData<T>): Promise<T> | Promise<void>;

  abstract delete(id: string): Promise<void>;

  abstract findById(id: string): Promise<T | null>;

  abstract findByRef(ref: DocumentReference): Promise<T | null>;

  abstract findOne(queryBuilder: SimpleQueryBuilder<T>): Promise<T | null>;

  abstract findAll(
    queryBuilder: SimpleQueryBuilder<T>,
    page?: PaginatedQueryOptions,
  ): Promise<PaginatedResponse<T>>;

  abstract customQuery(queryBuilder: QueryBuilder<T>): Promise<T[]>;
}
