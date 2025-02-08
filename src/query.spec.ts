import type { Query } from '@google-cloud/firestore';
import { createTypedQuery, toFirestoreField } from './query.js';

describe('toFirestoreField', () => {
  it('should convert system field to firestore field', () => {
    expect(toFirestoreField('id')).toBe('__name__');
  });
  it('should keep appropriate fields unchanged', () => {
    const nonSystemFields = ['__name__', 'foo', 'bar'];
    for (const field of nonSystemFields) {
      expect(toFirestoreField(field)).toBe(field);
    }
  });
});

describe('createTypedQuery', () => {
  let mockedFirestoreQuery: Query;

  beforeEach(() => {
    mockedFirestoreQuery = {
      where: vi.fn(() => mockedFirestoreQuery),
      orderBy: vi.fn(() => mockedFirestoreQuery),
    } as unknown as Query;
  });

  it('should return a typed query', () => {
    const typedQuery = createTypedQuery(mockedFirestoreQuery);
    expect(typedQuery).toBe(mockedFirestoreQuery);
  });
  it('should convert system field to firestore field in where clause', () => {
    const spy = vi.spyOn(mockedFirestoreQuery, 'where');
    const typedQuery = createTypedQuery(mockedFirestoreQuery);
    typedQuery.where('id', '==', '123');
    expect(spy).toHaveBeenCalledWith('__name__', '==', '123');
  });
  it('should convert system field to firestore field in order by clause', () => {
    const spy = vi.spyOn(mockedFirestoreQuery, 'orderBy');
    const typedQuery = createTypedQuery(mockedFirestoreQuery);
    typedQuery.orderBy('id', 'asc');
    expect(spy).toHaveBeenCalledWith('__name__', 'asc');
  });
  it('should be able to chain where and orderBy', () => {
    const spyWhere = vi.spyOn(mockedFirestoreQuery, 'where');
    const spyOrderBy = vi.spyOn(mockedFirestoreQuery, 'orderBy');
    const typedQuery = createTypedQuery(mockedFirestoreQuery);
    typedQuery.where('id', '==', '123').orderBy('id', 'asc');
    expect(spyWhere).toHaveBeenCalledWith('__name__', '==', '123');
    expect(spyOrderBy).toHaveBeenCalledWith('__name__', 'asc');
  });
});
