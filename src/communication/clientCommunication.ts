import {
  validate, object, string, any,
} from '@hapi/joi';
import WebSocket from 'ws';
import { partial } from 'ramda';
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
  messageHandler: (arg: N) => Promise<T>,
): Promise<T> {
  return new Promise((resolve, reject): void => {
    async function handleMessage(jsonMessage: string): Promise<void> {
      try {
        const actualMessage = validateJSONMessage(jsonMessage);

        if (actualMessage.name === expectedMessage.name) {
          socket.removeListener('message', handleMessage);
          logger.info('registered message received', actualMessage);

          const validatedMessageData = validateMessageData<N>(expectedMessage, actualMessage);
          const result = await messageHandler(validatedMessageData);
          resolve(result);
        }
      } catch (error) {
        reject(error);
      }
    }

    socket.on('message', handleMessage);
  });
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

  return new Promise((resolve, reject): void => {
    function handleMessageWithTimeout(timeoutId: number, jsonMessage: string): void {
      try {
        const actualMessage = validateJSONMessage(jsonMessage);

        if (actualMessage.name === expectedMessage.name) {
          clearTimeout(timeoutId);
          socket.removeListener('message', handleMessageWithTimeout);
          logger.info('requested message received', actualMessage);

          const validatedMessageData = validateMessageData<T>(expectedMessage, actualMessage);
          resolve(validatedMessageData);
        }
      } catch (error) {
        reject(error);
      }
    }

    const timeoutId = setTimeout(() => {
      socket.removeListener('message', handleMessageWithTimeout);
      reject(Error(`timeout of ${timeoutInMilliseconds} ms exceeded`));
    }, timeoutInMilliseconds);

    socket.on('message', partial(handleMessageWithTimeout, [timeoutId]));
  });
}
