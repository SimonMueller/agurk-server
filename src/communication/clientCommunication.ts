import {
  any, object, string, validate,
} from '@hapi/joi';
import { fromEventPattern, Observable } from 'rxjs';
import {
  map, skipWhile, take, tap, timeout,
} from 'rxjs/operators';
import WebSocket from 'ws';
import { Message } from 'agurk-shared';
import logger from '../logger';
import { ExpectedMessage, MessageToBeValidated } from '../types/messageType';

function parseJsonMessage(message: string): object {
  try {
    return JSON.parse(message);
  } catch (error) {
    throw Error('received message is not in proper JSON format');
  }
}

function validateMessageFormat(message: object): MessageToBeValidated {
  const messageFormatSchema = object().keys({
    name: string().required(),
    data: any(),
  });

  const { error, value } = validate<MessageToBeValidated>(
    message as MessageToBeValidated,
    messageFormatSchema,
    { stripUnknown: true },
  );

  if (error) {
    logger.error(error);
    throw Error('validation of received message format failed');
  }

  return value;
}

function validateMessageData<T>(expected: ExpectedMessage, actual: MessageToBeValidated): T {
  const { data } = actual;
  const { dataValidationSchema } = expected;

  const { error, value } = validate<T>(
    data as T,
    dataValidationSchema,
    { stripUnknown: true },
  );

  if (error) {
    logger.error(error);
    throw Error('validation of actual received message data failed');
  }

  return value;
}

function validateJSONMessage(jsonMessage: string): MessageToBeValidated {
  const messageObject = parseJsonMessage(jsonMessage);
  return validateMessageFormat(messageObject);
}

export function on<T, N>(
  socket: WebSocket,
  expectedMessage: ExpectedMessage,
): Observable<T> {
  const addHandler = (handler: (message: string) => void): WebSocket => socket.addListener('message', handler);
  const removeHandler = (handler: (message: string) => void): WebSocket => socket.removeListener('message', handler);
  return fromEventPattern<string>(addHandler, removeHandler)
    .pipe(
      map<string, MessageToBeValidated>(validateJSONMessage),
      skipWhile<MessageToBeValidated>(actualMessage => actualMessage.name !== expectedMessage.name),
      tap<MessageToBeValidated>(message => logger.info('registered message received', message)),
      map<MessageToBeValidated, T>(actualMessage => validateMessageData(expectedMessage, actualMessage)),
    );
}

function send<T>(socket: WebSocket, message: Message): void {
  if (socket.readyState === WebSocket.OPEN) {
    logger.debug('message sent', message);
    const jsonMessage = JSON.stringify(message);
    socket.send(jsonMessage);
  } else {
    logger.warn('message not sent to closed socket', message);
  }
}

// TODO: handle unicast failure
export function unicast(
  socket: WebSocket,
  message: Message,
): void {
  if (socket.readyState !== WebSocket.OPEN) {
    throw Error('unicast message cannot be sent to closed socket');
  }

  logger.info('unicast message sent', message);
  send(socket, message);
}

export function broadcast(
  sockets: WebSocket[],
  message: Message,
): void {
  logger.info('broadcast message sent', message);
  sockets.forEach(socket => send(socket, message));
}

export function request<T>(
  socket: WebSocket,
  requesterMessage: Message,
  expectedMessage: ExpectedMessage,
  timeoutInMilliseconds: number,
): Promise<T> {
  unicast(socket, requesterMessage);

  const addHandler = (handler: (message: string) => void): WebSocket => socket.addListener('message', handler);
  const removeHandler = (handler: (message: string) => void): WebSocket => socket.removeListener('message', handler);
  return fromEventPattern<string>(addHandler, removeHandler)
    .pipe(
      map<string, MessageToBeValidated>(validateJSONMessage),
      skipWhile<MessageToBeValidated>(actualMessage => actualMessage.name !== expectedMessage.name),
      tap<MessageToBeValidated>(message => logger.info('requested message received', message)),
      map<MessageToBeValidated, T>(actualMessage => validateMessageData(expectedMessage, actualMessage)),
      timeout<T>(timeoutInMilliseconds),
      take(1),
    ).toPromise<T>();
}
