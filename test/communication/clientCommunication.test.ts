import config from 'config';
import Joi, { any } from '@hapi/joi';
import { createSuitCard, MessageName, Suits } from 'agurk-shared';
import { timeout } from 'rxjs/operators';
import WebSocket from 'ws';
import {
  broadcast, on, request, unicast,
} from '../../src/communication/clientCommunication';
import createWebsocket from '../mocks/websocket';
import { ExpectedMessage } from '../../src/types/messageType';
import flushAllPromises from '../promiseHelper';

function createExpectedMessageWithoutValidation(messageName: MessageName): ExpectedMessage {
  return {
    name: messageName,
    dataValidationSchema: Joi.any(),
  } as const;
}

describe('on expect message', () => {
  const ON_EXPECT_MESSAGE_TIMEOUT = 4000;

  beforeEach(() => jest.useFakeTimers());

  afterEach(() => jest.useRealTimers());

  test('emits', (done) => {
    const socket = createWebsocket();
    const expectedMessage = {
      name: MessageName.PLAY_CARDS,
      dataValidationSchema: any().forbidden(),
    };

    on(socket, expectedMessage).subscribe(() => done());

    socket.emit('message', JSON.stringify({ name: expectedMessage.name }));
  });

  test('emits with correct message data', (done) => {
    const socket = createWebsocket();
    const expectedMessage = {
      name: MessageName.PLAY_CARDS,
      dataValidationSchema: Joi.object().keys({
        something: Joi.number(),
      }),
    };
    on(socket, expectedMessage).subscribe((data) => {
      expect(data).toEqual({ something: 42 });
      done();
    });

    socket.emit('message', JSON.stringify({
      name: expectedMessage.name,
      data: {
        something: 42,
      },
    }));
  });

  test('doesn\'t emit on wrong message types', (done) => {
    const socket = createWebsocket();
    const expectedMessage = createExpectedMessageWithoutValidation(MessageName.BROADCAST_START_GAME);

    on(socket, expectedMessage)
      .pipe(
        timeout(ON_EXPECT_MESSAGE_TIMEOUT),
      ).subscribe(
        () => done('should not have been called)'),
        () => done(),
      );

    socket.emit('message', JSON.stringify({
      name: 'wrongmessagetype',
      data: 'result',
    }));
    socket.emit('message', JSON.stringify({ name: 'someothermessagetype' }));

    jest.runAllTimers();
  });

  test('doesn\'t emit on message in invalid JSON format', (done) => {
    const socket = createWebsocket();
    const expectedMessage = createExpectedMessageWithoutValidation(MessageName.BROADCAST_START_GAME);

    on(socket, expectedMessage)
      .pipe(
        timeout(ON_EXPECT_MESSAGE_TIMEOUT),
      ).subscribe(
        () => done('should not have been called)'),
        () => done(),
      );

    socket.emit('message', ', definitely not JSON format { ]');

    jest.runAllTimers();
  });

  test('doesn\'t on message format validation failed', (done) => {
    const socket = createWebsocket();
    const expectedMessage = createExpectedMessageWithoutValidation(MessageName.START_GAME);

    on(socket, expectedMessage)
      .pipe(
        timeout(ON_EXPECT_MESSAGE_TIMEOUT),
      ).subscribe(
        () => done('should not have been called)'),
        () => done(),
      );

    socket.emit('message', JSON.stringify({ something: 'wrongmessagetype' }));

    jest.runAllTimers();
  });

  test('doesn\'t emit on message data validation failed', (done) => {
    const socket = createWebsocket();
    const expectedMessage = {
      name: MessageName.PLAY_CARDS,
      dataValidationSchema: Joi.object().keys({
        test: Joi.string().required(),
        something: Joi.number(),
      }),
    };
    const data = {
      name: expectedMessage.name,
      data: {
        something: 'test',
      },
    };

    on(socket, expectedMessage)
      .pipe(
        timeout(ON_EXPECT_MESSAGE_TIMEOUT),
      ).subscribe(
        () => done('should not have been called)'),
        () => done(),
      );

    socket.emit('message', JSON.stringify(data));

    jest.runAllTimers();
  });
});

describe('send unicast message', () => {
  test('gets called with correct json message (ready state = 1)', () => {
    const socket = createWebsocket(WebSocket.OPEN);
    const message = { name: MessageName.START_GAME } as const;

    unicast(socket, message);

    const expectedMessage = JSON.stringify({ name: message.name });

    expect(socket.send).toHaveBeenCalledWith(expectedMessage, expect.any(Function));
  });

  test('does not throw on unicast for closed socket (ready state = 0)', () => {
    const socket = createWebsocket(WebSocket.CLOSED);
    const message = { name: MessageName.START_GAME } as const;

    expect(() => unicast(socket, message)).not.toThrow();
  });
});

