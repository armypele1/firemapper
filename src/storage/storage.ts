import { Firestore } from '@google-cloud/firestore';
import { FiremapperRepository } from '../repos/abstract.js';
import type { EntityConstructor, RepositoryConstructor, ValidatorOptions } from '../types.js';
import { type RedisClientType } from 'redis';

export interface CollectionMetadata {
  name: string;
  entityConstructor: EntityConstructor;
  propertyKey?: string;
}

export interface RepositoryMetadata {
  target: RepositoryConstructor;
  entity: EntityConstructor;
}

export interface FireMapperStorageConfig {
  validateModels?: boolean;
  validatorOptions?: ValidatorOptions;
  throwOnDuplicatedCollection?: boolean;
  cache?: {
    type: 'redis';
    redisClient: RedisClientType;
    ttl: number;
  };
}

export class FireMapperStorage {
  readonly collections: Array<CollectionMetadata> = [];
  protected readonly repositories: Map<EntityConstructor, RepositoryMetadata> = new Map();

  public config: FireMapperStorageConfig = {
    validateModels: false,
    validatorOptions: {},
    throwOnDuplicatedCollection: true,
  };

  public firestoreRef: Firestore | undefined = undefined;

  public getCollection = (constructorOrName: EntityConstructor | string) => {
    const collection = this.collections.find((c) => {
      if (typeof constructorOrName === 'string') {
        return c.name === constructorOrName;
      }
      return c.entityConstructor === constructorOrName;
    });
    if (!collection) {
      return null;
    }
    return collection;
  };

  public setCollection = (col: CollectionMetadata) => {
    const findByConstructor = this.getCollection(col.entityConstructor);
    if (findByConstructor && this.config.throwOnDuplicatedCollection == true) {
      throw new Error(
        `Collection labelled ${findByConstructor.name} is using an existing entity constructor`,
      );
    }
    const findByName = this.getCollection(col.name);
    if (findByName && this.config.throwOnDuplicatedCollection == true) {
      throw new Error(`Collection with name ${findByName.name} has already been registered`);
    }
    this.collections.push(col);
  };

  public getRepository = (param: EntityConstructor) => {
    return this.repositories.get(param) || null;
  };

  public setRepository = (repo: RepositoryMetadata) => {
    const savedRepo = this.getRepository(repo.entity);

    if (savedRepo && repo.target !== savedRepo.target) {
      throw new Error('Cannot register a custom repository twice with two different targets');
    }

    if (!(repo.target.prototype instanceof FiremapperRepository)) {
      throw new Error(
        'Cannot register a custom repository on a class that does not inherit from BaseRepository',
      );
    }

    this.repositories.set(repo.entity, repo);
  };

  public getRepositories = () => {
    return this.repositories;
  };
}
