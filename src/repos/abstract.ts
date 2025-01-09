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
} from '../types.js';
import { getFiremapperStorage } from '../storage/storage-utils.js';
import type { CollectionMetadata, FireMapperStorageConfig } from '../storage/storage.js';
import { createSimpleTypedQuery, createTypedQuery } from '../query.js';
import { serializeExceptFieldValues, serializeExceptFirestoreDatatypes } from '../utils.js';
import * as crypto from 'crypto';

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
  protected readonly config: FireMapperStorageConfig;
  protected readonly colRef: CollectionReference;
  protected readonly baseQuery: TypedQuery<T>;
  protected readonly simpleBaseQuery: SimpleTypedQuery<T>;
  protected readonly colMetadata: CollectionMetadata;
  protected readonly enabledCache: boolean;

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

    this.colMetadata = colMetadata;
    this.config = config;
    this.path = colMetadata.name;
    this.colRef = firestoreRef.collection(this.path);
    this.baseQuery = createTypedQuery(this.colRef);
    this.simpleBaseQuery = createSimpleTypedQuery(this.colRef);
    this.enabledCache = !!(config.cache && config.cache.type === 'redis');
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
    const serialized = serializeExceptFirestoreDatatypes(item);
    delete serialized.id;
    delete serialized.ref;
    delete serialized.createTime;
    delete serialized.updateTime;

    return serialized;
  }

  protected toFirestoreUpdateData(updates: TypedUpdateData<T>): Record<string, unknown> {
    return serializeExceptFieldValues(updates);
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

  // **** Caching ****
  protected async setCached(key: string, value: any): Promise<void> {
    if (!this.config.cache) return;
    await this.config.cache.redisClient.set(key, JSON.stringify(value), {
      EX: this.config.cache!.ttl,
    });
  }

  protected getCacheKey(id: string): string {
    return `${this.path}:${id}`;
  }

  /** Create a deterministic cache key based on query parameters */
  protected getQueryCacheKey(query: TypedQuery<T>): string {
    const hashedKey = crypto.createHash('md5').update(JSON.stringify(query)).digest('hex');
    return `${this.path}:query:${hashedKey}`;
  }

  protected async getCached(key: string): Promise<any | null> {
    if (!this.config.cache) return null;
    const cached = await this.config.cache.redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  protected async invalidateCache(id: string): Promise<void> {
    if (!this.config.cache) return;

    const key = this.getCacheKey(id);
    await this.config.cache.redisClient.del(key);

    // Invalidate all cached queries
    const queryPattern = `${this.path}:query:*`;
    const queryKeys = await this.config.cache.redisClient.keys(queryPattern);
    if (queryKeys && queryKeys.length > 0) {
      await this.config.cache.redisClient.del(queryKeys);
    }
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
