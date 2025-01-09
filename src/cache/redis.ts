import type { RedisClientType } from 'redis';
import type { ICache, IEntity } from '../types.js';
import { BaseCache } from './base.js';
import { getFiremapperStorage } from '../storage/storage-utils.js';

export class RedisCache<T extends IEntity> extends BaseCache<T> implements ICache<T> {
  private override readonly redisClient: RedisClientType | undefined;

  constructor() {
    super(); // Dummy call
    const { redisClient } = getFiremapperStorage();

    if (!redisClient) {
      throw new Error('Redis client is not initialized');
    }
    this.redisClient = redisClient;
  }

  public override async cacheEntity(item: T): Promise<void> {}
}
