import {
  validate, object, string, any,
} from '@hapi/joi';
import WebSocket from 'ws';
import { partial } from 'ramda';
import { Message, createMessage } from 'agurk-shared';
import logger from '../logger';
import { MessageType } from '../types/messageType';

function parseJsonMessage<T>(message: string): Message<T> {
  try {
    return JSON.parse(message);
  } catch (error) {
    throw Error('received message is not in proper JSON format');
  }
}

function validateMessageFormat<T>(message: Message<T>): Message<T> {
  const messageFormatSchema = object().keys({
    name: string().required(),
    data: any(),
  });

  const { error, value } = validate<Message<T>>(
    message,
    messageFormatSchema,
    { stripUnknown: true },
  );

  if (error) {
    logger.error(error);
    throw Error('validation of received message format failed');
  }

  return value;
}

function validateMessageData<T>(message: Message<T>, messageType: MessageType): T {
  const { data } = message;
  const { validationSchema } = messageType;

  const { error, value } = validate<T>(
    data as unknown as T,
    validationSchema,
    { stripUnknown: true },
  );

  if (error) {
    logger.error(error);
    throw Error('validation of received message data failed');
  }

  return value;
}

function validateJSONMessage<T>(jsonMessage: string): Message<T> {
  const messageObject = parseJsonMessage<T>(jsonMessage);
  return validateMessageFormat(messageObject);
}

export function on<T, N>(
  socket: WebSocket,
  expectedMessageType: MessageType,
  messageHandler: (arg: N) => Promise<T>,
): Promise<T> {
  return new Promise((resolve, reject): void => {
    async function handleMessage(jsonMessage: string): Promise<void> {
      try {
        const validatedMessage = validateJSONMessage<N>(jsonMessage);

        if (validatedMessage.name === expectedMessageType.name) {
          socket.removeListener('message', handleMessage);
          logger.info('registered message received', validatedMessage);

          const validatedMessageData = validateMessageData<N>(validatedMessage, expectedMessageType);
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

function send<T>(socket: WebSocket, message: Message<T>): void {
  if (socket.readyState === WebSocket.OPEN) {
    logger.debug('message sent', message);
    const jsonMessage = JSON.stringify(message);
    socket.send(jsonMessage);
  } else {
    logger.warn('message not sent to closed socket', message);
  }
}

// TODO: handle unicast failure
export function unicast<T>(
  socket: WebSocket,
  messageType: MessageType,
  data?: T,
): void {
  if (socket.readyState !== WebSocket.OPEN) {
    throw Error('unicast message cannot be sent to closed socket');
  }

  const message = createMessage(messageType.name, data);
  logger.info('unicast message sent', message);
  send(socket, message);
}

export function broadcast<T>(
  sockets: WebSocket[],
  messageType: MessageType,
  data?: T,
): void {
  const message = createMessage(messageType.name, data);
  logger.info('broadcast message sent', message);
  sockets.forEach(socket => send(socket, message));
}

export function request<T>(
  socket: WebSocket,
  requesterMessageType: MessageType,
  expectedMessageType: MessageType,
  timeoutInMilliseconds: number,
): Promise<T> {
  unicast(socket, requesterMessageType);

  return new Promise((resolve, reject): void => {
    function handleMessageWithTimeout(timeoutId: number, jsonMessage: string): void {
      try {
        const validatedMessage = validateJSONMessage<T>(jsonMessage);

        if (validatedMessage.name === expectedMessageType.name) {
          clearTimeout(timeoutId);
          socket.removeListener('message', handleMessageWithTimeout);
          logger.info('requested message received', validatedMessage);

          const validatedMessageData = validateMessageData<T>(validatedMessage, expectedMessageType);
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
