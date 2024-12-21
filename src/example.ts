import type { CollectionReference } from '@google-cloud/firestore';
import type { IEntity, TypedQuery } from './types.js';
import { createTypedQuery } from './query.js';
import { Collection } from './decorators/collection.js';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { plainToInstance } from 'class-transformer';

class Entity {
  id: string;
  createTime: number;
  updateTime: number;
}

type Breeds = 'pug' | 'bulldog' | 'beagle' | 'husky';
enum BreedsEnum {
  pug = 'pug',
  bulldog = 'bulldog',
  beagle = 'beagle',
  husky = 'husky',
}

@Collection('dogs')
class Dog extends Entity {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(BreedsEnum)
  breed: Breeds;
}

const dog = new Dog();
dog.breed = 'bulldog';

function createDogDto(dog: Omit<Dog, 'id' | 'createTime' | 'updateTime'>) {
  return plainToInstance(Dog, dog);
}

const dogDto = createDogDto({
  name: 'Rufus',
  breed: 'bulldog',
});
