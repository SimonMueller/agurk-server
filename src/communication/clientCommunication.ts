import { any, object, string } from '@hapi/joi';
import {
  fromEventPattern, Observable, pipe, UnaryFunction,
} from 'rxjs';
import {
  filter, map, take, tap, timeout,
} from 'rxjs/operators';
import WebSocket from 'ws';
import { Message } from 'agurk-shared';
import logger from '../logger';
import { ExpectedMessage, MessageToBeValidated, MessageValidationError } from '../types/messageType';
import { Result, SuccessResult } from '../types/result';
import { ERROR_RESULT_KIND, SUCCESS_RESULT_KIND } from '../game/common';

function wrapMessageForLogging(message: object | string): object {
  return { payload: message };
}

function parseJsonMessage(message: string): Result<MessageValidationError, object> {
  try {
    const parsedObject = JSON.parse(message);
    return {
      kind: SUCCESS_RESULT_KIND,
      data: parsedObject,
    };
  } catch (error) {
    const errorMessage = 'received message is not in proper JSON format';
    logger.error(errorMessage, wrapMessageForLogging(message));
    return {
      kind: ERROR_RESULT_KIND,
      error: {
        message: errorMessage,
      },
    };
  }
}

function validateMessageFormat(message: object): Result<MessageValidationError, MessageToBeValidated> {
  const messageFormatSchema = object().keys({
    name: string().required(),
    data: any(),
  });

  const { error, value } = messageFormatSchema.validate(message as MessageToBeValidated, { stripUnknown: true });

  if (error) {
    const errorMessage = 'validation of received message format failed';
    logger.warn(errorMessage, wrapMessageForLogging(message));
    return { kind: ERROR_RESULT_KIND, error: { message: errorMessage } };
  }

  return { kind: SUCCESS_RESULT_KIND, data: value };
}

function validateMessageData<T>(
  expected: ExpectedMessage,
  actual: MessageToBeValidated,
): Result<MessageValidationError, T> {
  const { data } = actual;
  const { dataValidationSchema } = expected;

  const { error, value } = dataValidationSchema.validate(data as T, { stripUnknown: true });

  if (error) {
    const errorMessage = 'validation of received message data failed';
    logger.warn(errorMessage, wrapMessageForLogging(actual));
    return { kind: ERROR_RESULT_KIND, error: { message: errorMessage } };
  }

  return { kind: SUCCESS_RESULT_KIND, data: value };
}

function ofSuccessResult<E, T>(result: Result<E, T>): result is SuccessResult<T> {
  return result.kind === SUCCESS_RESULT_KIND;
}

function filterMessagesInInvalidFormatOrJson(): UnaryFunction<Observable<string>, Observable<MessageToBeValidated>> {
  return pipe(
    map(parseJsonMessage),
    filter(ofSuccessResult),
    map(parseResult => parseResult.data),
    map(validateMessageFormat),
    filter(ofSuccessResult),
    map(validateMessageFormatResult => validateMessageFormatResult.data),
  );
}

function filterMessagesNotMatchingExpectedMessage<T>(
  expectedMessage: ExpectedMessage,
): UnaryFunction<Observable<MessageToBeValidated>, Observable<T>> {
  return pipe(
    map<MessageToBeValidated, Result<MessageValidationError, T>>(
      actualMessage => validateMessageData(expectedMessage, actualMessage),
    ),

    filter(ofSuccessResult),
    map(validateResult => validateResult.data),
  );
}

function sendMessageToOpenSocket(socket: WebSocket, jsonMessage: string): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.send(jsonMessage, error => (error ? reject(error) : resolve()));
  });
}

function send<T>(socket: WebSocket, message: Message): Promise<void> {
  if (socket.readyState !== WebSocket.OPEN) {
    return Promise.reject();
  }

  const jsonMessage = JSON.stringify(message);
  return sendMessageToOpenSocket(socket, jsonMessage);
}

export function on<T>(
  socket: WebSocket,
  expectedMessage: ExpectedMessage,
): Observable<T> {
  const addHandler = (handler: (message: string) => void): WebSocket => socket.addListener('message', handler);
  const removeHandler = (handler: (message: string) => void): WebSocket => socket.removeListener('message', handler);
  return fromEventPattern<string>(addHandler, removeHandler)
    .pipe(
      filterMessagesInInvalidFormatOrJson(),
      filter(actualMessage => actualMessage.name === expectedMessage.name),
      tap(message => logger.info('registered message received', wrapMessageForLogging(message))),
      filterMessagesNotMatchingExpectedMessage<T>(expectedMessage),
    );
}

export function unicast<T extends Message>(
  socket: WebSocket,
  message: T,
): void {
  send(socket, message)
    .then(() => logger.info('unicast message sent', wrapMessageForLogging(message)))
    .catch(() => logger.warn('cannot unicast message to closed socket', wrapMessageForLogging(message)));
}

export function broadcast<T extends Message>(
  sockets: WebSocket[],
  message: T,
): void {
  sockets.forEach((socket) => {
    send(socket, message).catch(() => logger
      .warn('cannot broadcast message to closed socket', wrapMessageForLogging(message)));
  });
  logger.info('broadcast message sent', wrapMessageForLogging(message));
}

export async function request<T>(
  socket: WebSocket,
  requesterMessage: Message,
  expectedMessage: ExpectedMessage,
  timeoutInMilliseconds: number,
): Promise<T> {
  logger.info('sending request message to socket', wrapMessageForLogging(requesterMessage));

  function rejectOnSocketClose(reject: (error: Error) => void): void {
    reject(Error('socket connection closed while requesting cards'));
  }

  const socketClose = new Promise<T>((resolve, reject) => socket.once('close', () => rejectOnSocketClose(reject)));

  const requestResult = send(socket, requesterMessage).then(() => {
    const addHandler = (handler: (message: string) => void): WebSocket => socket.addListener('message', handler);
    const removeHandler = (handler: (message: string) => void): WebSocket => socket.removeListener('message', handler);
    return fromEventPattern<string>(addHandler, removeHandler)
      .pipe(
        filterMessagesInInvalidFormatOrJson(),
        filter(actualMessage => actualMessage.name === expectedMessage.name),
        tap(message => logger.info('requested message received', wrapMessageForLogging(message))),
        filterMessagesNotMatchingExpectedMessage<T>(expectedMessage),
        timeout(timeoutInMilliseconds),
        take(1),
      ).toPromise();
  });

  try {
    return Promise.race<T>([socketClose, requestResult]);
  } finally {
    socket.removeListener('close', rejectOnSocketClose);
  }
}
