export interface ErrorResult<E> {
  readonly kind: 'ERROR';
  readonly error: E;
}

export interface SuccessResult<T> {
  readonly kind: 'SUCCESS';
  readonly data: T;
}

export type Result<E, T> = ErrorResult<E> | SuccessResult<T>;
