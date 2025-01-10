import type { RedisClientType } from 'redis';
import { getFiremapperStorage } from '../storage/storage-utils.js';
import type {
  EntityConstructor,
  ICache,
  IEntity,
  PaginatedResponse,
  TypedQuery,
} from '../types.js';
import type { CollectionMetadata } from '../storage/storage.js';
import type { Query } from '@google-cloud/firestore';
import { createHash } from 'crypto';
import { CacheSerializer } from './serializer.js';

/**
 * Dummy class created with the sole purpose to be able to
 * check if other classes are instances of FiremapperCache.
 * Typescript is not capable to check instances of generics.
 *
 * @export
 * @class FiremapperCache
 */
export class FiremapperCache {}

export abstract class AbstractCache<T extends IEntity>
  extends FiremapperCache
  implements ICache<T>
{
  protected readonly redisClient: RedisClientType | undefined;
  protected readonly cacheSerializer: CacheSerializer;
  protected readonly collPath: string;
  protected readonly cacheTTL: number;

  constructor(collMetadata: CollectionMetadata) {
    super(); // Dummy call
    this.collPath = collMetadata.name;
    this.cacheSerializer = new CacheSerializer();
    const { config } = getFiremapperStorage();
    this.cacheTTL = config.cache?.ttl || 10;
  }

  protected getQueryKey(query: Query) {
    return createHash('md5').update(JSON.stringify(query)).digest('hex');
  }

  public abstract invalidate(id?: string): Promise<void>;

  public abstract cacheEntity(item: T): Promise<void>;

  public abstract cacheQuery(query: Query, queryResult: T | PaginatedResponse<T>): Promise<void>;

  public abstract getCachedEntity(id: string): Promise<T | null>;

  public abstract getCachedQueryMulti(query: Query): Promise<PaginatedResponse<T> | null>;

  public abstract getCachedQuerySingle(query: Query | TypedQuery<any>): Promise<T | null>;
}
