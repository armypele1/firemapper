import {
  Query,
  type WhereFilterOp,
  FieldValue,
  type OrderByDirection,
  DocumentReference,
} from '@google-cloud/firestore';
import { type UpdateData } from '@google-cloud/firestore';

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Constructor<T> = { new (): T };
export type EntityConstructor = Constructor<IEntity>;
export type RepositoryConstructor = Constructor<IRepository<IEntity>>;

// I want to use Firestore timestamps, but there is currently a bug in the Firestore emulator
// where it thinks there is an issue with the expected timestamp format
export interface IEntity {
  readonly id: string;
  readonly createTime: EpochTimeStamp;
  readonly updateTime: EpochTimeStamp;
  readonly ref: DocumentReference;
}

export type CreateData<T extends IEntity> = Omit<
  PartialBy<T, 'id'>,
  'createTime' | 'updateTime' | 'ref'
>;
export type TypedUpdateData<T extends IEntity> = UpdateData<
  Omit<T, 'id' | 'createTime' | 'updateTime' | 'ref'>
>;

export const SYSTEM_FIELD_MAP = {
  id: '__name__',
};

// TODO - add tests to make sure this covers all transforms
export const FIRESTORE_TRANSFORMS = [
  // Client SDK transforms
  'NumericIncrementTransform',
  'DeleteTransform',
  'ServerTimestampTransform',
  'ArrayUnionTransform',
  'ArrayRemoveTransform',

  // Admin SDK transforms
  'FieldTransform',
  'DeleteTransform', // Appears in both SDKs
] as const;

export type SystemFieldMap = typeof SYSTEM_FIELD_MAP;
export type SystemField = keyof typeof SYSTEM_FIELD_MAP;
export type FirestoreSystemField = SystemFieldMap[SystemField];

export type ToFirestoreField<K extends keyof T, T extends IEntity> = K extends SystemField
  ? SystemFieldMap[K]
  : K;

type ControlledBuilderMethods = keyof Pick<Query, 'where' | 'orderBy'>;

interface QueryOverrides<T extends IEntity> {
  where<K extends keyof T>(
    fieldPath: Exclude<K, 'ref'>,
    opStr: WhereFilterOp,
    value: T[K] | FieldValue | T[K][],
  ): TypedQuery<T>;
  orderBy<K extends keyof T>(
    fieldPath: Exclude<K, 'ref'>,
    directionStr?: OrderByDirection,
  ): TypedQuery<T>;
}

export type TypedQuery<T extends IEntity> = Omit<Query<T>, ControlledBuilderMethods> &
  QueryOverrides<T>;

// Used for queries in the findAll/findOne methods
export type SimpleTypedQuery<T extends IEntity> = QueryOverrides<T>;

export type FieldValueOperation = FieldValue | FirebaseFirestore.FieldValue;
export type DocId = string;

export interface PaginatedQueryOptions {
  limit?: number;
  startAfter?: DocId;
  endBefore?: DocId;
}

/**
 * A paginated response containing items and pagination metadata.
 * @template T The type of items
 */
export interface PaginatedResponse<T> {
  /** Items in the current page */
  items: T[];
  /** ID of the last document (for next page cursor) */
  lastDoc: string | null;
  /** ID of the first document (for previous page cursor) */
  firstDoc: string | null;
  /** Whether there are more pages available */
  hasMore: boolean;
  /** Total number of items across all pages */
  total: number;
}

export const DEFAULT_PAGE_SIZE = 10 as const;

export type QueryBuilder<T extends IEntity> = (query: TypedQuery<T>) => TypedQuery<T>;
export type SimpleQueryBuilder<T extends IEntity> = (
  query: SimpleTypedQuery<T>,
) => SimpleTypedQuery<T>;

export interface IQueryable<T extends IEntity> {
  findAll(
    queryBuilder?: SimpleQueryBuilder<T>,
    page?: PaginatedQueryOptions,
  ): Promise<PaginatedResponse<T>>;
  findOne(queryBuilder?: SimpleQueryBuilder<T>): Promise<T | null>;
  customQuery(queryBuilder: QueryBuilder<T>): Promise<T[]>;
}

export interface IBaseRepository<T extends IEntity> {
  findById(id: DocId): Promise<T | null>;
  save(item: CreateData<T>): Promise<T>;
  update(item: T, updates: TypedUpdateData<T>): Promise<T> | Promise<void>;
  delete(id: DocId): Promise<void>;
}

export type IRepository<T extends IEntity> = IBaseRepository<T> & IQueryable<T>;
export type ITransactionRepository<T extends IEntity> = IRepository<T> & IQueryable<T>;

export interface ITransactionReference<T = IEntity> {
  entity: T;
  propertyKey: string;
  path: string;
}

export interface IFirestoreTransaction<T extends IEntity = IEntity> {
  getRepository(entityConstructor: EntityConstructor): IRepository<T>;
}

export interface ICache<T> {
  invalidate(id: string): Promise<void>;
  cacheEntity(item: T): Promise<void>;
  cacheQuery(query: Query | TypedQuery<any>, queryResult: T | PaginatedResponse<T>): Promise<void>;
  getCachedEntity(id: string): Promise<T | null>;
  getCachedQueryMulti(query: Query | TypedQuery<any>): Promise<PaginatedResponse<T> | null>;
  getCachedQuerySingle(query: Query | TypedQuery<any>): Promise<T | null>;
}

export interface SerializedDocRef {
  __docRef: true;
  path: string;
}

export interface ValidatorOptions {
  /**
   * If set to true then validator will skip validation of all properties that are undefined in the validating object.
   */
  skipUndefinedProperties?: boolean;
  /**
   * If set to true then validator will skip validation of all properties that are null in the validating object.
   */
  skipNullProperties?: boolean;
  /**
   * If set to true then validator will skip validation of all properties that are null or undefined in the validating object.
   */
  skipMissingProperties?: boolean;
  /**
   * If set to true validator will strip validated object of any properties that do not have any decorators.
   *
   * Tip: if no other decorator is suitable for your property use @Allow decorator.
   */
  whitelist?: boolean;
  /**
   * If set to true, instead of stripping non-whitelisted properties validator will throw an error
   */
  forbidNonWhitelisted?: boolean;
  /**
   * Groups to be used during validation of the object.
   */
  groups?: string[];
  /**
   * If set to true, the validation will not use default messages.
   * Error message always will be undefined if its not explicitly set.
   */
  dismissDefaultMessages?: boolean;
  /**
   * ValidationError special options.
   */
  validationError?: {
    /**
     * Indicates if target should be exposed in ValidationError.
     */
    target?: boolean;
    /**
     * Indicates if validated value should be exposed in ValidationError.
     */
    value?: boolean;
  };
  /**
   * Settings true will cause fail validation of unknown objects.
   */
  forbidUnknownValues?: boolean;
}

export interface MetadataStorageConfig {
  validateModels: boolean;
  validatorOptions?: ValidatorOptions;
  throwOnDuplicatedCollection?: boolean;
}
