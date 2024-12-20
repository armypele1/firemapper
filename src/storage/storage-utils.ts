import { Firestore } from '@google-cloud/firestore';
import { FireMapperStorage, type FireMapperStorageConfig } from './storage.js';

export interface IMetadataStore {
  metadataStorage: FireMapperStorage;
}

export function getFiremapperStore(): IMetadataStore {
  return global as never;
}

function initializeMetadataStorage() {
  const store = getFiremapperStore();

  if (!store.metadataStorage) {
    store.metadataStorage = new FireMapperStorage();
  }
}

/**
 * Return exisiting metadataStorage, otherwise create if not present
 */
export const getFiremapperStorage = (): FireMapperStorage => {
  const store = getFiremapperStore();
  initializeMetadataStorage();

  return store.metadataStorage;
};

export const initialize = (
  firestore: Firestore,
  config: FireMapperStorageConfig = {
    validateModels: false,
    validatorOptions: {},
    throwOnDuplicatedCollection: true,
  },
): void => {
  initializeMetadataStorage();

  const { metadataStorage } = getFiremapperStore();

  metadataStorage.firestoreRef = firestore;
  metadataStorage.config = config;
};
