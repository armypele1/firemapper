# Firemapper

Firemapper is a small ORM for Firestore that includes pagination, caching and type safety out of the box. It's goal is to streamline the development of apps that use Firestore by providing a simple interface for accessing data.

## Installation

Install the package _(and reflect-metadata)_

```bash
npm i firemapper reflect-metadata
```

## Setup

1. Init firestore and link with firemapper.

```typescript
import admin from 'firebase-admin';
import { initialize } from 'firemapper';

const firebaseApp = admin.initializeApp({ projectId: 'example' });
const db = admin.firestore(firebaseApp);
initialize(db);
```

2. Optionally link with Redis to enable caching

```typescript
// ...
import { createClient, type RedisClientType } from 'redis';

// ...
const redisClient = createClient() as RedisClientType;
await redisClient.connect();

initialize(db, {
  cache: {
    type: 'redis',
    redisClient,
    ttl: 60, // in seconds
  },
});
```

## Usage

1. Define a new entity. All entities must extend **BaseEntity**

```typescript
import { Collection, BaseEntity } from 'firemapper';

@Collection('dogs')
class Dog extends BaseEntity {
  breed: 'dalmation' | 'bulldog' | 'pitbull' | 'labrador' | 'cockapoo';
  name: string;
  owner: DocumentReference | null;
  treatsRecieved: number;
}
```

2. Perform CRUD operations using the repository pattern

```typescript
import { getRepository } from 'firemapper';
import { Dog } from '../entities';

const dogRepo = getRepository(Dog);

// Create a new dog
const newDog = new Dog();
newDog.breed = 'cockapoo';
newDog.name = 'Sandy';
newDog.owner = null;
newDog.treatsRecieved = 0;

// Save dog to Firestore
const savedDog = await dogRepo.save(newDog);

// Find dog by id
const foundDog = await dogRepo.findById(savedDog.id);

// Update specific fields of a dog, optionally using FieldValue methods
const updatedDog = await dogRepo.update(foundDog, {
  treatsRecieved: FieldValue.increment(1),
});

// Delete dog
await dogRepo.delete(savedDog.id);
```

3. Write type-safe queries for one or multiple entities

```typescript
const singleDog = await dogRepo.findOne((query) => query.where('name', '==', 'sandy'));
if (!singleDog) throw new Error('Sandy does not exist!');

const allLabradors = await dogRepo.findAll((query) =>
  query.where('breed', '==', 'labrador').orderBy('treatsRecieved'),
);

// Use pagination
const page1 = await dogRepo.findAll((query) => query.where('breed', '==', 'labrador'), {
  limit: 10,
});
if (page1.hasMore) {
  const page2 = await dogRepo.findAll((query) => query.where('breed', '==', 'labrador'), {
    limit: 10,
    startAfter: page1.lastDoc!,
  });
}
```

_See the documentation for more code examples, including transactions, custom queries and more._
