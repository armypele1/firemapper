import type {
  Query,
  WhereFilterOp,
  FieldValue,
  OrderByDirection,
  FieldPath,
} from '@google-cloud/firestore';
import {
  type IEntity,
  type ToFirestoreField,
  SYSTEM_FIELD_MAP,
  type SystemField,
  type TypedQuery,
  type SimpleTypedQuery,
} from './types.js';

/**
 * Converts system field to firestore field (e.g. id -> \_\_name\_\_)
 * @param field - field to convert to firestore field
 * @returns either a firestore system field (e.g. name) or just the field itself
 */
export function toFirestoreField<T extends IEntity, K extends keyof T>(
  field: Omit<K, 'ref'>,
): ToFirestoreField<K, T> {
  return (SYSTEM_FIELD_MAP[field as unknown as SystemField] ?? field) as ToFirestoreField<K, T>;
}

/**
 * Factory method to create a typed query with mapped fields (e.g. id -> \_\_name\_\_)
 * @param query - query to convert to typed query
 * @returns typed query
 */
export function createTypedQuery<T extends IEntity>(query: Query): TypedQuery<T> {
  const typedQuery = query as unknown as TypedQuery<T>;

  const originalWhere = query.where.bind(query);
  typedQuery.where = function <K extends keyof T>(
    fieldPath: Omit<K, 'ref'>,
    opStr: WhereFilterOp,
    value: T[K] | FieldValue | T[K][],
  ): TypedQuery<T> {
    const firestoreField = toFirestoreField<T, K>(fieldPath);
    return createTypedQuery<T>(originalWhere(firestoreField as string, opStr, value));
  };

  const originalOrderBy = query.orderBy.bind(query);
  typedQuery.orderBy = function <K extends keyof T>(
    fieldPath: Omit<K, 'ref'>,
    directionStr?: OrderByDirection,
  ): TypedQuery<T> {
    const firestoreField = toFirestoreField<T, K>(fieldPath);
    return createTypedQuery<T>(originalOrderBy(firestoreField as string, directionStr));
  };

  // TODO Override get to optionally populate document references

  return typedQuery;
}

/** Factory function to create a reduced typed query */
export function createSimpleTypedQuery<T extends IEntity>(query: Query): SimpleTypedQuery<T> {
  return createTypedQuery<T>(query) as SimpleTypedQuery<T>;
}
