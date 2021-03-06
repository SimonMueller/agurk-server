import { v4 as uuidv4 } from 'uuid';

export const generateId = (): string => uuidv4();

export function rotate <T>(array: T[], count: number): T[] {
  const index = count % array.length;
  return [...array.slice(index), ...array.slice(0, index)];
}

export async function delay<T>(value: T, delayInMilis: number): Promise<T> {
  try {
    return new Promise<T>(resolve => setTimeout(() => resolve(value), delayInMilis));
  } catch (error) {
    return Promise.reject(error);
  }
}