describe('send broadcast message', () => {
  test('gets called for each socket with same message', () => {
    const sockets = [
      createWebsocket(),
      createWebsocket(),
      createWebsocket(),
    ];
    const message = { name: MessageName.START_GAME } as const;

    broadcast(sockets, message);

    const expectedMessage = JSON.stringify({ name: message.name });
    expect(sockets[0].send).toHaveBeenCalledWith(expectedMessage, expect.any(Function));
    expect(sockets[1].send).toHaveBeenCalledWith(expectedMessage, expect.any(Function));
    expect(sockets[2].send).toHaveBeenCalledWith(expectedMessage, expect.any(Function));
  });

  test('gets called for each open socket with same message', () => {
    const sockets = [
      createWebsocket(WebSocket.OPEN),
      createWebsocket(WebSocket.CLOSED),
      createWebsocket(WebSocket.OPEN),
      createWebsocket(WebSocket.OPEN),
    ];
    const message = { name: MessageName.START_GAME } as const;

    broadcast(sockets, message);

    const expectedMessage = JSON.stringify({ name: message.name });

    expect(sockets[0].send).toHaveBeenCalledWith(expectedMessage, expect.any(Function));
    expect(sockets[1].send).not.toHaveBeenCalled();
    expect(sockets[2].send).toHaveBeenCalledWith(expectedMessage, expect.any(Function));
    expect(sockets[3].send).toHaveBeenCalledWith(expectedMessage, expect.any(Function));
  });
});

describe('send request message and expect response', () => {
  const REQUEST_TIMEOUT_IN_MILILIS: number = config.get('server.requestTimeoutInMillis');
  const REQUESTER_MESSAGE_TYPE = {
    name: MessageName.REQUEST_CARDS,
    data: { timeoutInMillis: REQUEST_TIMEOUT_IN_MILILIS },
  } as const;
  const EXPECTED_MESSAGE_TYPE = {
    name: MessageName.PLAY_CARDS,
    dataValidationSchema: Joi.array().length(1),
  };

  beforeEach(() => jest.useFakeTimers());

  afterEach(() => jest.useRealTimers());

  test('with correct result received', async () => {
    const socket = createWebsocket();
    const messageData = [createSuitCard(3, Suits.SPADES)];

    const resultPromise = request(
      socket,
      REQUESTER_MESSAGE_TYPE,
      EXPECTED_MESSAGE_TYPE,
      REQUEST_TIMEOUT_IN_MILILIS,
    );
    await flushAllPromises();

    socket.emit('message', JSON.stringify({
      name: EXPECTED_MESSAGE_TYPE.name,
      data: messageData,
    }));

    jest.runAllTimers();

    await expect(resultPromise).resolves.toEqual(messageData);
  });

  test('timeouts on message invalid JSON format', async () => {
    const socket = createWebsocket();

    const resultPromise = request(
      socket,
      REQUESTER_MESSAGE_TYPE,
      EXPECTED_MESSAGE_TYPE,
      REQUEST_TIMEOUT_IN_MILILIS,
    );
    await flushAllPromises();

    socket.emit('message', ', definitely not JSON format { ]');

    jest.runAllTimers();

    await expect(resultPromise).rejects.toThrow('Timeout');
  });

  test('timeouts on validation error but correct message type', async () => {
    const socket = createWebsocket(WebSocket.OPEN);
    const messageData = { something: false };

    const resultPromise = request(
      socket,
      REQUESTER_MESSAGE_TYPE,
      EXPECTED_MESSAGE_TYPE,
      REQUEST_TIMEOUT_IN_MILILIS,
    );
    await flushAllPromises();

    socket.emit('message', JSON.stringify({
      name: EXPECTED_MESSAGE_TYPE.name,
      data: messageData,
    }));

    jest.runAllTimers();

    await expect(resultPromise).rejects.toThrow('Timeout');
  });

  test('timeouts if no message received', async () => {
    const socket = createWebsocket();
    const resultPromise = request(
      socket,
      REQUESTER_MESSAGE_TYPE,
      EXPECTED_MESSAGE_TYPE,
      REQUEST_TIMEOUT_IN_MILILIS,
    );
    await flushAllPromises();

    jest.runAllTimers();

    await expect(resultPromise).rejects.toThrow('Timeout');
  });

  test('rejects if message could not be sent', async () => {
    const socket = createWebsocket(1, Error('error while sending message'));
    const resultPromise = request(socket, REQUESTER_MESSAGE_TYPE, EXPECTED_MESSAGE_TYPE, REQUEST_TIMEOUT_IN_MILILIS);

    await expect(resultPromise).rejects.toThrow('error while sending message');
  });

  test('timeouts if messages with unexpected types received', async () => {
    const socket = createWebsocket();
    const resultPromise = request(
      socket,
      REQUESTER_MESSAGE_TYPE,
      EXPECTED_MESSAGE_TYPE,
      REQUEST_TIMEOUT_IN_MILILIS,
    );
    await flushAllPromises();

    socket.emit('message', JSON.stringify({ name: 'somerandomtype' }));

    socket.emit('message', JSON.stringify({ name: MessageName.START_GAME }));

    jest.runAllTimers();

    await expect(resultPromise).rejects.toThrow('Timeout');
  });

  test('first correct message from request resolves', async () => {
    const socket = createWebsocket();
    const resultPromise = request(
      socket,
      REQUESTER_MESSAGE_TYPE,
      EXPECTED_MESSAGE_TYPE,
      REQUEST_TIMEOUT_IN_MILILIS,
    );
    await flushAllPromises();

    socket.emit('message', JSON.stringify({
      name: EXPECTED_MESSAGE_TYPE.name,
      data: [createSuitCard(3, Suits.SPADES)],
    }));

    socket.emit('message', JSON.stringify({
      name: EXPECTED_MESSAGE_TYPE.name,
      data: [createSuitCard(6, Suits.DIAMONDS)],
    }));

    await expect(resultPromise).resolves.toEqual([createSuitCard(3, Suits.SPADES)]);
  });
});
