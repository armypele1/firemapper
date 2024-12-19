import {
  Query,
  type WhereFilterOp,
  FieldValue,
  type OrderByDirection,
} from '@google-cloud/firestore';

export type Constructor<T> = { new (): T };
export type IEntityConstructor = Constructor<IEntity>;
export type IRepositoryConstructor = Constructor<IRepository<IEntity>>;

export interface IEntity {
  id: string;
  createTime: EpochTimeStamp;
  updateTime: EpochTimeStamp;
}

export type CreateData<T extends IEntity> = Omit<T, 'id' | 'createTime' | 'updateTime'>;

type OmitSystemFields<T extends IEntity> = Omit<T, 'id'> &
  Pick<IEntity, 'createTime' | 'updateTime'>;
export type TypedQuery<T extends IEntity> = Omit<Query<Omit<T, 'id'>>, 'where' | 'orderBy'> & {
  where<K extends keyof OmitSystemFields<T>>(
    fieldPath: K | '__name__' | '__createTime__' | '__updateTime__',
    opStr: WhereFilterOp,
    value: T[K] | FieldValue | T[K][],
  ): TypedQuery<T>;
  orderBy<K extends keyof OmitSystemFields<T>>(
    fieldPath: K | '__name__' | '__createTime__' | '__updateTime__',
    directionStr?: OrderByDirection,
  ): TypedQuery<T>;
};

export type FieldValueOperation = FieldValue | FirebaseFirestore.FieldValue;

export type UpdateData<T extends IEntity> = {
  [K in keyof Omit<T, 'id' | '__createTime__' | '__updateTime__'>]?: T[K] | FieldValueOperation;
};

export interface PaginationConfig {
  limit?: number;
  startAfter?: string;
  endBefore?: string;
}

export type QueryBuilder<T extends IEntity> = (query: TypedQuery<T>) => TypedQuery<T>;

export interface IQueryable<T extends IEntity> {
  findAll(queryBuilder?: QueryBuilder<T>, pagination?: PaginationConfig): Promise<T[]>;
  findOne(queryBuilder?: QueryBuilder<T>): Promise<T | null>;
}

export interface IBaseRepository<T extends IEntity> {
  findById(id: string): Promise<T | null>;
  create(item: CreateData<T>): Promise<T>;
  update(item: UpdateData<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

export type IRepository<T extends IEntity> = IBaseRepository<T> & IQueryable<T>;
export type ITransactionRepository<T extends IEntity> = IRepository<T>;

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
