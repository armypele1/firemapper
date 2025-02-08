import { BaseEntity } from '../entity.js';
import { Collection } from './collection.js';

const setCollection = vi.fn();
vi.mock('../storage/storage-utils.js', () => ({
  getFiremapperStorage: () => ({ setCollection }),
}));

describe('CollectionDecorator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('should register a collection', () => {
    class User extends BaseEntity {}
    Collection('users')(User);

    expect(setCollection).toHaveBeenCalledWith({
      name: 'users',
      entityConstructor: User,
    });
  });
});
