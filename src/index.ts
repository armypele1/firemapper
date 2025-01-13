import 'reflect-metadata';
export { initialize } from './storage/storage-utils.js';
export { Collection } from './decorators/collection.js';
export { type IEntity } from './types.js';
export { BaseEntity } from './entity.js';
export { getRepository } from './repos/helpers.js';
export { runTransaction } from './transaction.js';

// import { manualTest } from './manual-test.js';
// manualTest();
