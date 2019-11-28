import uuid from 'uuid/v4';
import { last, head } from 'ramda';

export const generateId = (): string => uuid();

export function rotate <T>(array: T[], count: number): T[] {
  const index = count % array.length;
  return [...array.slice(index), ...array.slice(0, index)];
}

export function firstOrThrow <T>(array: T[]): T {
  const firstElement = head(array);

  if (firstElement === undefined || firstElement === null) {
    throw Error('list in invalid state. no elements found.');
  }
  return firstElement;
}

export function lastOrThrow <T>(array: T[]): T {
  const lastElement = last(array);

  if (lastElement === undefined || lastElement === null) {
    throw Error('list in invalid state. no elements found.');
  }

  return lastElement;
}
