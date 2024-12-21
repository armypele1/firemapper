import { instanceToPlain } from 'class-transformer';
import type {
  DocId,
  IEntity,
  IRepository,
  PaginatedResponse,
  PartialBy,
  QueryBuilder,
  SimpleQueryBuilder,
  SimpleTypedQuery,
  UpdateData,
} from '../types.js';
import { AbstractRepository } from './abstract.js';
import { Timestamp } from '@google-cloud/firestore';

export class BaseRepository<T extends IEntity>
  extends AbstractRepository<T>
  implements IRepository<T>
{
  private async get(id: DocId): Promise<T> {
    const doc = await this.firestoreColRef.doc(id).get();
    if (!doc.exists) {
      throw new Error(`Document with id ${id} does not exist`);
    }
    return this.toEntity(doc);
  }

  public async create(item: PartialBy<T, 'id'>): Promise<T> {
    if (item.id) {
      const existing = await this.findById(item.id);
      if (existing) {
        throw new Error(`Document with id ${item.id} already exists`);
      }
    }
    const doc = item.id ? this.firestoreColRef.doc(item.id) : this.firestoreColRef.doc();

    const now = Timestamp.now();
    const itemToCreate = {
      ...this.toSerializable(item),
      createTime: now,
      updateTime: now,
    };
    await doc.set(itemToCreate);
    return this.get(doc.id);
  }

  public async update(item: T): Promise<T> {
    const now = Timestamp.now();
    const updates = {
      ...this.toSerializable(item),
      updateTime: now,
    };
    await this.firestoreColRef.doc(item.id).update(updates);
    return this.get(item.id);
  }

  public async delete(id: string): Promise<void> {}

  public async findById(id: DocId): Promise<T | null> {
    const doc = await this.firestoreColRef.doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return this.toEntity(doc);
  }

  public async findOne(queryBuilder: SimpleQueryBuilder<T>): Promise<T | null> {
    let query = queryBuilder
      ? queryBuilder(this.simpleBaseQuery)
      : this.simpleBaseQuery.orderBy('updateTime', 'desc');
    const snapshot = await query.get();
    if (snapshot.empty) {
      return null;
    }
    return this.toEntity(snapshot.docs[0]);
  }

  public async findAll(queryBuilder: SimpleQueryBuilder<T>): Promise<PaginatedResponse<T>>;

  public async customQuery(queryBuilder: QueryBuilder<T>): Promise<T[]>;
}
