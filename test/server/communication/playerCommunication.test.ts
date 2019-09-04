import { requestCards } from '../../../server/communication/playerCommunication';
import * as messageTypes from '../../../shared/communication/messageTypes';
import createWebsocket from '../../mocks/websocket';
import {
  createJokerCard, createSuitCard, Color, Suit,
} from '../../../shared/game/card';
import { Card } from '../../../shared/types/card';

describe('request cards', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  test('valid type and data sent', async () => {
    const socket = createWebsocket(1);
    const cards = [createSuitCard(10, Suit.DIAMONDS)];
    const resultPromise = requestCards(socket);

    socket.emit('message', JSON.stringify({
      type: messageTypes.PLAYED_CARDS.name,
      data: cards,
    }));

    jest.runAllTimers();

    await expect(resultPromise).resolves.toEqual(cards);
  });

  test('too many cards', async () => {
    const socket = createWebsocket();
    const cards = [
      createSuitCard(10, Suit.DIAMONDS),
      createSuitCard(3, Suit.CLUBS),
      createSuitCard(2, Suit.CLUBS),
      createJokerCard(Color.RED),
      createJokerCard(Color.BLACK),
      createSuitCard(9, Suit.SPADES),
      createSuitCard(5, Suit.HEARTS),
      createSuitCard(7, Suit.CLUBS),
    ];
    const resultPromise = requestCards(socket);

    socket.emit('message', JSON.stringify({
      type: messageTypes.PLAYED_CARDS.name,
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
      type: messageTypes.PLAYED_CARDS.name,
      data: cards,
    }));

    jest.runAllTimers();

    await expect(resultPromise).rejects.toThrow('validation');
  });

  test('valid joker and suit cards mixed', async () => {
    const socket = createWebsocket();
    const cards = [
      createSuitCard(2, Suit.CLUBS),
      createJokerCard(Color.BLACK),
    ];
    const resultPromise = requestCards(socket);

    socket.emit('message', JSON.stringify({
      type: messageTypes.PLAYED_CARDS.name,
      data: cards,
    }));

    jest.runAllTimers();

    await expect(resultPromise).resolves.toEqual(cards);
  });

  test('one valid card sent', async () => {
    const socket = createWebsocket();
    const cards = [createSuitCard(2, Suit.CLUBS)];
    const resultPromise = requestCards(socket);

    socket.emit('message', JSON.stringify({
      type: messageTypes.PLAYED_CARDS.name,
      data: cards,
    }));

    jest.runAllTimers();

    await expect(resultPromise).resolves.toEqual(cards);
  });

  test('invalid card with suit and color sent', async () => {
    const socket = createWebsocket();
    const cards = [{ rank: 12, color: Color.WHITE, suit: Suit.CLUBS }];
    const resultPromise = requestCards(socket);

    socket.emit('message', JSON.stringify({
      type: messageTypes.PLAYED_CARDS.name,
      data: cards,
    }));

    jest.runAllTimers();

    await expect(resultPromise).rejects.toThrow('validation');
  });
});
