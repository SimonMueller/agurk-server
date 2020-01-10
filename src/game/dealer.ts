import shuffle from 'lodash.shuffle';
import sample from 'lodash.sample';
import { PlayerId, Card, cardEquals } from 'agurk-shared';
import { differenceWith } from 'ramda';
import { Deck } from '../types/deck';
import { CardCountToDeal } from '../types/game';
import { PlayerHands } from '../types/hand';
import { create as createDeck } from './deck';
import { DealerApi } from '../types/dealer';

function filterCardsFromDeck(deck: Deck, penaltyCards: Card[]): Deck {
  return differenceWith(cardEquals, deck, penaltyCards);
}

function createPlayerHands(
  deck: Deck,
  playerIds: PlayerId[],
  cardCountToDeal: number,
): PlayerHands {
  return playerIds.reduce((hands, playerId, index) => {
    const startingIndex = cardCountToDeal * index;
    const cards = deck.slice(startingIndex, startingIndex + cardCountToDeal);
    return { ...hands, [playerId]: cards };
  }, {});
}

const shuffleDeck = (deck: Deck): Deck => shuffle(deck);

function createHandsForPlayerIds(
  playerIds: PlayerId[],
  cardsToOmit: Card[],
  cardCountToDeal: CardCountToDeal,
): PlayerHands {
  const initialDeck = createDeck();
  const filteredDeck = filterCardsFromDeck(initialDeck, cardsToOmit);
  const shuffledDeck = shuffleDeck(filteredDeck);
  return createPlayerHands(shuffledDeck, playerIds, cardCountToDeal);
}

function samplePlayerId(playerIds: PlayerId[]): PlayerId {
  const playerId = sample(playerIds);
  if (playerId === undefined || playerId === null) {
    throw Error('cannot sample player id. usually this is caused by passing an empty array.');
  }
  return playerId;
}

export default function create(): DealerApi {
  return {
    createHandsForPlayerIds,
    samplePlayerId,
  };
}
