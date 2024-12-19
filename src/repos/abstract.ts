import type { CollectionReference } from '@google-cloud/firestore';
import type { IEntity, IEntityConstructor, IRepository } from '../types/index.js';
import { BaseRepository } from './base.js';

export abstract class AbstractRepository<T extends IEntity>
  extends BaseRepository
  implements IRepository<T>
{
  protected readonly path: string;
  protected readonly config: MetadataStorageConfig;
  protected readonly firestoreColRef: CollectionReference;

  constructor(pathOrConstructor: IEntityConstructor) {
    super();

    const { getCollection, config, firestoreRef } = getStorage();
  }
}
