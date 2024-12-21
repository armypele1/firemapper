import 'reflect-metadata';
import { type Constructor } from '../types.js';
export const serializeKey = Symbol('Serialize');

export function Serialize(entityConstructor: Constructor<unknown>) {
  return Reflect.metadata(serializeKey, entityConstructor);
}
