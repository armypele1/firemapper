import type { RedisClientType } from 'redis';
import { getFiremapperStorage } from '../storage/storage-utils.js';
import type { EntityConstructor, ICache, IEntity, PaginatedResponse } from '../types.js';
import type { CollectionMetadata } from '../storage/storage.js';
import type { Query } from '@google-cloud/firestore';
import { createHash } from 'crypto';

/**
 * Dummy class created with the sole purpose to be able to
 * check if other classes are instances of FiremapperCache.
 * Typescript is not capable to check instances of generics.
 *
 * @export
 * @class FiremapperCache
 */
export class FiremapperCache {}

export abstract class BaseCache<T extends IEntity> extends FiremapperCache implements ICache<T> {
  private readonly redisClient: RedisClientType | undefined;

  constructor() {
    super(); // Dummy call
  }

  protected getQueryKey(query: Query) {
    return createHash('md5').update(JSON.stringify(query)).digest('hex');
  }

  public abstract invalidateCache(item?: T): Promise<void>;

  public abstract cacheEntity(item: T): Promise<void>;

  public abstract cacheQuery(query: Query): Promise<void>;

  public abstract getCachedEntity(id: string): Promise<T | null>;

  public abstract getCachedQuery(query: Query): Promise<PaginatedResponse<T>>;
}
