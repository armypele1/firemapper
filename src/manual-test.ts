import { Collection } from './decorators/collection.js';
import { BaseEntity } from './entity.js';
import { getRepository } from './repos/helpers.js';
import admin from 'firebase-admin';
import { initialize } from './storage/storage-utils.js';
import { runTransaction } from './transaction.js';
import { FieldValue } from '@google-cloud/firestore';
import { CustomRepository } from './repos/custom.js';
import { BaseRepository } from './repos/base.js';
import { createClient, type RedisClientType } from 'redis';

// Firestore setup
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
const firebaseApp = admin.initializeApp({ projectId: 'example' });
const db = admin.firestore(firebaseApp);

// Redis cache setup
const redisClient = createClient() as RedisClientType;
await redisClient.connect();

// Init Firemapper
initialize(db, {
  validateModels: true,
  cache: {
    type: 'redis',
    redisClient,
    ttl: 1000,
  },
});

// Define an entity
@Collection('dogs')
class Dog extends BaseEntity {
  breed: 'dalmation' | 'bulldog' | 'pitbull' | 'labrador';
  name: string;
  birthdate: EpochTimeStamp;
  ownerId: string | null;
}

@Collection('users')
class User extends BaseEntity {
  firstName: string;
  lastName: string;
  dogIds: string[];
}

// Define a custom repo
@CustomRepository(Dog)
class CustomDogRepo extends BaseRepository<Dog> {
  findBulldogs() {
    return this.findAll((query) => query.where('breed', '==', 'bulldog'));
  }
}

// Get the repositories for entities
const dogRepo = getRepository(Dog) as CustomDogRepo;
const userRepo = getRepository(User);

export async function manualTest() {
  // Create a new dog
  const newDog = new Dog();
  newDog.breed = 'bulldog';
  newDog.name = 'Caesar';
  newDog.birthdate = 170000000;
  newDog.ownerId = null;

  const savedDog = await dogRepo.save(newDog);

  // Get an existing dog
  const aDog = await dogRepo.findById(savedDog.id);
  await dogRepo.findById(savedDog.id);
  console.log('found');
  await dogRepo.findById(savedDog.id);
  console.log('found');
  if (!aDog) {
    throw new Error(`Dog with id ${savedDog.id} not found`);
  }
  console.log(aDog.name);

  // Update a specific field of the dog
  const updatedDog = await dogRepo.update(aDog, { name: 'Brutus' });
  console.log(updatedDog.name);

  // Create a user for an example transaction
  const newUser = new User();
  newUser.firstName = 'John';
  newUser.lastName = 'Doe';
  newUser.dogIds = [];
  const savedUser = await userRepo.save(newUser);

  const dogId = updatedDog.id;
  const userId = savedUser.id;

  // Perform a transaction (Giving a dog an owner)
  await runTransaction(async (t) => {
    const dogRepo = t.getRepository(Dog);
    const userRepo = t.getRepository(User);

    const dog = await dogRepo.findById(dogId);
    const user = await userRepo.findById(userId);

    if (!dog) {
      throw new Error(`Dog with id ${dogId} not found`);
    }
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    await dogRepo.update(dog, { ownerId: user.id });
    await userRepo.update(user, { dogIds: FieldValue.arrayUnion(dog.id) });
  });

  // Query for many entities (with optional pagination)
  const dogsQuery = await dogRepo.findAll(
    (query) => query.where('breed', '==', 'labrador').orderBy('createTime'),
    {
      limit: 10,
    },
  );

  // Perform a custom query
  const customQueryRes = await dogRepo.customQuery((query) =>
    query.where('name', '==', 'rufus').orderBy('createTime').limit(1),
  );

  const res = await dogRepo.findBulldogs();
  console.log('****');
  console.log(res);

  process.exit();
}
