import {
  Card, Colors, createJokerCard, createSuitCard, Suits, ValidTurn,
} from 'agurk-shared';
import {
  calculateCardCountToDeal,
  chooseCycleStartingPlayerId,
  chooseRoundWinner,
  isPenaltySumThresholdExceeded,
  isValidPlayerCount,
} from '../../src/game/rules';
import createDealer from '../../src/game/dealer';
import PlayerId from '../factories/playerId';
import { RoundState } from '../../src/types/round';

describe('player count in valid range', () => {
  test('-10 players', () => {
    expect(isValidPlayerCount(-10)).toEqual(false);
  });

  test('1 player', () => {
    expect(isValidPlayerCount(1)).toEqual(false);
  });

  test('2 players', () => {
    expect(isValidPlayerCount(2)).toEqual(true);
  });

  test('5 players', () => {
    expect(isValidPlayerCount(5)).toEqual(true);
  });

  test('7 players', () => {
    expect(isValidPlayerCount(7)).toEqual(true);
  });

  test('8 players', () => {
    expect(isValidPlayerCount(8)).toEqual(false);
  });

  test('30 players', () => {
    expect(isValidPlayerCount(30)).toEqual(false);
  });
});

describe('calculcate card count to deal per round and player', () => {
  test('first round', () => {
    expect(calculateCardCountToDeal(0)).toBe(7);
  });

  test('second round', () => {
    expect(calculateCardCountToDeal(1)).toBe(6);
  });

  test('third round', () => {
    expect(calculateCardCountToDeal(2)).toBe(5);
  });

  test('fourth round', () => {
    expect(calculateCardCountToDeal(3)).toBe(4);
  });

  test('fifth round', () => {
    expect(calculateCardCountToDeal(4)).toBe(3);
  });

  test('sixth round', () => {
    expect(calculateCardCountToDeal(5)).toBe(2);
  });

  test('seventh round', () => {
    expect(calculateCardCountToDeal(6)).toBe(1);
  });

  test('eighth round', () => {
    expect(calculateCardCountToDeal(7)).toBe(2);
  });

  test('ninth round', () => {
    expect(calculateCardCountToDeal(8)).toBe(3);
  });

  test('tenth round', () => {
    expect(calculateCardCountToDeal(9)).toBe(4);
  });

  test('sixteenth round', () => {
    expect(calculateCardCountToDeal(15)).toBe(4);
  });
});

describe('penalty threshold exceeded', () => {
  test('more than 21', () => {
    const penaltyCards: Card[] = [
      createSuitCard(14, Suits.HEARTS),
      createJokerCard(Colors.WHITE),
    ];

    expect(isPenaltySumThresholdExceeded(penaltyCards)).toBe(true);
  });

  test('less than 21', () => {
    const penaltyCards: Card[] = [createSuitCard(14, Suits.DIAMONDS)];

    expect(isPenaltySumThresholdExceeded(penaltyCards)).toBe(false);
  });

  test('empty array', () => {
    const penaltyCards: Card[] = [];

    expect(isPenaltySumThresholdExceeded(penaltyCards)).toBe(false);
  });

  test('exactly 21', () => {
    const penaltyCards: Card[] = [
      createSuitCard(14, Suits.DIAMONDS),
      createSuitCard(7, Suits.SPADES),
    ];

    expect(isPenaltySumThresholdExceeded(penaltyCards)).toBe(false);
  });
});

describe('check if correct cycle starting player', () => {
  test('no cycles in round results in first player', () => {
    const playerIds = PlayerId.buildList(3);
    const roundState: RoundState = {
      cycles: [],
      outPlayers: [],
      playerIds,
      initialHands: {
        [playerIds[0]]: [createSuitCard(10, Suits.CLUBS)],
        [playerIds[1]]: [createSuitCard(5, Suits.DIAMONDS)],
        [playerIds[2]]: [createSuitCard(8, Suits.SPADES)],
      },
    };

    expect(chooseCycleStartingPlayerId(roundState)).toBe(playerIds[0]);
  });

  test('latest highest turn player is starting player', () => {
    const turns: ValidTurn[] = [
      { playerId: 'player 1', cards: [createJokerCard(Colors.BLACK)], valid: true },
      { playerId: 'player 2', cards: [createSuitCard(3, Suits.SPADES)], valid: true },
      { playerId: 'player 3', cards: [createJokerCard(Colors.RED)], valid: true },
    ];
    const initialHands = {
      [turns[0].playerId]: turns[0].cards,
      [turns[1].playerId]: turns[1].cards,
      [turns[2].playerId]: turns[2].cards,
    };
    const playerIds = turns.map(turn => turn.playerId);

    const roundState = {
      cycles: [{
        turns,
        hands: initialHands,
        playerIds,
        outPlayers: [],
        lowestTurns: [turns[1]],
        highestTurns: [turns[0], turns[2]],
      }],
      outPlayers: [],
      playerIds,
      initialHands,
    };

    expect(chooseCycleStartingPlayerId(roundState)).toBe(turns[2].playerId);
  });
});

describe('choose round winner', () => {
  test('no cycles in round ends results in no round winner', () => {
    const playerIds = PlayerId.buildList(3);
    const { samplePlayerId } = createDealer();
    const initialRoundState = {
      cycles: [],
      outPlayers: [],
      playerIds,
      initialHands: {},
    };

    expect(chooseRoundWinner(initialRoundState, samplePlayerId)).toBeUndefined();
  });

  test('empty lowest turns in last cycle results in no winner', () => {
    const turns: ValidTurn[] = [
      { playerId: 'player 1', cards: [createJokerCard(Colors.BLACK)], valid: true },
      { playerId: 'player 2', cards: [createJokerCard(Colors.RED)], valid: true },
    ];
    const { samplePlayerId } = createDealer();
    const initialHands = {
      [turns[0].playerId]: turns[0].cards,
      [turns[1].playerId]: turns[1].cards,
    };
    const playerIds = turns.map(turn => turn.playerId);
    const roundState = {
      cycles: [{
        turns,
        hands: initialHands,
        playerIds,
        outPlayers: [],
        lowestTurns: [],
        highestTurns: [turns[0], turns[1]],
      }],
      outPlayers: [],
      playerIds,
      initialHands,
    };

    expect(chooseRoundWinner(roundState, samplePlayerId)).toBeUndefined();
  });
});
