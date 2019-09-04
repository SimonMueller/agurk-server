import config from 'config';
import Joi from '@hapi/joi';
import {
  broadcast, on, request, unicast,
} from '../../../server/communication/clientCommunication';
import * as messageTypes from '../../../shared/communication/messageTypes';
import createWebsocket from '../../mocks/websocket';
import { createSuitCard, Suit } from '../../../shared/game/card';

describe('handle on message', () => {
  test('handler gets executed and resolves', async () => {
    const socket = createWebsocket();
    const messageType = {
      name: 'messagetype',
      validationSchema: Joi.object().keys({
        test: Joi.string().required(),
        something: Joi.number(),
      }),
    };
    const data = {
      test: 'result',
      something: 4,
    };
    const handler = jest.fn(() => Promise.resolve());
    const resultPromise = on(socket, messageType, handler);
    socket.emit('message', JSON.stringify({
      type: messageType.name,
      data,
    }));

    await expect(resultPromise).resolves;
    expect(handler).toHaveBeenCalled();
  });

  test('handler never gets executed with wrong message type', () => {
    const handler = jest.fn(() => Promise.resolve());
    const socket = createWebsocket();
    on(socket, messageTypes.BROADCAST_START_GAME, handler);
    socket.emit('message', JSON.stringify({
      type: 'wrongmessagetype',
      data: 'result',
    }));
    socket.emit('message', JSON.stringify({
      type: 'someothermessagetype',
    }));

    expect(handler).not.toHaveBeenCalled();
  });

  test('throws on message invalid JSON format', async () => {
    const handler = jest.fn(() => Promise.resolve());
    const socket = createWebsocket();
    const resultPromise = on(socket, messageTypes.BROADCAST_START_GAME, handler);
    socket.emit('message', ', definitely not JSON format { ]');

    await expect(resultPromise).rejects.toThrow('JSON');
  });

  test('throws if message format validation failed', async () => {
    const handler = jest.fn(() => Promise.resolve());
    const socket = createWebsocket();
    const resultPromise = on(socket, messageTypes.START_GAME, handler);
    socket.emit('message', JSON.stringify({
      something: 'wrongmessagetype',
    }));

    await expect(resultPromise).rejects.toThrow('validation');
    expect(handler).not.toHaveBeenCalled();
  });

  test('throws on message data validation', async () => {
    const socket = createWebsocket();
    const messageType = {
      name: 'messagetype',
      validationSchema: Joi.object().keys({
        test: Joi.string().required(),
        something: Joi.number(),
      }),
    };
    const data = {
      type: 'messagetype',
      data: {
        something: 'test',
      },
    };
    const handler = jest.fn(() => Promise.resolve());
    const resultPromise = on(socket, messageType, handler);
    socket.emit('message', JSON.stringify(data));

    await expect(resultPromise).rejects.toThrow('validation');
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('handle unicast message', () => {
  test('send gets called with correct json message (ready state = 1)', () => {
    const socket = createWebsocket(1);
    const messageType = messageTypes.BROADCAST_START_ROUND;
    unicast(socket, messageType);

    const expectedMessage = JSON.stringify({
      type: messageType.name,
    });
    expect(socket.send).toHaveBeenCalledWith(expectedMessage);
  });

  test('throws on unicast on closed socket (ready state = 0)', () => {
    const socket = createWebsocket(0);
    const messageType = messageTypes.ERROR;

    expect(() => unicast(socket, messageType)).toThrow();
  });
});

describe('handle broadcast message', () => {
  test('send gets called for each socket with same message', () => {
    const sockets = [
      createWebsocket(1),
      createWebsocket(1),
      createWebsocket(1),
    ];
    const messageType = messageTypes.BROADCAST_START_ROUND;
    broadcast(sockets, messageType);

    const expectedMessage = JSON.stringify({
      type: messageType.name,
    });
    expect(sockets[0].send).toHaveBeenCalledWith(expectedMessage);
    expect(sockets[1].send).toHaveBeenCalledWith(expectedMessage);
    expect(sockets[2].send).toHaveBeenCalledWith(expectedMessage);
  });

  test('send gets called for each open socket with same message', () => {
    const sockets = [
      createWebsocket(1),
      createWebsocket(0),
      createWebsocket(1),
      createWebsocket(1),
    ];
    const messageType = messageTypes.BROADCAST_START_ROUND;
    broadcast(sockets, messageType);

    const expectedMessage = JSON.stringify({
      type: messageType.name,
    });
    expect(sockets[0].send).toHaveBeenCalledWith(expectedMessage);
    expect(sockets[1].send).not.toHaveBeenCalled();
    expect(sockets[2].send).toHaveBeenCalledWith(expectedMessage);
    expect(sockets[3].send).toHaveBeenCalledWith(expectedMessage);
  });
});

describe('handle request message', () => {
  const REQUEST_TIMEOUT_IN_MILILIS: number = config.get('server.requestTimeoutInMillis');

  beforeEach(() => {
    jest.useFakeTimers();
  });

  test('request gets sent and correct result received', async () => {
    const socket = createWebsocket(1);
    const messageType = messageTypes.REQUEST_CARDS;
    const expectedMessageType = messageTypes.PLAYED_CARDS;
    const messageData = [createSuitCard(3, Suit.SPADES)];

    const resultPromise = request(
      socket,
      messageType,
      expectedMessageType,
      REQUEST_TIMEOUT_IN_MILILIS,
    );

    socket.emit('message', JSON.stringify({
      type: expectedMessageType.name,
      data: messageData,
    }));

    jest.runAllTimers();

    expect(socket.send).toHaveBeenCalled();
    await expect(resultPromise).resolves.toEqual(messageData);
  });

  test('throws on message invalid JSON format', async () => {
    const socket = createWebsocket(1);
    const resultPromise = request(
      socket,
      messageTypes.REQUEST_CARDS,
      messageTypes.PLAYED_CARDS,
      REQUEST_TIMEOUT_IN_MILILIS,
    );

    socket.emit('message', ', definitely not JSON format { ]');

    jest.runAllTimers();

    expect(socket.send).toHaveBeenCalled();
    await expect(resultPromise).rejects.toThrow('JSON');
  });

  test('throws on validation error but correct message type', async () => {
    const socket = createWebsocket(1);
    const expectedMessageType = messageTypes.PLAYED_CARDS;
    const messageData = { something: false };

    const resultPromise = request(
      socket,
      messageTypes.REQUEST_CARDS,
      expectedMessageType,
      REQUEST_TIMEOUT_IN_MILILIS,
    );

    socket.emit('message', JSON.stringify({
      type: expectedMessageType.name,
      data: messageData,
    }));

    jest.runAllTimers();

    expect(socket.send).toHaveBeenCalled();
    await expect(resultPromise).rejects.toThrow('validation');
  });

  test('throws on timeout if no message received', async () => {
    const socket = createWebsocket(1);
    const resultPromise = request(
      socket,
      messageTypes.REQUEST_CARDS,
      messageTypes.PLAYED_CARDS,
      REQUEST_TIMEOUT_IN_MILILIS,
    );

    jest.runAllTimers();

    expect(socket.send).toHaveBeenCalled();
    await expect(resultPromise).rejects.toThrow('timeout');
  });

  test('throws on timeout if messages with unexpected types received', async () => {
    const socket = createWebsocket(1);
    const resultPromise = request(
      socket,
      messageTypes.REQUEST_CARDS,
      messageTypes.PLAYED_CARDS,
      REQUEST_TIMEOUT_IN_MILILIS,
    );

    socket.emit('message', JSON.stringify({
      type: 'somerandomtype',
    }));

    socket.emit('message', JSON.stringify({
      type: messageTypes.START_GAME.name,
    }));

    jest.runAllTimers();

    expect(socket.send).toHaveBeenCalled();
    await expect(resultPromise).rejects.toThrow('timeout');
  });
});
