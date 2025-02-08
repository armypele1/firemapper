import { BaseEntity } from '../entity.js';
import { BaseRepository } from '../repos/base.js';
import type { Constructor, IRepository } from '../types.js';
import { FireMapperStorage, type RepositoryMetadata } from './storage.js';

describe('firemapperStorage', () => {
  let storage = new FireMapperStorage();

  const collection = {
    name: 'foo',
    entityConstructor: BaseEntity,
  };

  class EntityRepository extends BaseRepository<BaseEntity> {}
  const repo: RepositoryMetadata = {
    entity: BaseEntity,
    target: EntityRepository as unknown as Constructor<IRepository<BaseEntity>>,
  };

  beforeEach(() => {
    storage = new FireMapperStorage();
  });

  describe('getCollection', () => {
    it('should get an existing collection', () => {
      Object.defineProperty(storage, 'collections', { value: [collection] });
      expect(storage.getCollection(collection.entityConstructor)).toEqual(collection);
    });
    it('should return null when getting a non-existing collection', () => {
      expect(storage.getCollection(collection.entityConstructor)).toBeNull();
    });
  });

  describe('setCollection', () => {
    it('should set a collection', () => {
      storage.setCollection(collection);
      expect(storage.collections).toContain(collection);
    });
    it('should not allow duplicate constructors by default', () => {
      storage.setCollection(collection);
      expect(() => storage.setCollection(collection)).toThrow();
    });
    it('should not allow duplicate names by default', () => {
      storage.setCollection(collection);
      expect(() =>
        storage.setCollection({
          name: collection.name,
          entityConstructor: class Foo extends BaseEntity {},
        }),
      ).toThrow();
    });
    it('should allow duplicates if configured', () => {
      storage.config.throwOnDuplicatedCollection = false;
      storage.setCollection(collection);
      expect(() => storage.setCollection(collection)).not.toThrow();
      expect(() =>
        storage.setCollection({
          name: collection.name,
          entityConstructor: class Foo extends BaseEntity {},
        }),
      ).not.toThrow();
      expect(storage.collections.length).toBe(3);
    });
  });

  describe('getRepository', () => {
    it('should get an existing repository', () => {
      storage.setRepository(repo);
      expect(storage.getRepository(BaseEntity)).toEqual(repo);
    });
    it('should get all existing repositories', () => {
      Object.defineProperty(storage, 'repositories', { value: new Map([[repo.entity, repo]]) });
      expect(storage.getRepositories()).toEqual(new Map([[repo.entity, repo]]));
    });
    it('should return null when getting a non-existing repository', () => {
      expect(storage.getRepository(BaseEntity)).toBeNull();
    });
  });

  describe('setRepository', () => {
    it('should set a repository', () => {
      storage.setRepository(repo);
      expect(storage.getRepository(BaseEntity)).toEqual(repo);
    });
    it('should not allow registering a custom repository twice with two different targets', () => {
      storage.setRepository(repo);
      expect(() =>
        storage.setRepository({
          ...repo,
          target: class {} as Constructor<IRepository<BaseEntity>>,
        }),
      ).toThrow();
    });
    it('should not allow registering a custom repository on a class that does not inherit from BaseRepository', () => {
      expect(() =>
        storage.setRepository({
          ...repo,
          target: class {} as Constructor<IRepository<BaseEntity>>,
        }),
      ).toThrow();
    });
  });
});
