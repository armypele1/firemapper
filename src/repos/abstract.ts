import type { CollectionReference } from '@google-cloud/firestore';
import type { IEntity, IEntityConstructor, IRepository, QueryBuilder } from '../types.js';
import { BaseRepository } from './base.js';
import { getFiremapperStorage } from '../storage/storage-utils.js';
import type { FireMapperStorageConfig } from '../storage/storage.js';

export abstract class AbstractRepository<T extends IEntity>
  extends BaseRepository
  implements IRepository<T>
{
  protected readonly path: string;
  protected readonly config: FireMapperStorageConfig;
  protected readonly firestoreColRef: CollectionReference;

  constructor(constructor: IEntityConstructor) {
    super();

    const { getCollection, config, firestoreRef } = getFiremapperStorage();

    if (!firestoreRef) {
      throw new Error('Firestore reference is not initialized');
    }

    const colMetadata = getCollection(constructor);
    if (!colMetadata) {
      throw new Error(`There is no metadata stored for "${constructor.name}"`);
    }

    this.config = config;
    this.path = constructor.name;
    this.firestoreColRef = firestoreRef.collection(this.path);
  }

  abstract create(item: T): Promise<T>;

  abstract update(item: T): Promise<T>;

  abstract delete(id: string): Promise<void>;

  abstract findById(id: string): Promise<T | null>;

  abstract findOne(queryBuilder: QueryBuilder<T>): Promise<T | null>;

  abstract findAll(queryBuilder: QueryBuilder<T>): Promise<T[]>;
}
