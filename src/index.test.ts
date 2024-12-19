import { test, expect } from 'vitest';
import { foo } from './index.js';

test('foo', () => {
  expect(foo(1)).toBe(2);
});
