import {
  createJokerCard, createSuitCard, Colors, Suits, Card, MessageName,
} from 'agurk-shared';
import createPlayerApi from '../../src/communication/playerApi';
import createWebsocket from '../mocks/websocket';
import flushAllPromises from './promiseHelper';

describe('request cards and expect response', () => {
  test('with valid type and data', async () => {
    const socket = createWebsocket(1);
    const cards = [createSuitCard(10, Suits.DIAMONDS)];
    const playerApi = createPlayerApi(socket);
    const resultPromise = playerApi.requestCards();
    await flushAllPromises();

    socket.emit('message', JSON.stringify({
      name: MessageName.PLAY_CARDS,
      data: cards,
    }));

    await expect(resultPromise).resolves.toEqual(cards);
  });

  test('timeouts if only too many cards sent', async () => {
    const socket = createWebsocket();
    const cards = [
      createSuitCard(10, Suits.DIAMONDS),
      createSuitCard(3, Suits.CLUBS),
      createSuitCard(2, Suits.CLUBS),
      createJokerCard(Colors.RED),
      createJokerCard(Colors.BLACK),
      createSuitCard(9, Suits.SPADES),
      createSuitCard(5, Suits.HEARTS),
      createSuitCard(7, Suits.CLUBS),
    ];
    const playerApi = createPlayerApi(socket);
    const resultPromise = playerApi.requestCards();
    await flushAllPromises();

    socket.emit('message', JSON.stringify({
      name: MessageName.PLAY_CARDS,
      data: cards,
    }));

    jest.runAllTimers();
    await expect(resultPromise).rejects.toThrow('Timeout');
  });

  test('timeouts if only empty cards sent', async () => {
    const socket = createWebsocket();
    const cards: Card[] = [];
    const playerApi = createPlayerApi(socket);
    const resultPromise = playerApi.requestCards();
    await flushAllPromises();

    socket.emit('message', JSON.stringify({
      name: MessageName.PLAY_CARDS,
      data: cards,
    }));

    jest.runAllTimers();
    await expect(resultPromise).rejects.toThrow('Timeout');
  });

  test('with valid joker and suit cards mixed', async () => {
    const socket = createWebsocket();
    const cards = [
      createSuitCard(2, Suits.CLUBS),
      createJokerCard(Colors.BLACK),
    ];
    const playerApi = createPlayerApi(socket);
    const resultPromise = playerApi.requestCards();
    await flushAllPromises();

    socket.emit('message', JSON.stringify({
      name: MessageName.PLAY_CARDS,
      data: cards,
    }));

    await expect(resultPromise).resolves.toEqual(cards);
  });

  test('with one valid card sent', async () => {
    const socket = createWebsocket();
    const cards = [createSuitCard(2, Suits.CLUBS)];
    const playerApi = createPlayerApi(socket);
    const resultPromise = playerApi.requestCards();
    await flushAllPromises();

    socket.emit('message', JSON.stringify({
      name: MessageName.PLAY_CARDS,
      data: cards,
    }));

    await expect(resultPromise).resolves.toEqual(cards);
  });

  test('timeouts if only invalid card with suit and color sent', async () => {
    const socket = createWebsocket();
    const cards = [{ rank: 12, color: Colors.WHITE, suit: Suits.CLUBS }];
    const playerApi = createPlayerApi(socket);
    const resultPromise = playerApi.requestCards();

    socket.emit('message', JSON.stringify({
      name: MessageName.PLAY_CARDS,
      data: cards,
    }));

    jest.runAllTimers();

    await expect(resultPromise).rejects.toThrow('Timeout');
  });
});
