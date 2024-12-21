import { Serialize, serializeKey } from './serialize.js';
import { describe, it, expect } from 'vitest';

describe('SerializeDecorator', () => {
  it('should decorate properties', () => {
    class Address {
      streetName: string;
      zipcode: string;
    }

    class Dog {
      id: string;
      name: string;
      @Serialize(Address)
      address: Address;
    }

    const dog = new Dog();

    expect(Reflect.getMetadata(serializeKey, dog, 'name')).toBe(undefined);
    expect(Reflect.getMetadata(serializeKey, dog, 'address')).toBe(Address);
  });
});
