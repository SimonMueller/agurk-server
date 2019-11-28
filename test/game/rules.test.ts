import {
  createJokerCard, createSuitCard, Colors, Suits, Card,
} from 'agurk-shared';
import {
  calculateCardCountToDeal,
  chooseCycleStartingPlayerId,
  chooseRoundWinner,
  isPenaltySumThresholdExceeded,
  isValidPlayerCount,
  validateTurn,
} from '../../src/game/rules';
import { samplePlayerId } from '../../src/game/dealer';
import TurnFactory from '../factories/turn';
import PlayerId from '../factories/playerId';

import { CycleState } from '../../src/types/cycle';
import { Turn } from '../../src/types/turn';
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

describe('check if valid turn', () => {
  test('first turn one card', () => {
    const turn: Turn = {
      cards: [createSuitCard(10, Suits.DIAMONDS)],
      playerId: 'someplayer',
    };
    const cycleState: CycleState = {
      turns: [],
      hands: {
        [turn.playerId]: [
          createSuitCard(10, Suits.DIAMONDS),
          createSuitCard(2, Suits.CLUBS),
          createJokerCard(Colors.RED),
        ],
      },
      outPlayers: [],
      playerIds: [turn.playerId],
    };

    expect(validateTurn(turn, cycleState).valid).toBe(true);
  });

  test('first turn same card ranks', () => {
    const turn: Turn = {
      cards: [
        createSuitCard(10, Suits.DIAMONDS),
        createSuitCard(10, Suits.SPADES),
      ],
      playerId: 'someplayer',
    };
    const cycleState: CycleState = {
      turns: [],
      hands: {
        [turn.playerId]: [
          createSuitCard(10, Suits.DIAMONDS),
          createSuitCard(10, Suits.SPADES),
          createSuitCard(2, Suits.CLUBS),
          createJokerCard(Colors.WHITE),
        ],
      },
      outPlayers: [],
      playerIds: [turn.playerId],
    };

    expect(validateTurn(turn, cycleState).valid).toBe(true);
  });

  test('first turn different card ranks', () => {
    const turn: Turn = {
      cards: [
        createSuitCard(10, Suits.DIAMONDS),
        createSuitCard(3, Suits.CLUBS),
      ],
      playerId: 'someplayer',
    };
    const cycleState: CycleState = {
      turns: [],
      hands: {
        [turn.playerId]: [
          createSuitCard(10, Suits.DIAMONDS),
          createSuitCard(3, Suits.CLUBS),
          createSuitCard(2, Suits.CLUBS),
          createJokerCard(Colors.RED),
        ],
      },
      outPlayers: [],
      playerIds: [turn.playerId],
    };

    expect(validateTurn(turn, cycleState).valid).toBe(false);
  });

  test('not first turn higher card rank', () => {
    const playerIds = PlayerId.buildList(2);
    const turn: Turn = TurnFactory.build({
      cards: [createSuitCard(13, Suits.HEARTS)],
      playerId: playerIds[0],
    });
    const cycleState: CycleState = {
      turns: [
        TurnFactory.build({
          cards: [createSuitCard(12, Suits.DIAMONDS)],
          playerId: playerIds[1],
        }),
      ],
      hands: {
        [turn.playerId]: [
          createSuitCard(13, Suits.HEARTS),
          createSuitCard(2, Suits.CLUBS),
          createJokerCard(Colors.WHITE),
        ],
      },
      outPlayers: [],
      playerIds,
    };

    expect(validateTurn(turn, cycleState).valid).toBe(true);
  });

  test('not first turn same card rank', () => {
    const turn: Turn = TurnFactory.build({
      cards: [createSuitCard(8, Suits.HEARTS)],
    });
    const cycleState: CycleState = {
      turns: [
        TurnFactory.build({
          cards: [createSuitCard(8, Suits.DIAMONDS)],
        }),
      ],
      hands: {
        [turn.playerId]: [
          createSuitCard(10, Suits.DIAMONDS),
          createSuitCard(8, Suits.HEARTS),
        ],
      },
      outPlayers: [],
      playerIds: [turn.playerId],
    };

    expect(validateTurn(turn, cycleState).valid).toBe(true);
  });

  test('not first turn lower but not lowest card rank', () => {
    const turn: Turn = TurnFactory.build({
      cards: [createSuitCard(8, Suits.HEARTS)],
    });
    const cycleState: CycleState = {
      turns: [
        TurnFactory.build({
          cards: [createJokerCard(Colors.BLACK)],
        }),
      ],
      hands: {
        [turn.playerId]: [
          createSuitCard(10, Suits.DIAMONDS),
          createSuitCard(8, Suits.HEARTS),
          createSuitCard(2, Suits.HEARTS),
        ],
      },
      outPlayers: [],
      playerIds: [turn.playerId],
    };

    expect(validateTurn(turn, cycleState).valid).toBe(false);
  });

  test('not first turn lower rank but not all lowest card ranks', () => {
    const turn: Turn = TurnFactory.build({
      cards: [
        createSuitCard(8, Suits.HEARTS),
        createSuitCard(6, Suits.DIAMONDS),
      ],
    });
    const cycleState: CycleState = {
      turns: [
        TurnFactory.build({
          cards: [
            createJokerCard(Colors.RED),
            createSuitCard(13, Suits.SPADES),
          ],
        }),
      ],
      hands: {
        [turn.playerId]: [
          createSuitCard(10, Suits.DIAMONDS),
          createSuitCard(6, Suits.DIAMONDS),
          createSuitCard(8, Suits.HEARTS),
          createSuitCard(2, Suits.HEARTS),
        ],
      },
      outPlayers: [],
      playerIds: [turn.playerId],
    };

    expect(validateTurn(turn, cycleState).valid).toBe(false);
  });

  test('not first turn all lowest card ranks', () => {
    const turn: Turn = TurnFactory.build({
      cards: [
        createSuitCard(2, Suits.HEARTS),
        createSuitCard(6, Suits.DIAMONDS),
      ],
    });
    const cycleState: CycleState = {
      turns: [
        TurnFactory.build({
          cards: [
            createJokerCard(Colors.BLACK),
            createSuitCard(13, Suits.SPADES),
          ],
        }),
      ],
      hands: {
        [turn.playerId]: [
          createSuitCard(10, Suits.DIAMONDS),
          createSuitCard(6, Suits.DIAMONDS),
          createSuitCard(8, Suits.HEARTS),
          createSuitCard(2, Suits.HEARTS),
        ],
      },
      outPlayers: [],
      playerIds: [turn.playerId],
    };

    expect(validateTurn(turn, cycleState).valid).toBe(true);
  });

  test('not first turn all higher card ranks', () => {
    const playerIds = PlayerId.buildList(3);
    const turn: Turn = TurnFactory.build({
      cards: [
        createJokerCard(Colors.BLACK),
        createSuitCard(13, Suits.DIAMONDS),
      ],
      playerId: playerIds[0],
    });
    const cycleState: CycleState = {
      turns: [
        TurnFactory.build({
          cards: [
            createSuitCard(7, Suits.HEARTS),
            createSuitCard(9, Suits.SPADES),
          ],
          playerId: playerIds[1],
        }),
        TurnFactory.build({
          cards: [
            createSuitCard(11, Suits.HEARTS),
            createSuitCard(10, Suits.SPADES),
          ],
          playerId: playerIds[2],
        }),
      ],
      hands: {
        [turn.playerId]: [
          createSuitCard(10, Suits.DIAMONDS),
          createJokerCard(Colors.BLACK),
          createSuitCard(13, Suits.DIAMONDS),
          createSuitCard(2, Suits.HEARTS),
        ],
      },
      outPlayers: [],
      playerIds,
    };

    expect(validateTurn(turn, cycleState).valid).toBe(true);
  });

  test('card not in hand', () => {
    const turn: Turn = TurnFactory.build({ cards: [createJokerCard(Colors.BLACK)] });
    const cycleState: CycleState = {
      turns: [],
      hands: {
        [turn.playerId]: [
          createSuitCard(10, Suits.DIAMONDS),
          createSuitCard(13, Suits.DIAMONDS),
        ],
      },
      outPlayers: [],
      playerIds: [turn.playerId],
    };

    expect(validateTurn(turn, cycleState).valid).toBe(false);
  });

  test('cards not in hand', () => {
    const turn: Turn = TurnFactory.build({
      cards: [
        createJokerCard(Colors.WHITE),
        createSuitCard(2, Suits.DIAMONDS),
        createSuitCard(8, Suits.SPADES),
      ],
    });
    const cycleState: CycleState = {
      turns: [],
      hands: {
        [turn.playerId]: [
          createSuitCard(10, Suits.DIAMONDS),
          createSuitCard(13, Suits.DIAMONDS),
        ],
      },
      outPlayers: [],
      playerIds: [turn.playerId],
    };

    expect(validateTurn(turn, cycleState).valid).toBe(false);
  });

  test('all but one cards in hand', () => {
    const turn: Turn = TurnFactory.build({
      cards: [
        createJokerCard(Colors.BLACK),
        createSuitCard(2, Suits.DIAMONDS),
        createSuitCard(8, Suits.SPADES),
      ],
    });
    const cycleState: CycleState = {
      turns: [],
      hands: {
        [turn.playerId]: [
          createJokerCard(Colors.BLACK),
          createSuitCard(2, Suits.DIAMONDS),
          createSuitCard(10, Suits.DIAMONDS),
          createSuitCard(13, Suits.DIAMONDS),
        ],
      },
      outPlayers: [],
      playerIds: [turn.playerId],
    };

    expect(validateTurn(turn, cycleState).valid).toBe(false);
  });

  test('empty cards played', () => {
    const turn: Turn = TurnFactory.build({ cards: [] });
    const cycleState: CycleState = {
      turns: [],
      hands: {
        [turn.playerId]: [
          createJokerCard(Colors.RED),
          createSuitCard(10, Suits.DIAMONDS),
          createSuitCard(13, Suits.DIAMONDS),
        ],
      },
      outPlayers: [],
      playerIds: [turn.playerId],
    };

    expect(validateTurn(turn, cycleState).valid).toBe(false);
  });

  test('card count not matching previous turn lower', () => {
    const playerIds = PlayerId.buildList(2);
    const turn: Turn = TurnFactory.build({
      cards: [createJokerCard(Colors.RED)],
      playerId: playerIds[0],
    });
    const cycleState: CycleState = {
      turns: [
        TurnFactory.build({
          cards: [
            createJokerCard(Colors.RED),
            createSuitCard(8, Suits.SPADES),
          ],
          playerId: playerIds[1],
        }),
      ],
      hands: {
        [turn.playerId]: [
          createJokerCard(Colors.RED),
          createSuitCard(2, Suits.DIAMONDS),
          createSuitCard(10, Suits.DIAMONDS),
          createSuitCard(13, Suits.DIAMONDS),
        ],
      },
      outPlayers: [],
      playerIds,
    };

    expect(validateTurn(turn, cycleState).valid).toBe(false);
  });

  test('card count matching previous turn', () => {
    const playerIds = PlayerId.buildList(2);
    const turn: Turn = TurnFactory.build({
      cards: [
        createSuitCard(9, Suits.HEARTS),
        createSuitCard(2, Suits.DIAMONDS),
      ],
      playerId: playerIds[0],
    });
    const cycleState: CycleState = {
      turns: [
        TurnFactory.build({
          cards: [
            createJokerCard(Colors.BLACK),
            createSuitCard(8, Suits.SPADES),
          ],
          playerId: playerIds[1],
        }),
      ],
      hands: {
        [turn.playerId]: [
          createSuitCard(9, Suits.HEARTS),
          createSuitCard(2, Suits.DIAMONDS),
          createSuitCard(10, Suits.DIAMONDS),
        ],
      },
      outPlayers: [],
      playerIds,
    };

    expect(validateTurn(turn, cycleState).valid).toBe(true);
  });

  test('card count not matching previous turn higher', () => {
    const playerIds = PlayerId.buildList(2);
    const turn: Turn = TurnFactory.build({
      cards: [
        createSuitCard(9, Suits.HEARTS),
        createSuitCard(11, Suits.CLUBS),
      ],
      playerId: playerIds[0],
    });
    const cycleState: CycleState = {
      turns: [
        TurnFactory.build({
          cards: [createJokerCard(Colors.WHITE)],
          playerId: playerIds[1],
        }),
      ],
      hands: {
        [turn.playerId]: [
          createSuitCard(9, Suits.HEARTS),
          createSuitCard(11, Suits.CLUBS),
        ],
      },
      outPlayers: [],
      playerIds,
    };

    expect(validateTurn(turn, cycleState).valid).toBe(false);
  });

  test('play any card if last available lower', () => {
    const playerIds = PlayerId.buildList(3);
    const turn: Turn = TurnFactory.build({
      cards: [createSuitCard(9, Suits.HEARTS)],
      playerId: playerIds[0],
    });
    const cycleState: CycleState = {
      turns: [
        TurnFactory.build({
          cards: [createJokerCard(Colors.BLACK)],
          playerId: playerIds[1],
        }),
        TurnFactory.build({
          cards: [createSuitCard(2, Suits.CLUBS)],
          playerId: playerIds[2],
        }),
      ],
      hands: {
        [turn.playerId]: [createSuitCard(9, Suits.HEARTS)],
      },
      outPlayers: [],
      playerIds,
    };

    expect(validateTurn(turn, cycleState).valid).toBe(true);
  });

  test('play more than one card as last turn', () => {
    const turn: Turn = TurnFactory.build({
      cards: [
        createSuitCard(12, Suits.HEARTS),
        createSuitCard(12, Suits.DIAMONDS),
      ],
    });
    const cycleState: CycleState = {
      turns: [],
      hands: {
        [turn.playerId]: [
          createSuitCard(12, Suits.HEARTS),
          createSuitCard(12, Suits.DIAMONDS),
        ],
      },
      outPlayers: [],
      playerIds: [turn.playerId],
    };

    expect(validateTurn(turn, cycleState).valid).toBe(false);
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
    const turns = [
      TurnFactory.build({ cards: [createJokerCard(Colors.BLACK)] }),
      TurnFactory.build({ cards: [createSuitCard(3, Suits.SPADES)] }),
      TurnFactory.build({ cards: [createJokerCard(Colors.RED)] }),
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
  test('no cycles in round throws', () => {
    const playerIds = PlayerId.buildList(3);
    const initialRoundState = {
      cycles: [],
      outPlayers: [],
      playerIds,
      initialHands: {},
    };

    expect(() => chooseRoundWinner(initialRoundState, samplePlayerId)).toThrow('invalid state');
  });

  test('empty lowest turns in last cycle throws', () => {
    const turns = TurnFactory.buildList(2);
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

    expect(() => chooseRoundWinner(roundState, samplePlayerId)).toThrow('cannot sample player id');
  });
});
