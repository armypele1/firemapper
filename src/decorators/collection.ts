import { getFiremapperStorage } from '../storage/storage-utils.js';
import type { IEntityConstructor } from '../types.js';

export function Collection(collName: string) {
  return function (entityConstructor: IEntityConstructor) {
    const name = collName;
    getFiremapperStorage().setCollection({
      name,
      entityConstructor,
    });
  };
}
