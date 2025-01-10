import { getFiremapperStorage } from '../storage/storage-utils.js';
import type { CollectionMetadata } from '../storage/storage.js';
import type { ICache, IEntity } from '../types.js';
import { RedisCache } from './redis.js';

// Factory method to create a cache manager for a collection
export function createCacheManager<T extends IEntity>(collMetadata: CollectionMetadata): ICache<T> {
  const { config } = getFiremapperStorage();
  const { cache } = config;

  if (!cache) {
    throw new Error('Caching is not enabled');
  }

  if (cache.type === 'redis') {
    return new RedisCache<T>(collMetadata);
  } else {
    throw new Error(`Unsupported cache type: ${cache.type}`);
  }
}
