import { getFiremapperStorage } from './storage/storage-utils.js';
import type { Transaction } from '@google-cloud/firestore';
import type { Constructor, EntityConstructor, IEntity, IFirestoreTransaction } from './types.js';
import { TransactionRepository } from './repos/transaction.js';

const firemapperStorage = getFiremapperStorage();

export class FirestoreTransaction implements IFirestoreTransaction {
  constructor(private transaction: Transaction) {}

  getRepository<T extends IEntity>(entityConstructor: Constructor<T>) {
    if (!firemapperStorage.firestoreRef) {
      throw new Error('Firestore must be initialized first');
    }
    return new TransactionRepository<T>(entityConstructor, this.transaction);
  }
}

export const runTransaction = async <T>(executor: (tran: FirestoreTransaction) => Promise<T>) => {
  const metadataStorage = getFiremapperStorage();

  if (!metadataStorage.firestoreRef) {
    throw new Error('Firestore must be initialized first');
  }

  return metadataStorage.firestoreRef.runTransaction(async (t) => {
    return executor(new FirestoreTransaction(t));
  });
};
