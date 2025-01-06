import {
  DEFAULT_PAGE_SIZE,
  type DocId,
  type IEntity,
  type IRepository,
  type PaginatedQueryOptions,
  type PaginatedResponse,
  type PartialBy,
  type QueryBuilder,
  type SimpleQueryBuilder,
  type TypedQuery,
  type TypedUpdateData,
} from '../types.js';
import { AbstractRepository } from './abstract.js';
import { Timestamp, type UpdateData } from '@google-cloud/firestore';

export class BaseRepository<T extends IEntity>
  extends AbstractRepository<T>
  implements IRepository<T>
{
  private async get(id: DocId): Promise<T> {
    const doc = await this.colRef.doc(id).get();
    if (!doc.exists) {
      throw new Error(`Document with id ${id} does not exist`);
    }
    return this.docToEntity(doc);
  }

  public async save(item: PartialBy<T, 'id'>): Promise<T> {
    const doc = item.id ? this.colRef.doc(item.id) : this.colRef.doc();
    const now = Timestamp.now().seconds;

    const exists = item.id ? (await doc.get()).exists : false;
    const itemToSave = {
      ...this.toSerializable(item),
      updateTime: now,
      ...(exists ? {} : { createTime: now }),
    };

    console.log(itemToSave);

    await doc.set(itemToSave);
    return this.serializableToEntity(doc, itemToSave);
  }

  public async update(item: T, fields: TypedUpdateData<T>): Promise<T> {
    const doc = this.colRef.doc(item.id);
    const serializedFields = this.toFirestoreUpdateData(fields);
    const now = Timestamp.now().seconds;

    const res = await doc.update({
      ...serializedFields,
      updateTime: now,
    });
    return this.get(item.id);
  }

  public async delete(id: string): Promise<void> {
    await this.colRef.doc(id).delete();
  }

  public async findById(id: DocId): Promise<T | null> {
    const doc = await this.colRef.doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return this.docToEntity(doc);
  }

  public override async findByRef(ref: FirebaseFirestore.DocumentReference): Promise<T | null> {
    const doc = await ref.get();
    if (!doc.exists) {
      return null;
    }
    return this.docToEntity(doc);
  }

  public async findOne(queryBuilder: SimpleQueryBuilder<T>): Promise<T | null> {
    let query = queryBuilder
      ? queryBuilder(this.simpleBaseQuery)
      : this.simpleBaseQuery.orderBy('updateTime', 'desc');
    const snapshot = await (query as TypedQuery<T>).limit(1).get();
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

    const snapshot = await paginatedQuery.get();
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
    const query = queryBuilder(this.baseQuery);
    const snapshot = await query.get();
    return snapshot.docs.map((doc) => this.docToEntity(doc));
  }
}
