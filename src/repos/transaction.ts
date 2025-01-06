import { DocumentSnapshot, Query, Timestamp, type Transaction } from '@google-cloud/firestore';
import type {
  DocId,
  IEntity,
  EntityConstructor,
  ITransactionRepository,
  PaginatedQueryOptions,
  PaginatedResponse,
  PartialBy,
  QueryBuilder,
  SimpleQueryBuilder,
  TypedQuery,
  TypedUpdateData,
} from '../types.js';
import { AbstractRepository } from './abstract.js';

export class TransactionRepository<T extends IEntity>
  extends AbstractRepository<T>
  implements ITransactionRepository<T>
{
  constructor(
    constructor: EntityConstructor,
    private transaction: Transaction,
  ) {
    super(constructor);
    this.transaction = transaction;
  }

  public async findById(id: DocId): Promise<T | null> {
    const doc = await this.transaction.get(this.colRef.doc(id));
    if (!doc.exists) {
      return null;
    }
    return this.docToEntity(doc);
  }

  public override async findByRef(ref: FirebaseFirestore.DocumentReference): Promise<T | null> {
    const doc = await this.transaction.get(ref);
    if (!doc.exists) {
      return null;
    }
    return this.docToEntity(doc);
  }

  public async save(item: PartialBy<T, 'id'>): Promise<T> {
    const doc = item.id ? this.colRef.doc(item.id) : this.colRef.doc();
    const now = Timestamp.now().seconds;

    /* This existence check is not within the transaction since all reads must be
    done before writes in Firestore transactions. */
    const exists = item.id ? (await doc.get()).exists : false;
    const itemToSave = {
      ...this.toSerializable(item),
      updateTime: now,
      ...(exists ? {} : { createTime: now }),
    };

    await this.transaction.set(doc, itemToSave);
    return this.serializableToEntity(doc, itemToSave);
  }

  public async update(item: T, fields: TypedUpdateData<T>): Promise<void> {
    const doc = this.colRef.doc(item.id);
    const serializedFields = this.toFirestoreUpdateData(fields);
    const now = Timestamp.now().seconds;

    await this.transaction.update(doc, {
      ...serializedFields,
      updateTime: now,
    });
  }

  public async delete(id: string): Promise<void> {
    await this.transaction.delete(this.colRef.doc(id));
  }

  public async findOne(queryBuilder: SimpleQueryBuilder<T>): Promise<T | null> {
    let query = queryBuilder
      ? queryBuilder(this.simpleBaseQuery)
      : this.simpleBaseQuery.orderBy('updateTime', 'desc');
    const snapshot = await this.transaction.get((query as TypedQuery<T>).limit(1));
    if (snapshot.empty) {
      return null;
    }
    const doc = snapshot.docs[0]!;
    return this.docToEntity(doc);
  }

  public async findAll(
    queryBuilder: SimpleQueryBuilder<T>,
    page?: PaginatedQueryOptions,
  ): Promise<PaginatedResponse<T>> {
    const query = (
      queryBuilder
        ? queryBuilder(this.simpleBaseQuery)
        : this.simpleBaseQuery.orderBy('updateTime', 'desc')
    ) as TypedQuery<T>;
    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    const { query: paginatedQuery, limit } = await this.applyPagination(query, page);

    const snapshot = await this.transaction.get(paginatedQuery as unknown as Query<T>);
    const hasMore = !!(limit && snapshot.docs.length > limit);
    const docs = hasMore ? snapshot.docs.slice(0, limit) : snapshot.docs;
    const items = docs.map((doc) => this.docToEntity(doc));

    return {
      items,
      lastDoc: docs.length > 0 ? docs[docs.length - 1]!.id : null,
      firstDoc: docs.length > 0 ? docs[0]!.id : null,
      hasMore,
      total,
    };
  }

  public async customQuery(queryBuilder: QueryBuilder<T>): Promise<T[]> {
    const query = queryBuilder(this.baseQuery) as TypedQuery<T>;
    const snapshot = await this.transaction.get(query as unknown as Query<T>);
    return snapshot.docs.map((doc) => this.docToEntity(doc));
  }
}
