import {
  createJokerCard, createSuitCard, Colors, Suits, Card, MessageName,
} from 'agurk-shared';
import { requestCards } from '../../src/communication/playerCommunication';
import createWebsocket from '../mocks/websocket';

describe('request cards', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  test('valid type and data sent', async () => {
    const socket = createWebsocket(1);
    const cards = [createSuitCard(10, Suits.DIAMONDS)];
    const resultPromise = requestCards(socket);

    socket.emit('message', JSON.stringify({
      name: MessageName.PLAYED_CARDS,
      data: cards,
    }));

    jest.runAllTimers();

    await expect(resultPromise).resolves.toEqual(cards);
  });

  test('too many cards', async () => {
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
    const resultPromise = requestCards(socket);

    socket.emit('message', JSON.stringify({
      name: MessageName.PLAYED_CARDS,
      data: cards,
    }));

    jest.runAllTimers();

    await expect(resultPromise).rejects.toThrow('validation');
  });

  test('empty cards sent', async () => {
    const socket = createWebsocket();
    const cards: Card[] = [];
    const resultPromise = requestCards(socket);

    socket.emit('message', JSON.stringify({
      name: MessageName.PLAYED_CARDS,
      data: cards,
    }));

    jest.runAllTimers();

    await expect(resultPromise).rejects.toThrow('validation');
  });

  test('valid joker and suit cards mixed', async () => {
    const socket = createWebsocket();
    const cards = [
      createSuitCard(2, Suits.CLUBS),
      createJokerCard(Colors.BLACK),
    ];
    const resultPromise = requestCards(socket);

    socket.emit('message', JSON.stringify({
      name: MessageName.PLAYED_CARDS,
      data: cards,
    }));

    jest.runAllTimers();

    await expect(resultPromise).resolves.toEqual(cards);
  });

  test('one valid card sent', async () => {
    const socket = createWebsocket();
    const cards = [createSuitCard(2, Suits.CLUBS)];
    const resultPromise = requestCards(socket);

    socket.emit('message', JSON.stringify({
      name: MessageName.PLAYED_CARDS,
      data: cards,
    }));

    jest.runAllTimers();

    await expect(resultPromise).resolves.toEqual(cards);
  });

  test('invalid card with suit and color sent', async () => {
    const socket = createWebsocket();
    const cards = [{ rank: 12, color: Colors.WHITE, suit: Suits.CLUBS }];
    const resultPromise = requestCards(socket);

    socket.emit('message', JSON.stringify({
      name: MessageName.PLAYED_CARDS,
      data: cards,
    }));

    jest.runAllTimers();

    await expect(resultPromise).rejects.toThrow('validation');
  });
});
