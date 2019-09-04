import shuffle from 'lodash.shuffle';
import sample from 'lodash.sample';
import { differenceWith } from 'ramda';
import { equals as cardEquals } from '../../shared/game/card';
import { PlayerId } from '../../shared/types/player';
import { Deck } from '../types/deck';
import { CardCountToDeal } from '../types/game';
import { PlayerHands } from '../types/hand';
import { create as createDeck } from './deck';
import { Card } from '../../shared/types/card';

const filterCardsFromDeck = (
  deck: Deck,
  penaltyCards: Card[],
): Deck => differenceWith(cardEquals, deck, penaltyCards);

const createPlayerHands = (
  deck: Deck,
  playerIds: PlayerId[],
  cardCountToDeal: number,
): PlayerHands => playerIds.reduce((hands, playerId, index) => {
  const startingIndex = cardCountToDeal * index;
  const cards = deck.slice(startingIndex, startingIndex + cardCountToDeal);
  return { ...hands, [playerId]: cards };
}, {});

const shuffleDeck = (deck: Deck): Deck => shuffle(deck);

export const createHandsForPlayerIds = (
  playerIds: PlayerId[],
  cardsToOmit: Card[],
  cardCountToDeal: CardCountToDeal,
): PlayerHands => {
  const initialDeck = createDeck();
  const filteredDeck = filterCardsFromDeck(initialDeck, cardsToOmit);
  const shuffledDeck = shuffleDeck(filteredDeck);
  return createPlayerHands(shuffledDeck, playerIds, cardCountToDeal);
};

export const samplePlayerId = (playerIds: PlayerId[]): PlayerId => {
  const playerId = sample(playerIds);
  if (playerId === undefined || playerId === null) {
    throw Error('cannot sample player id. usually this is caused by passing an empty array.');
  }
  return playerId;
};
