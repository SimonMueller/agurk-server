import {
  calculateCardCountToDeal,
  chooseCycleStartingPlayerId,
  chooseRoundWinner,
  isPenaltySumThresholdExceeded,
  isValidPlayerCount,
  validateTurn,
} from '../../../server/game/rules';
import { samplePlayerId } from '../../../server/game/dealer';
import TurnFactory from '../../factories/turn';
import PlayerId from '../../factories/playerId';
import {
  createJokerCard, createSuitCard, Color, Suit,
} from '../../../shared/game/card';
import { CycleState } from '../../../server/types/cycle';
import { Turn } from '../../../server/types/turn';
import { RoundState } from '../../../server/types/round';
import { Card } from '../../../shared/types/card';

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
      createSuitCard(14, Suit.HEARTS),
      createJokerCard(Color.WHITE),
    ];

    expect(isPenaltySumThresholdExceeded(penaltyCards)).toBe(true);
  });

  test('less than 21', () => {
    const penaltyCards: Card[] = [createSuitCard(14, Suit.DIAMONDS)];

    expect(isPenaltySumThresholdExceeded(penaltyCards)).toBe(false);
  });

  test('empty array', () => {
    const penaltyCards: Card[] = [];

    expect(isPenaltySumThresholdExceeded(penaltyCards)).toBe(false);
  });

  test('exactly 21', () => {
    const penaltyCards: Card[] = [
      createSuitCard(14, Suit.DIAMONDS),
      createSuitCard(7, Suit.SPADES),
    ];

    expect(isPenaltySumThresholdExceeded(penaltyCards)).toBe(false);
  });
});

