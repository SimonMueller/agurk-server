import shuffle from 'lodash.shuffle';
import sample from 'lodash.sample';
import { PlayerId, Card, cardEquals } from 'agurk-shared';
import { differenceWith } from 'ramda';
import { Deck } from '../types/deck';
import { CardCountToDeal } from '../types/game';
import { HandsByPlayerId } from '../types/hand';
import { create as createDeck } from './deck';
import { Dealer } from '../types/dealer';

function filterCardsFromDeck(deck: Deck, penaltyCards: Card[]): Deck {
  return differenceWith(cardEquals, deck, penaltyCards);
}

function createPlayerHands(
  deck: Deck,
  playerIds: PlayerId[],
  cardCountToDeal: number,
): HandsByPlayerId {
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
): HandsByPlayerId {
  const initialDeck = createDeck();
  const filteredDeck = filterCardsFromDeck(initialDeck, cardsToOmit);
  const shuffledDeck = shuffleDeck(filteredDeck);
  return createPlayerHands(shuffledDeck, playerIds, cardCountToDeal);
}

function samplePlayerId(playerIds: PlayerId[]): PlayerId | undefined {
  return sample(playerIds);
}

export default function create(): Dealer {
  return {
    createHandsForPlayerIds,
    samplePlayerId,
  };
}
