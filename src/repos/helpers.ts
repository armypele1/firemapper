import type { Constructor, IEntity } from '../types.js';
import { BaseRepository } from './base.js';
import { getFiremapperStorage } from '../storage/storage-utils.js';

export function getRepository<T extends IEntity>(
  entityConstructor: Constructor<T>,
): BaseRepository<T> {
  const metadataStorage = getFiremapperStorage();

  if (!metadataStorage.firestoreRef) {
    throw new Error('Firestore must be initialized first');
  }

  const collection = metadataStorage.getCollection(entityConstructor);
  const collectionName = entityConstructor.name;
  if (!collection) {
    throw new Error(`'${collectionName}' is not a valid collection`);
  }

  const repository = metadataStorage.getRepository(collection.entityConstructor);
  if (repository) {
    return new (repository?.target as any)(entityConstructor);
  } else {
    return new BaseRepository<T>(entityConstructor);
  }
}