describe('check if valid turn', () => {
  test('first turn one card', () => {
    const turn: Turn = {
      cards: [createSuitCard(10, Suit.DIAMONDS)],
      playerId: 'someplayer',
    };
    const cycleState: CycleState = {
      turns: [],
      hands: {
        [turn.playerId]: [
          createSuitCard(10, Suit.DIAMONDS),
          createSuitCard(2, Suit.CLUBS),
          createJokerCard(Color.RED),
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
        createSuitCard(10, Suit.DIAMONDS),
        createSuitCard(10, Suit.SPADES),
      ],
      playerId: 'someplayer',
    };
    const cycleState: CycleState = {
      turns: [],
      hands: {
        [turn.playerId]: [
          createSuitCard(10, Suit.DIAMONDS),
          createSuitCard(10, Suit.SPADES),
          createSuitCard(2, Suit.CLUBS),
          createJokerCard(Color.WHITE),
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
        createSuitCard(10, Suit.DIAMONDS),
        createSuitCard(3, Suit.CLUBS),
      ],
      playerId: 'someplayer',
    };
    const cycleState: CycleState = {
      turns: [],
      hands: {
        [turn.playerId]: [
          createSuitCard(10, Suit.DIAMONDS),
          createSuitCard(3, Suit.CLUBS),
          createSuitCard(2, Suit.CLUBS),
          createJokerCard(Color.RED),
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
      cards: [createSuitCard(13, Suit.HEARTS)],
      playerId: playerIds[0],
    });
    const cycleState: CycleState = {
      turns: [
        TurnFactory.build({
          cards: [createSuitCard(12, Suit.DIAMONDS)],
          playerId: playerIds[1],
        }),
      ],
      hands: {
        [turn.playerId]: [
          createSuitCard(13, Suit.HEARTS),
          createSuitCard(2, Suit.CLUBS),
          createJokerCard(Color.WHITE),
        ],
      },
      outPlayers: [],
      playerIds,
    };

    expect(validateTurn(turn, cycleState).valid).toBe(true);
  });

  test('not first turn same card rank', () => {
    const turn: Turn = TurnFactory.build({
      cards: [createSuitCard(8, Suit.HEARTS)],
    });
    const cycleState: CycleState = {
      turns: [
        TurnFactory.build({
          cards: [createSuitCard(8, Suit.DIAMONDS)],
        }),
      ],
      hands: {
        [turn.playerId]: [
          createSuitCard(10, Suit.DIAMONDS),
          createSuitCard(8, Suit.HEARTS),
        ],
      },
      outPlayers: [],
      playerIds: [turn.playerId],
    };

    expect(validateTurn(turn, cycleState).valid).toBe(true);
  });

  test('not first turn lower but not lowest card rank', () => {
    const turn: Turn = TurnFactory.build({
      cards: [createSuitCard(8, Suit.HEARTS)],
    });
    const cycleState: CycleState = {
      turns: [
        TurnFactory.build({
          cards: [createJokerCard(Color.BLACK)],
        }),
      ],
      hands: {
        [turn.playerId]: [
          createSuitCard(10, Suit.DIAMONDS),
          createSuitCard(8, Suit.HEARTS),
          createSuitCard(2, Suit.HEARTS),
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
        createSuitCard(8, Suit.HEARTS),
        createSuitCard(6, Suit.DIAMONDS),
      ],
    });
    const cycleState: CycleState = {
      turns: [
        TurnFactory.build({
          cards: [
            createJokerCard(Color.RED),
            createSuitCard(13, Suit.SPADES),
          ],
        }),
      ],
      hands: {
        [turn.playerId]: [
          createSuitCard(10, Suit.DIAMONDS),
          createSuitCard(6, Suit.DIAMONDS),
          createSuitCard(8, Suit.HEARTS),
          createSuitCard(2, Suit.HEARTS),
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
        createSuitCard(2, Suit.HEARTS),
        createSuitCard(6, Suit.DIAMONDS),
      ],
    });
    const cycleState: CycleState = {
      turns: [
        TurnFactory.build({
          cards: [
            createJokerCard(Color.BLACK),
            createSuitCard(13, Suit.SPADES),
          ],
        }),
      ],
      hands: {
        [turn.playerId]: [
          createSuitCard(10, Suit.DIAMONDS),
          createSuitCard(6, Suit.DIAMONDS),
          createSuitCard(8, Suit.HEARTS),
          createSuitCard(2, Suit.HEARTS),
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
        createJokerCard(Color.BLACK),
        createSuitCard(13, Suit.DIAMONDS),
      ],
      playerId: playerIds[0],
    });
    const cycleState: CycleState = {
      turns: [
        TurnFactory.build({
          cards: [
            createSuitCard(7, Suit.HEARTS),
            createSuitCard(9, Suit.SPADES),
          ],
          playerId: playerIds[1],
        }),
        TurnFactory.build({
          cards: [
            createSuitCard(11, Suit.HEARTS),
            createSuitCard(10, Suit.SPADES),
          ],
          playerId: playerIds[2],
        }),
      ],
      hands: {
        [turn.playerId]: [
          createSuitCard(10, Suit.DIAMONDS),
          createJokerCard(Color.BLACK),
          createSuitCard(13, Suit.DIAMONDS),
          createSuitCard(2, Suit.HEARTS),
        ],
      },
      outPlayers: [],
      playerIds,
    };

    expect(validateTurn(turn, cycleState).valid).toBe(true);
  });

  test('card not in hand', () => {
    const turn: Turn = TurnFactory.build({ cards: [createJokerCard(Color.BLACK)] });
    const cycleState: CycleState = {
      turns: [],
      hands: {
        [turn.playerId]: [
          createSuitCard(10, Suit.DIAMONDS),
          createSuitCard(13, Suit.DIAMONDS),
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
        createJokerCard(Color.WHITE),
        createSuitCard(2, Suit.DIAMONDS),
        createSuitCard(8, Suit.SPADES),
      ],
    });
    const cycleState: CycleState = {
      turns: [],
      hands: {
        [turn.playerId]: [
          createSuitCard(10, Suit.DIAMONDS),
          createSuitCard(13, Suit.DIAMONDS),
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
        createJokerCard(Color.BLACK),
        createSuitCard(2, Suit.DIAMONDS),
        createSuitCard(8, Suit.SPADES),
      ],
    });
    const cycleState: CycleState = {
      turns: [],
      hands: {
        [turn.playerId]: [
          createJokerCard(Color.BLACK),
          createSuitCard(2, Suit.DIAMONDS),
          createSuitCard(10, Suit.DIAMONDS),
          createSuitCard(13, Suit.DIAMONDS),
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
          createJokerCard(Color.RED),
          createSuitCard(10, Suit.DIAMONDS),
          createSuitCard(13, Suit.DIAMONDS),
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
      cards: [createJokerCard(Color.RED)],
      playerId: playerIds[0],
    });
    const cycleState: CycleState = {
      turns: [
        TurnFactory.build({
          cards: [
            createJokerCard(Color.RED),
            createSuitCard(8, Suit.SPADES),
          ],
          playerId: playerIds[1],
        }),
      ],
      hands: {
        [turn.playerId]: [
          createJokerCard(Color.RED),
          createSuitCard(2, Suit.DIAMONDS),
          createSuitCard(10, Suit.DIAMONDS),
          createSuitCard(13, Suit.DIAMONDS),
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
        createSuitCard(9, Suit.HEARTS),
        createSuitCard(2, Suit.DIAMONDS),
      ],
      playerId: playerIds[0],
    });
    const cycleState: CycleState = {
      turns: [
        TurnFactory.build({
          cards: [
            createJokerCard(Color.BLACK),
            createSuitCard(8, Suit.SPADES),
          ],
          playerId: playerIds[1],
        }),
      ],
      hands: {
        [turn.playerId]: [
          createSuitCard(9, Suit.HEARTS),
          createSuitCard(2, Suit.DIAMONDS),
          createSuitCard(10, Suit.DIAMONDS),
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
        createSuitCard(9, Suit.HEARTS),
        createSuitCard(11, Suit.CLUBS),
      ],
      playerId: playerIds[0],
    });
    const cycleState: CycleState = {
      turns: [
        TurnFactory.build({
          cards: [createJokerCard(Color.WHITE)],
          playerId: playerIds[1],
        }),
      ],
      hands: {
        [turn.playerId]: [
          createSuitCard(9, Suit.HEARTS),
          createSuitCard(11, Suit.CLUBS),
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
      cards: [createSuitCard(9, Suit.HEARTS)],
      playerId: playerIds[0],
    });
    const cycleState: CycleState = {
      turns: [
        TurnFactory.build({
          cards: [createJokerCard(Color.BLACK)],
          playerId: playerIds[1],
        }),
        TurnFactory.build({
          cards: [createSuitCard(2, Suit.CLUBS)],
          playerId: playerIds[2],
        }),
      ],
      hands: {
        [turn.playerId]: [createSuitCard(9, Suit.HEARTS)],
      },
      outPlayers: [],
      playerIds,
    };

    expect(validateTurn(turn, cycleState).valid).toBe(true);
  });

  test('play more than one card as last turn', () => {
    const turn: Turn = TurnFactory.build({
      cards: [
        createSuitCard(12, Suit.HEARTS),
        createSuitCard(12, Suit.DIAMONDS),
      ],
    });
    const cycleState: CycleState = {
      turns: [],
      hands: {
        [turn.playerId]: [
          createSuitCard(12, Suit.HEARTS),
          createSuitCard(12, Suit.DIAMONDS),
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
        [playerIds[0]]: [createSuitCard(10, Suit.CLUBS)],
        [playerIds[1]]: [createSuitCard(5, Suit.DIAMONDS)],
        [playerIds[2]]: [createSuitCard(8, Suit.SPADES)],
      },
    };

    expect(chooseCycleStartingPlayerId(roundState)).toBe(playerIds[0]);
  });

  test('latest highest turn player is starting player', () => {
    const turns = [
      TurnFactory.build({ cards: [createJokerCard(Color.BLACK)] }),
      TurnFactory.build({ cards: [createSuitCard(3, Suit.SPADES)] }),
      TurnFactory.build({ cards: [createJokerCard(Color.RED)] }),
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
