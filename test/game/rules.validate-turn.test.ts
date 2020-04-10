import {
  Colors, createJokerCard, createSuitCard, Suits,
} from 'agurk-shared';
import { validateTurn } from '../../src/game/rules';
import TurnFactory from '../factories/turn';
import PlayerId from '../factories/playerId';
import { CycleState } from '../../src/types/cycle';
import { Turn } from '../../src/types/turn';

describe('validate turn', () => {
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
        {
          cards: [createSuitCard(12, Suits.DIAMONDS)],
          playerId: playerIds[1],
          valid: true,
        },
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

  test('higher card rank from invalid turn isn\'t taken into account', () => {
    const playerIds = PlayerId.buildList(3);
    const turn: Turn = TurnFactory.build({
      cards: [createSuitCard(13, Suits.HEARTS)],
      playerId: playerIds[0],
    });
    const cycleState: CycleState = {
      turns: [
        {
          cards: [createSuitCard(12, Suits.DIAMONDS)],
          playerId: playerIds[1],
          valid: true,
        },
        {
          cards: [createJokerCard(Colors.RED)],
          playerId: playerIds[2],
          valid: false,
          invalidReason: 'some reason to be invalid',
        },
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
        {
          playerId: 'someplayer',
          cards: [createSuitCard(8, Suits.DIAMONDS)],
          valid: true,
        },
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
        {
          playerId: 'someplayer',
          cards: [createJokerCard(Colors.BLACK)],
          valid: true,
        },
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
        {
          playerId: 'someplayer',
          cards: [
            createJokerCard(Colors.RED),
            createSuitCard(13, Suits.SPADES),
          ],
          valid: true,
        },
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
        {
          playerId: 'someplayer',
          cards: [
            createJokerCard(Colors.BLACK),
            createSuitCard(13, Suits.SPADES),
          ],
          valid: true,
        },
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
        {
          cards: [
            createSuitCard(7, Suits.HEARTS),
            createSuitCard(9, Suits.SPADES),
          ],
          playerId: playerIds[1],
          valid: true,
        },
        {
          cards: [
            createSuitCard(11, Suits.HEARTS),
            createSuitCard(10, Suits.SPADES),
          ],
          playerId: playerIds[2],
          valid: true,
        },
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
        {
          cards: [
            createJokerCard(Colors.RED),
            createSuitCard(8, Suits.SPADES),
          ],
          playerId: playerIds[1],
          valid: true,
        },
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
        {
          cards: [
            createJokerCard(Colors.BLACK),
            createSuitCard(8, Suits.SPADES),
          ],
          playerId: playerIds[1],
          valid: true,
        },
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
        {
          cards: [createJokerCard(Colors.WHITE)],
          playerId: playerIds[1],
          valid: true,
        },
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
        {
          cards: [createJokerCard(Colors.BLACK)],
          playerId: playerIds[1],
          valid: true,
        },
        {
          cards: [createSuitCard(2, Suits.CLUBS)],
          playerId: playerIds[2],
          valid: true,
        },
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
