# Agurk Server
![](https://github.com/SimonMueller/agurk-server/workflows/Node%20CI/badge.svg)
[![Known Vulnerabilities](https://snyk.io/test/github/SimonMueller/agurk-server/badge.svg)](https://snyk.io/test/github/SimonMueller/agurk-server)

## Getting Started

### Start
`npm start`

### Build
`npm run build`

### Develop
`npm run watch`

### Lint
`npm run lint`

### Test
`npm test`

### Configuration

Configuration can be found in the `config/` directory. The names of the files correspond to the environment where they are loaded.
Production config can be set via environment variables specified in `custom-environment-variables.json`.
If `NODE_ENV ` is not set, a default value of `development` is used.

# Rules

1. The game is played with Bridge playing cards (52 Cards) & 3 Jokers => 55 Cards in total.
2. The minimum amount of players is 2 and the maximum is 7.
3. The player that shuffles and deals the cards in the beginning can start to play cards.
4. After the first round, where the dealer/shuffler is chosen randomly, the winner of the last round is always chosen (from now on called _Player 1_).
5. The suits of the cards are not relevant and only the rank is.
6. _Player 1_ can play any card he likes. He is allowed to play multiple cards but only if the cards are of the same rank and if one card remains in his hand.
7. Each Player has to play the same amount of cards than _Player 1_. They are only allowed to play cards that are all higher or same than the highest card that was played previously. If they are unable to play a card with a higher or same rank they have to play their lowest cards.
8. The Players are always allowed to play their lowest cards.
9. A round consists of multiple cycles where each player gets to take one turn.
10. The starting player for each cycle is the player that played the highest(most recent) card in the last cycle or in the first cycle of a round it is _Player 1_.
11. A round is played until every Player only has one card remaining.
12. After every round the remaining card is compared with the other players and the players with the highest card have to add the rank of the card to their penalty. Each player starts with a penalty of zero.
13. The player with the lowest card wins this round and is now _Player 1_ for the next one. If multiple players have the same card of the lowest rank then each player picks a card from the remaining deck and the one with the lowest card will be _Player 1_ (randomly chosen).
14. If all players have the same last card after a round, every player gets his card rank as a penalty and a random _Player 1_ is chosen for the next round.
15. If a Player reaches a penalty with a value more than 21 he is no longer allowed to play and is out of the game.
16. Every game starts with 7 cards for each player and after every round this value is decreased by one until 1 card is reached(this is like a penalty for random players). After that the amount of cards dealt starts increasing by one again.
17. The last player that is left with a penalty lower than or equal to 21 wins the game.
18. If a player leaves during a cycle, he will be removed from the game after this cycle. The cycle is finished normally by the other players.
19. If a player leaves before a cycle was started, he will be removed from the game and will not participate in any round or cycle anymore.
20. If multiple players finish with the same card and a different penalty higher than 21 the one with the lower penalty wins the game.
21. If multiple players finish with the same card and the same penalty higher than 21 the winner is chosen by random.
