import { rotate } from '../../server/util';

describe('rotate n times (n > 0 = left rotate, n < 0 = right rotate)', () => {
  test('1 time with non empty array', () => {
    const array = [1, 2, 3, 4];

    expect(rotate(array, 1)).toEqual([2, 3, 4, 1]);
  });

  test('3 times with non empty array', () => {
    const array = [1, 2, 3, 4, 5, 6];

    expect(rotate(array, 3)).toEqual([4, 5, 6, 1, 2, 3]);
  });

  test('0 times with non empty array', () => {
    const array = [1, 2, 3, 4];

    expect(rotate(array, 0)).toEqual([1, 2, 3, 4]);
  });

  test('-1 times with non empty array', () => {
    const array = [1, 2, 3, 4];

    expect(rotate(array, -1)).toEqual([4, 1, 2, 3]);
  });

  test('8 times (more than array length) with non empty array', () => {
    const array = [1, 2, 3, 4, 5];

    expect(rotate(array, 8)).toEqual([4, 5, 1, 2, 3]);
  });

  test('-8 times (more than negative array length) with non empty array', () => {
    const array = [1, 2, 3, 4, 5];

    expect(rotate(array, -8)).toEqual([3, 4, 5, 1, 2]);
  });

  test('3 times with empty array', () => {
    expect(rotate([], 3)).toEqual([]);
  });

  test('0 times with empty array', () => {
    expect(rotate([], 0)).toEqual([]);
  });
});
