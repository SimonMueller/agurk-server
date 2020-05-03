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

function toHandsByPlayerId(cardCountToDeal: number, deck: Card[]) {
  return (hands: HandsByPlayerId, playerId: PlayerId, index: number): HandsByPlayerId => {
    const startingIndex = cardCountToDeal * index;
    const cards = deck.slice(startingIndex, startingIndex + cardCountToDeal);
    return { ...hands, [playerId]: cards };
  };
}

function createPlayerHands(
  deck: Deck,
  playerIds: PlayerId[],
  cardCountToDeal: number,
): HandsByPlayerId {
  const isCardCountToDealAvailable = deck.length - (playerIds.length * cardCountToDeal) >= 0;
  return isCardCountToDealAvailable
    ? playerIds.reduce(toHandsByPlayerId(cardCountToDeal, deck), {})
    : createPlayerHands(deck, playerIds, cardCountToDeal - 1);
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
