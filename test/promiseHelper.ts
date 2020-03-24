/*
 * Flushes pending Promises from the queue.
 * This is mainly used to test Promise chains with timeouts together with Jest's jest.runAllTimers();
 */
export default function flushAllPromises(): Promise<void> {
  return new Promise(setImmediate);
}
