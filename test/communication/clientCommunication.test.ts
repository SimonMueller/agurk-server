import config from 'config';
import Joi, { any } from '@hapi/joi';
import { createSuitCard, MessageName, Suits } from 'agurk-shared';
import { timeout } from 'rxjs/operators';
import {
  broadcast, on, request, unicast,
} from '../../src/communication/clientCommunication';
import createWebsocket from '../mocks/websocket';
import { ExpectedMessage } from '../../src/types/messageType';

function createExpectedMessageWithoutValidation(messageName: MessageName): ExpectedMessage {
  return {
    name: messageName,
    dataValidationSchema: Joi.any(),
  } as const;
}

describe('handle on message', () => {
  test('observer gets executed', (done) => {
    const socket = createWebsocket();
    const expectedMessage = {
      name: MessageName.PLAY_CARDS,
      dataValidationSchema: any().forbidden(),
    };

    on(socket, expectedMessage).subscribe(() => done());

    socket.emit('message', JSON.stringify({
      name: expectedMessage.name,
    }));
  });

  test('observer gets executed with correct message data', (done) => {
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

  test('observer is not executed with wrong message types', (done) => {
    jest.useFakeTimers();
    const socket = createWebsocket();
    const expectedMessage = createExpectedMessageWithoutValidation(MessageName.BROADCAST_START_GAME);

    on(socket, expectedMessage)
      .pipe(timeout(5000))
      .subscribe(
        () => done('observer should not have been executed'),
        () => done(),
      );

    socket.emit('message', JSON.stringify({
      name: 'wrongmessagetype',
      data: 'result',
    }));
    socket.emit('message', JSON.stringify({
      name: 'someothermessagetype',
    }));

    jest.runAllTimers();
  });

  test('throws on message invalid JSON format', (done) => {
    const socket = createWebsocket();
    const expectedMessage = createExpectedMessageWithoutValidation(MessageName.BROADCAST_START_GAME);

    on(socket, expectedMessage).subscribe(
      () => done('should not have been called)'),
      () => done(),
    );

    socket.emit('message', ', definitely not JSON format { ]');
  });

  test('throws if message format validation failed', (done) => {
    const socket = createWebsocket();
    const expectedMessage = createExpectedMessageWithoutValidation(MessageName.START_GAME);

    on(socket, expectedMessage).subscribe(
      () => done('should not have been called)'),
      () => done(),
    );

    socket.emit('message', JSON.stringify({
      something: 'wrongmessagetype',
    }));
  });

  test('throws on message data validation', (done) => {
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

    on(socket, expectedMessage).subscribe(
      () => done('should not have been called)'),
      () => done(),
    );

    socket.emit('message', JSON.stringify(data));
  });
});

describe('handle unicast message', () => {
  test('send gets called with correct json message (ready state = 1)', () => {
    const socket = createWebsocket(1);
    const message = { name: MessageName.BROADCAST_START_ROUND } as const;

    unicast(socket, message);

    const expectedMessage = JSON.stringify({
      name: message.name,
    });
    expect(socket.send).toHaveBeenCalledWith(expectedMessage);
  });

  test('throws on unicast on closed socket (ready state = 0)', () => {
    const socket = createWebsocket(0);
    const message = { name: MessageName.BROADCAST_START_ROUND } as const;

    expect(() => unicast(socket, message)).toThrow();
  });
});

describe('handle broadcast message', () => {
  test('send gets called for each socket with same message', () => {
    const sockets = [
      createWebsocket(1),
      createWebsocket(1),
      createWebsocket(1),
    ];
    const message = { name: MessageName.BROADCAST_START_ROUND } as const;

    broadcast(sockets, message);

    const expectedMessage = JSON.stringify({
      name: message.name,
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
    const message = { name: MessageName.BROADCAST_START_ROUND } as const;

    broadcast(sockets, message);

    const expectedMessage = JSON.stringify({
      name: message.name,
    });
    expect(sockets[0].send).toHaveBeenCalledWith(expectedMessage);
    expect(sockets[1].send).not.toHaveBeenCalled();
    expect(sockets[2].send).toHaveBeenCalledWith(expectedMessage);
    expect(sockets[3].send).toHaveBeenCalledWith(expectedMessage);
  });
});

describe('handle request message', () => {
  const REQUEST_TIMEOUT_IN_MILILIS: number = config.get('server.requestTimeoutInMillis');
  const REQUESTER_MESSAGE_TYPE = { name: MessageName.REQUEST_CARDS } as const;
  const EXPECTED_MESSAGE_TYPE = {
    name: MessageName.PLAY_CARDS,
    dataValidationSchema: Joi.array().length(1),
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  test('request gets sent and correct result received', async () => {
    const socket = createWebsocket(1);
    const messageData = [createSuitCard(3, Suits.SPADES)];

    const resultPromise = request(
      socket,
      REQUESTER_MESSAGE_TYPE,
      EXPECTED_MESSAGE_TYPE,
      REQUEST_TIMEOUT_IN_MILILIS,
    );

    socket.emit('message', JSON.stringify({
      name: EXPECTED_MESSAGE_TYPE.name,
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
      REQUESTER_MESSAGE_TYPE,
      EXPECTED_MESSAGE_TYPE,
      REQUEST_TIMEOUT_IN_MILILIS,
    );

    socket.emit('message', ', definitely not JSON format { ]');

    jest.runAllTimers();

    expect(socket.send).toHaveBeenCalled();
    await expect(resultPromise).rejects.toThrow('JSON');
  });

  test('throws on validation error but correct message type', async () => {
    const socket = createWebsocket(1);
    const messageData = { something: false };

    const resultPromise = request(
      socket,
      REQUESTER_MESSAGE_TYPE,
      EXPECTED_MESSAGE_TYPE,
      REQUEST_TIMEOUT_IN_MILILIS,
    );

    socket.emit('message', JSON.stringify({
      name: EXPECTED_MESSAGE_TYPE.name,
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
      REQUESTER_MESSAGE_TYPE,
      EXPECTED_MESSAGE_TYPE,
      REQUEST_TIMEOUT_IN_MILILIS,
    );

    jest.runAllTimers();

    expect(socket.send).toHaveBeenCalled();
    await expect(resultPromise).rejects.toThrow('Timeout');
  });

  test('throws on timeout if messages with unexpected types received', async () => {
    const socket = createWebsocket(1);
    const resultPromise = request(
      socket,
      REQUESTER_MESSAGE_TYPE,
      EXPECTED_MESSAGE_TYPE,
      REQUEST_TIMEOUT_IN_MILILIS,
    );

    socket.emit('message', JSON.stringify({
      name: 'somerandomtype',
    }));

    socket.emit('message', JSON.stringify({
      name: MessageName.START_GAME,
    }));

    jest.runAllTimers();

    expect(socket.send).toHaveBeenCalled();
    await expect(resultPromise).rejects.toThrow('Timeout');
  });
});
