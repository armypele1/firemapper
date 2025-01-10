import type { RedisClientType } from 'redis';
import type { ICache, IEntity, PaginatedResponse } from '../types.js';
import { AbstractCache } from './abstract.js';
import { getFiremapperStorage } from '../storage/storage-utils.js';
import type { CollectionMetadata } from '../storage/storage.js';

export class RedisCache<T extends IEntity> extends AbstractCache<T> implements ICache<T> {
  protected override readonly redisClient: RedisClientType;

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
    await this.redisClient.set(`${this.path}:entity:${item.id}`, serialized, {
      EX: this.cacheTTL,
    });
  }

  public override async cacheQuery(
    query: any,
    queryResult: PaginatedResponse<T> | T,
  ): Promise<void> {
    const queryKey = this.getQueryKey(query);
    const serialized = this.cacheSerializer.serialize(queryResult);
    await this.redisClient.set(`${this.path}:query:${queryKey}`, serialized, {
      EX: this.cacheTTL,
    });
  }

  public override async invalidate(id?: string): Promise<void> {
    if (id) {
      await this.redisClient.del(`${this.path}:${id}`);
    }
    const queryPattern = `${this.path}:query:*`;
    const queryKeys = await this.redisClient.keys(queryPattern);
    if (queryKeys && queryKeys.length > 0) {
      await this.redisClient.del(queryKeys);
    }
  }

  public override async getCachedEntity(id: string): Promise<T | null> {
    const serialized = await this.redisClient.get(`${this.path}:entity:${id}`);
    if (!serialized) {
      return null;
    }
    return this.cacheSerializer.deserialize<T>(serialized);
  }

  public override async getCachedQueryMulti(
    query: FirebaseFirestore.Query,
  ): Promise<PaginatedResponse<T> | null> {
    const queryKey = this.getQueryKey(query);
    const serialized = await this.redisClient.get(`${this.path}:query:${queryKey}`);
    if (!serialized) {
      return null;
    }
    return this.cacheSerializer.deserialize<PaginatedResponse<T>>(serialized);
  }

  public override async getCachedQuerySingle(query: FirebaseFirestore.Query): Promise<T | null> {
    const queryKey = this.getQueryKey(query);
    const serialized = await this.redisClient.get(`${this.path}:query:${queryKey}`);
    if (!serialized) {
      return null;
    }
    return this.cacheSerializer.deserialize<T>(serialized);
  }
}
