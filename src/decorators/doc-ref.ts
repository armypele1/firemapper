import { DocumentReference } from '@google-cloud/firestore';
import { Transform, Type } from 'class-transformer';

export function DocRef(): PropertyDecorator {
  return Transform(({ value }) => value, { toPlainOnly: true });
}

export function DocRefArray(): PropertyDecorator {
  return Transform(({ value }) => value, { toPlainOnly: true });
}
