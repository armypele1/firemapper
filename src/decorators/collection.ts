import { getFiremapperStorage } from '../storage/storage-utils.js';
import type { EntityConstructor } from '../types.js';

export function Collection(name: string) {
  return function (entityConstructor: EntityConstructor) {
    getFiremapperStorage().setCollection({
      name,
      entityConstructor,
    });
  };
}
