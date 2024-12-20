import {
  Query,
  type WhereFilterOp,
  FieldValue,
  type OrderByDirection,
  Timestamp,
} from '@google-cloud/firestore';

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Constructor<T> = { new (): T };
export type IEntityConstructor = Constructor<IEntity>;
export type IRepositoryConstructor = Constructor<IRepository<IEntity>>;

export interface IEntity {
  id: string;
  createTime: Timestamp;
  updateTime: Timestamp;
}

export type CreateData<T extends IEntity> = Omit<PartialBy<T, 'id'>, 'createTime' | 'updateTime'>;
export type UpdateData<T extends IEntity> = PartialBy<T, 'createTime' | 'updateTime'>;

export const SYSTEM_FIELD_MAP = {
  id: '__name__',
};

export type SystemFieldMap = typeof SYSTEM_FIELD_MAP;
export type SystemField = keyof typeof SYSTEM_FIELD_MAP;
export type FirestoreSystemField = SystemFieldMap[SystemField];

export type ToFirestoreField<K extends keyof T, T extends IEntity> = K extends SystemField
  ? SystemFieldMap[K]
  : K;

type ControlledBuilderMethods = keyof Pick<Query, 'where' | 'orderBy'>;

interface QueryOverrides<T extends IEntity> {
  where<K extends keyof T>(
    fieldPath: K,
    opStr: WhereFilterOp,
    value: T[K] | FieldValue | T[K][],
  ): TypedQuery<T>;
  orderBy<K extends keyof T>(fieldPath: K, directionStr?: OrderByDirection): TypedQuery<T>;
}

export type TypedQuery<T extends IEntity> = Omit<Query<T>, ControlledBuilderMethods> &
  QueryOverrides<T>;

// Used for queries in the findAll/findOne methods
export type SimpleTypedQuery<T extends IEntity> = QueryOverrides<T>;

export type FieldValueOperation = FieldValue | FirebaseFirestore.FieldValue;
export type DocId = string;

export interface PaginatedResponse<T> {
  items: T[];
  lastDoc: string | null; // last document ID in the current page
  firstDoc: string | null; // first document ID in the current page
  hasMore: boolean; // indicates if there are more results
  total?: number; // optional total count (if requested)
}

export type QueryBuilder<T extends IEntity> = (query: TypedQuery<T>) => TypedQuery<T>;
export type SimpleQueryBuilder<T extends IEntity> = (
  query: SimpleTypedQuery<T>,
) => SimpleTypedQuery<T>;

export interface IQueryable<T extends IEntity> {
  findAll(
    queryBuilder?: SimpleQueryBuilder<T>,
    limit?: number,
    startAfter?: DocId,
    endBefore?: DocId,
  ): Promise<PaginatedResponse<T>>;
  findOne(queryBuilder?: SimpleQueryBuilder<T>): Promise<T | null>;
  customQuery(queryBuilder: QueryBuilder<T>): Promise<T[]>;
}

export interface IBaseRepository<T extends IEntity> {
  findById(id: DocId): Promise<T | null>;
  create(item: CreateData<T>): Promise<T>;
  update(item: UpdateData<T>): Promise<T>;
  delete(id: DocId): Promise<void>;
}

export type IRepository<T extends IEntity> = IBaseRepository<T> & IQueryable<T>;
export type ITransactionRepository<T extends IEntity> = IRepository<T>;

export interface ITransactionReference<T = IEntity> {
  entity: T;
  propertyKey: string;
  path: string;
}

export type ITransactionReferenceStorage = Set<ITransactionReference>;

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
