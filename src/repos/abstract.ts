import type { CollectionReference, DocumentSnapshot, WriteResult } from '@google-cloud/firestore';
import type {
  CreateData,
  IEntity,
  IEntityConstructor,
  IRepository,
  PaginatedResponse,
  PartialBy,
  QueryBuilder,
  SimpleQueryBuilder,
  SimpleTypedQuery,
  TypedQuery,
  UpdateData,
} from '../types.js';
import { getFiremapperStorage } from '../storage/storage-utils.js';
import type { CollectionMetadata, FireMapperStorageConfig } from '../storage/storage.js';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { serializeKey } from '../decorators/serialize.js';
import { createSimpleTypedQuery, createTypedQuery } from '../query.js';

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
  protected readonly firestoreColRef: CollectionReference;
  protected readonly baseQuery: TypedQuery<T>;
  protected readonly simpleBaseQuery: SimpleTypedQuery<T>;
  protected readonly colMetadata: CollectionMetadata;

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

    this.colMetadata = colMetadata;
    this.config = config;
    this.path = constructor.name;
    this.firestoreColRef = firestoreRef.collection(this.path);
    this.baseQuery = createTypedQuery(this.firestoreColRef);
    this.simpleBaseQuery = createSimpleTypedQuery(this.firestoreColRef);
  }

  protected toEntity(doc: DocumentSnapshot): T {
    return plainToInstance(this.colMetadata.entityConstructor, {
      id: doc.id,
      ...doc.data(),
    }) as T;
  }

  protected toSerializable(item: T | PartialBy<T, 'id'>): Record<string, unknown> {
    const serialized = instanceToPlain(item);
    delete serialized.id;
    delete serialized.createTime;
    delete serialized.updateTime;

    return serialized;
  }

  abstract create(item: CreateData<T>): Promise<T>;

  abstract update(item: UpdateData<T>): Promise<T>;

  abstract delete(id: string): Promise<void>;

  abstract findById(id: string): Promise<T | null>;

  abstract findOne(queryBuilder: SimpleQueryBuilder<T>): Promise<T | null>;

  abstract findAll(queryBuilder: SimpleQueryBuilder<T>): Promise<PaginatedResponse<T>>;

  abstract customQuery(queryBuilder: QueryBuilder<T>): Promise<T[]>;
}
