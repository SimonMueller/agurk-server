import {
  validate, object, string, any,
} from '@hapi/joi';
import WebSocket from 'ws';
import { partial } from 'ramda';
import { Message } from '../../shared/types/message';
import { MessageType } from '../../shared/types/messageType';
import createMessage from '../../shared/communication/messages';
import logger from '../logger';
import { Sendable } from '../../shared/types/communication';

const parseJsonMessage = (message: string): Message => {
  try {
    return JSON.parse(message);
  } catch (error) {
    throw Error('received message is not in proper JSON format');
  }
};

const validateMessageFormat = (message: Message): Message => {
  const messageFormatSchema = object().keys({
    type: string().required(),
    data: any(),
  });

  const { error, value } = validate<Message>(
    message,
    messageFormatSchema,
    { stripUnknown: true },
  );

  if (error) {
    logger.error(error);
    throw Error('validation of received message format failed');
  }

  return value;
};

function validateMessageData<T>(message: Message, messageType: MessageType): T {
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

const validateJSONMessage = (jsonMessage: string): Message => {
  const messageObject = parseJsonMessage(jsonMessage);
  return validateMessageFormat(messageObject);
};

export function on<T, N>(
  socket: WebSocket,
  expectedMessageType: MessageType,
  messageHandler: (arg: N) => Promise<T>,
): Promise<T> {
  return new Promise((resolve, reject): void => {
    async function handleMessage(jsonMessage: string): Promise<void> {
      try {
        const validatedMessage = validateJSONMessage(jsonMessage);

        if (validatedMessage.type === expectedMessageType.name) {
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

function send(
  socket: WebSocket,
  message: Message,
): void {
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
  messageType: MessageType,
  data?: Sendable,
): void {
  if (socket.readyState !== WebSocket.OPEN) {
    throw Error('unicast message cannot be sent to closed socket');
  }

  const message = createMessage(messageType, data);
  logger.info('unicast message sent', message);
  send(socket, message);
}

export function broadcast(
  sockets: WebSocket[],
  messageType: MessageType,
  data?: Sendable,
): void {
  const message = createMessage(messageType, data);
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
        const validatedMessage = validateJSONMessage(jsonMessage);

        if (validatedMessage.type === expectedMessageType.name) {
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
