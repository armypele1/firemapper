import { getFiremapperStorage } from '../storage/storage-utils.js';
import type { Constructor, IRepository, IEntity } from '../types.js';
import type { FiremapperRepository } from './abstract.js';

export function CustomRepository<T extends IEntity = IEntity>(entity: Constructor<T>) {
  return function (target: FiremapperRepository) {
    getFiremapperStorage().setRepository({
      entity,
      target: target as Constructor<IRepository<T>>,
    });
  };
}
