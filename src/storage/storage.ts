import { Firestore } from '@google-cloud/firestore';
import { FiremapperRepository } from '../repos/abstract.js';
import type {
  IEntityConstructor,
  Constructor,
  IEntity,
  IRepositoryConstructor,
  ValidatorOptions,
} from '../types.js';

export interface CollectionMetadata {
  name: string;
  entityConstructor: IEntityConstructor;
  propertyKey?: string;
}

export interface RepositoryMetadata {
  target: IRepositoryConstructor;
  entity: IEntityConstructor;
}

export interface FireMapperStorageConfig {
  validateModels: boolean;
  validatorOptions?: ValidatorOptions;
  throwOnDuplicatedCollection?: boolean;
}

export class FireMapperStorage {
  readonly collections: Array<CollectionMetadata> = [];
  protected readonly repositories: Map<IEntityConstructor, RepositoryMetadata> = new Map();

  public config: FireMapperStorageConfig = {
    validateModels: false,
    validatorOptions: {},
    throwOnDuplicatedCollection: true,
  };

  public firestoreRef: Firestore | undefined = undefined;

  public getCollection = (constructor: IEntityConstructor) => {
    const collection = this.collections.find((c) => c.entityConstructor === constructor);
    if (!collection) {
      return null;
    }
    return collection;
  };

  public setCollection = (col: CollectionMetadata) => {
    const existing = this.getCollection(col.entityConstructor);
    if (existing && this.config.throwOnDuplicatedCollection == true) {
      throw new Error(`Collection with name ${existing.name} has already been registered`);
    }
    this.collections.push(col);
  };

  public getRepository = (param: IEntityConstructor) => {
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
