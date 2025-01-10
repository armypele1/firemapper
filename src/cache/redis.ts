import type { RedisClientType } from 'redis';
import type { ICache, IEntity, PaginatedResponse } from '../types.js';
import { AbstractCache } from './abstract.js';
import { getFiremapperStorage } from '../storage/storage-utils.js';
import type { CollectionMetadata } from '../storage/storage.js';

export class RedisCache<T extends IEntity> extends AbstractCache<T> implements ICache<T> {
  protected override readonly redisClient: RedisClientType | undefined;

  constructor(collMetadata: CollectionMetadata) {
    super(collMetadata); // Dummy call
    const { config } = getFiremapperStorage();
    if (!config.cache?.redisClient) {
      throw new Error('Redis client is not initialized');
    }

    this.redisClient = config.cache.redisClient;
  }

  public override async cacheEntity(item: T): Promise<void> {
    const serialized = this.cacheSerializer.serialize(item);
    await this.redisClient!.set(`${this.collPath}:${item.id}`, serialized, {
      EX: this.cacheTTL,
    });
  }

  public override async cacheQuery(
    query: any,
    queryResult: PaginatedResponse<T> | T,
  ): Promise<void> {
    const queryKey = this.getQueryKey(query);
    const serialized = this.cacheSerializer.serialize(queryResult);
    await this.redisClient!.set(`${this.collPath}:query:${queryKey}`, serialized, {
      EX: this.cacheTTL,
    });
  }

  public override async invalidate(id?: string): Promise<void> {
    if (id) {
      await this.redisClient!.del(`${this.collPath}:${id}`);
    }
    const queryPattern = `${this.collPath}:query:*`;
    const queryKeys = await this.redisClient!.keys(queryPattern);
    if (queryKeys && queryKeys.length > 0) {
      await this.redisClient!.del(queryKeys);
    }
  }

  public override async getCachedEntity(id: string): Promise<T | null> {
    const serialized = await this.redisClient!.get(`${this.collPath}:${id}`);
    if (!serialized) {
      return null;
    }
    return this.cacheSerializer.deserialize<T>(serialized);
  }

  public override async getCachedQueryMulti(
    query: FirebaseFirestore.Query,
  ): Promise<PaginatedResponse<T> | null> {
    const queryKey = this.getQueryKey(query);
    const serialized = await this.redisClient!.get(`${this.collPath}:query:${queryKey}`);
    if (!serialized) {
      return null;
    }
    return this.cacheSerializer.deserialize<PaginatedResponse<T>>(serialized);
  }

  public override async getCachedQuerySingle(query: FirebaseFirestore.Query): Promise<T | null> {
    const queryKey = this.getQueryKey(query);
    const serialized = await this.redisClient!.get(`${this.collPath}:query:${queryKey}`);
    if (!serialized) {
      return null;
    }
    return this.cacheSerializer.deserialize<T>(serialized);
  }
}
