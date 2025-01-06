import type { DocumentReference } from '@google-cloud/firestore';
import type { IEntity } from './types.js';

export class BaseEntity implements IEntity {
  public readonly id: string;
  public readonly ref: DocumentReference;
  public readonly createTime: EpochTimeStamp;
  public readonly updateTime: EpochTimeStamp;
}
