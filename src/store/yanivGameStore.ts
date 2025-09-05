import {create} from 'zustand';
import {
  ActionSource,
  Card,
  Location,
  Position,
  TurnAction,
} from '~/types/cards';
import {PlayerStatus} from '~/types/player';
import {TurnState} from '~/types/turnState';
import {
  CARD_HEIGHT,
  CARD_SELECT_OFFSET,
  CARD_WIDTH,
  directions,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
} from '~/utils/constants';
import {findInsertionIndex, getCardKey} from '~/utils/gameRules';
import {
  calculateAllPlayerPositions,
  calculateCardsPositions,
  calculateHiddenCardsPositions,
  calculateRevealCardsPositions,
  createPlayerOrder,
  createPlayersData,
  generateUUID,
} from '~/utils/logic';
import {useRoomStore} from './roomStore';
import {useSocket} from './socketStore';
import {useSoundStore} from '~/hooks/useSound';
import {POP_BIG_SOUND, THROW_CARD_SOUND} from '~/sounds';
import {isEqual} from 'lodash';

//region Server Types
interface PublicGameState {
  currentPlayer: number;
  gameStartTime: Date;
  turnStartTime: Date;
  gameEnded: boolean;
  winner?: string;
  timePerPlayer: number;
  playersStats: Record<string, PlayerStatus>;
}
//#endregion

export type PlayerId = string;

//region Game State
export type GamePhase = 'loading' | 'active' | 'round-end' | 'game-end';

type TurnInfo = {
  playerId: PlayerId;
  startTime: Date;
  prevTurn?: TurnState | null;
};

type GameRules = {
  timePerPlayer: number;
  slapDownAllowed: boolean;
  canCallYaniv: number;
  maxMatchPoints: number;
};

type GameState = {
  phase: GamePhase;
  round: number;
  playersStats: Record<PlayerId, PlayerStatus>;
  currentTurn: TurnInfo | null;
  rules: GameRules;
};
//#endregion

//region Players State
type PlayersState = {
  all: Record<PlayerId, PlayerData>;
  order: PlayerId[];
  current: PlayerId; // the viewing player
  handsPrev?: Record<PlayerId, Card[]>;
};

type PlayerData = {
  stats: PlayerStatus;
  hand: Card[];
  slapDownAvailable: boolean;
};

//#endregion

//region Board State
type CardConfig = Card & {index: number; deg: number};
export type LayerHistory = {
  layer1: CardConfig[];
  layer2: CardConfig[];
  layer3: CardConfig[];
  lastLength: number;
};

type BoardState = {
  pickupPile: Card[];
  discardHistory: TurnState[];
  layerHistory: LayerHistory;
  prevRoundPositions: {
    card: Card;
    position: Position;
    playerId: string | undefined;
  }[];
};
//#endregion

type UIState = {
  cardPositions: Record<PlayerId, Position[]>;
  deckPosition: Location;
  pickupPosition: Location;
};

type YanivGameFields = {
  game: GameState;
  players: PlayersState;
  board: BoardState;
  roundResults?: RoundResults;
  ui: UIState;
  error?: string;
  gameId: string;
  gameResults?: {
    places: PlayerId[];
  };
  humanLost: boolean;
  emojiTriggers: Record<string, {emojiIndex: number; timestamp: number}>;
};

type YanivGameMethods = {
  clearGame: () => void;
  clearError: () => void;
  resetSlapDown: () => void;
  getRemainingTime: () => number;
  subscribed: {
    gameInitialized: (data: {
      gameState: PublicGameState;
      playerHands: {[playerId: string]: Card[]};
      firstCard: Card;
      currentPlayerId: PlayerId;
      startDelay: number;
    }) => void;
    playerDrew: (data: {
      playerId: string;
      hands: Card[];
      pickupCards: Card[];
      slapDownActiveFor: string | undefined;
      source: ActionSource;
      card: Card;
      selectedCardsPositions: number[];
      amountBefore: number;
      currentPlayerId: PlayerId;
    }) => void;
    newRound: (data: {
      gameState: PublicGameState;
      playerHands: {[playerId: string]: Card[]};
      firstCard: Card;
      currentPlayerId: PlayerId;
      round: number;
      startDelay: number;
    }) => void;
    roundEnded: (data: {
      winnerId: string;
      playersStats: Record<string, PlayerStatus>;
      yanivCaller: string;
      assafCaller?: string;
      yanivCallerDelayedScore?: number;
      lowestValue: number;
      playerHands: {[playerId: string]: Card[]};
      roundPlayers: PlayerId[];
      playersRoundScore: Record<PlayerId, number[]>;
      losers: PlayerId[];
    }) => void;
    gameEnded: (data: {
      winnerId: string;
      finalScores: Record<string, number>;
      playersStats: Record<string, PlayerStatus>;
      places: PlayerId[];
    }) => void;
    setGameError: (data: {message: string}) => void;
    setPlayersStatusData: (data: {
      roomId: string;
      playerId: string;
      playersStats: Record<PlayerId, PlayerStatus>;
    }) => void;
    humanLost: () => void;
    showEmoji: (data: {emojiIndex: number; userId: PlayerId}) => void;
  };
  emit: {
    completeTurn: (action: TurnAction, selectedCards: Card[]) => void;
    callYaniv: () => void;
    slapDown: (card: Card) => void;
    playAgain: () => void;
    shareEmoji: (emojiIndex: number) => void;
  };
};

export type YanivGameStore = YanivGameFields & YanivGameMethods;

export type GameUI = {
  deckLocation: Location;
  pickupLocation: Location;
};

type RoundResults = {
  winnerId: string;
  playersHands: Record<PlayerId, Card[]>;
  yanivCaller: string;
  assafCaller?: string;
  roundPlayers: PlayerId[];
  playersStats: Record<PlayerId, PlayerStatus>;
  playersRoundScore: Record<PlayerId, number[]>;
  losers: PlayerId[];
};

const initialGameFields: YanivGameFields = {
  gameId: '',
  game: {
    phase: 'loading',
    round: 0,
    currentTurn: null,
    rules: {
      timePerPlayer: 15,
      slapDownAllowed: true,
      canCallYaniv: 7,
      maxMatchPoints: 100,
    },
    playersStats: {},
  },
  players: {
    all: {},
    order: [],
    current: '',
  },
  board: {
    pickupPile: [],
    prevRoundPositions: [],
    discardHistory: [],
    layerHistory: {
      layer1: [],
      layer2: [],
      layer3: [],
      lastLength: 0,
    },
  },
  roundResults: undefined,
  ui: {
    cardPositions: {},
    deckPosition: {x: 0, y: 0},
    pickupPosition: {x: 0, y: 0},
  },
  gameResults: undefined,
  humanLost: false,
  emojiTriggers: {},
};

export const useYanivGameStore = create<YanivGameStore>((set, get) => ({
  ...initialGameFields,
  clearGame: () => {
    set(state => ({...state, ...initialGameFields}));
  },
  clearError: () => {
    set({error: undefined});
  },
  getRemainingTime: () => {
    const {
      game: {currentTurn, rules},
    } = get();

    if (!currentTurn) {
      return rules.timePerPlayer;
    }
    const {startTime} = currentTurn;
    const elapsed = (Date.now() - new Date(startTime).getTime()) / 1000;
    const remaining = Math.max(0, rules.timePerPlayer - elapsed);
    return Math.ceil(remaining);
  },
  resetSlapDown: () => {
    set(state => ({
      ...state,
      players: {
        ...state.players,
        all: {
          ...state.players.all,
          [state.players.current]: {
            ...state.players.all[state.players.current],
            slapDownAvailable: false,
          },
        },
      },
    }));
  },
  subscribed: {
    gameInitialized: (data: {
      gameState: PublicGameState;
      playerHands: {[playerId: string]: Card[]};
      firstCard: Card;
      currentPlayerId: PlayerId;
      startDelay: number;
    }) => {
      const {config, players} = useRoomStore.getState();
      const playerIds = players.map(player => player.id);
      const {currentPlayerId, playerHands} = data;

      const socketId = `${useSocket.getState().getSocketId()}`;

      const orderedPlayers = createPlayerOrder(playerIds, socketId);

      const cardPositions = calculateAllPlayerPositions(
        orderedPlayers,
        socketId,
      );

      const playersData = createPlayersData(playerHands, currentPlayerId);

      const gameRules: GameRules = config
        ? {
            timePerPlayer: config.timePerPlayer || 15,
            slapDownAllowed: config.slapDown,
            canCallYaniv: config.canCallYaniv,
            maxMatchPoints: config.maxMatchPoints,
          }
        : {
            timePerPlayer: 15,
            slapDownAllowed: true,
            canCallYaniv: 7,
            maxMatchPoints: 100,
          };

      const deckPosition = {
        y: SCREEN_HEIGHT / 2 - 2 * CARD_HEIGHT,
        x: SCREEN_WIDTH / 2 - CARD_WIDTH * 0.5,
      };
      const pickupPosition = {
        y: SCREEN_HEIGHT / 2,
        x: SCREEN_WIDTH / 2 - CARD_WIDTH * 0.5,
      };

      set(state => ({
        ...state,
        gameId: generateUUID(),
        game: {
          phase: 'active',
          round: 0,
          currentTurn: null,
          rules: gameRules,
          playersStats: data.gameState.playersStats || {},
        },
        players: {
          all: playersData,
          order: orderedPlayers,
          current: socketId,
        },
        board: {
          pickupPile: [data.firstCard],
          prevRoundPositions: [],
          discardHistory: [],
          layerHistory: {
            layer1: [],
            layer2: [],
            layer3: [],
            lastLength: 0,
          },
        },
        ui: {
          cardPositions,
          deckPosition,
          pickupPosition,
        },
        roundResults: undefined,
        gameResults: undefined,
        humanLost: false,
      }));

      setTimeout(() => {
        set(state => ({
          ...state,
          game: {
            ...state.game,
            currentTurn: {
              playerId: data.currentPlayerId,
              startTime: new Date(),
              prevTurn: null,
            },
          },
        }));
      }, data.startDelay);
    },
    playerDrew: (data: {
      playerId: string;
      hands: Card[];
      pickupCards: Card[];
      slapDownActiveFor: string | undefined;
      source: ActionSource;
      card: Card;
      selectedCardsPositions: number[];
      amountBefore: number;
      currentPlayerId: PlayerId;
    }) => {
      const socketId = useSocket.getState().getSocketId();

      if (useSoundStore.getState().isSoundEnabled) {
        if (socketId === data.playerId) {
          POP_BIG_SOUND.play();
        }
        THROW_CARD_SOUND.play();
      }

      set(state => {
        const pickupCards = data.pickupCards;
        const lastPickupCard = data.card;
        const prevCards = state.board.pickupPile;

        let layerHistory = {...state.board.layerHistory};
        if (!isEqual(lastPickupCard, pickupCards)) {
          const currentKeys = pickupCards.map(getCardKey);
          const removedCards = prevCards.filter(
            card => !currentKeys.includes(getCardKey(card)),
          );
          if (removedCards.length > 0) {
            const newLayer: CardConfig[] = [];
            removedCards.forEach((card, i) => {
              if (
                lastPickupCard &&
                getCardKey(lastPickupCard) !== getCardKey(card)
              ) {
                newLayer.push({...card, deg: Math.random() * 40, index: i});
              }
            });
            if (newLayer.length > 0) {
              layerHistory = {
                layer3: [...layerHistory.layer2],
                layer2: [...layerHistory.layer1],
                layer1: newLayer,
                lastLength: removedCards.length,
              };
            }
          }
        }

        // Calculate discard positions from selected cards
        const playerIndex = state.players.order.indexOf(data.playerId);
        const playerPositions = state.ui.cardPositions[data.playerId] || [];

        let sourcePositions = data.selectedCardsPositions
          .map(i => playerPositions[i])
          .filter(Boolean)
          .map(pos => ({
            x: pos.x - SCREEN_WIDTH / 2 + CARD_WIDTH / 2,
            y:
              pos.y -
              SCREEN_HEIGHT / 2 +
              CARD_HEIGHT / 2 -
              (socketId === data.playerId ? CARD_SELECT_OFFSET : 0),
            deg: pos.deg,
          }));

        // Fallback if no source positions
        sourcePositions =
          sourcePositions.length > 0
            ? sourcePositions
            : [{x: 0, y: -1 * CARD_HEIGHT, deg: 0}];

        const insertionIndex = findInsertionIndex(prevCards, pickupCards);

        // Create fromTargets array - map through final cards and assign positions only to new ones
        const fromTargets = pickupCards.map((_, index) => {
          // Check if this card index corresponds to a newly added card
          const isNewCard =
            index >= insertionIndex &&
            index < insertionIndex + sourcePositions.length;
          if (isNewCard) {
            const sourceIndex = index - insertionIndex;
            return sourcePositions[sourceIndex] || sourcePositions[0];
          }
          return undefined;
        });

        // Determine card position and action type based on source
        let cardPosition: Position | undefined;
        let actionType: TurnState['action'] = 'DRAG_FROM_DECK';

        switch (data.source) {
          case 'deck': {
            cardPosition = {
              ...state.ui.deckPosition,
              deg: 0,
            };
            actionType = 'DRAG_FROM_DECK';
            break;
          }
          case 'pickup': {
            const indexOfPickedCard = state.board.pickupPile.findIndex(
              card => getCardKey(card) === getCardKey(data.card),
            );
            cardPosition = {
              x:
                state.ui.pickupPosition.x +
                indexOfPickedCard * CARD_WIDTH -
                ((state.board.pickupPile.length - 1) * CARD_WIDTH) / 2,
              y: state.ui.pickupPosition.y - 35,
              deg: 0,
            };
            actionType = 'DRAG_FROM_PICKUP';
            break;
          }
          case 'slap': {
            cardPosition = undefined;
            actionType = 'SLAP_DOWN';
            break;
          }
        }

        // Create turn state for animations and history
        const turnState: TurnState = {
          round: state.game.round,
          step: (state.game.currentTurn?.prevTurn?.step ?? -1) + 1,
          playerId: data.playerId,
          discard: {
            cards: data.pickupCards,
            cardsPositions: fromTargets,
          },
          draw: cardPosition
            ? {
                card: data.card,
                cardPosition,
              }
            : undefined,
          pickupCards: data.pickupCards,
          action: actionType,
        };

        // Update player card positions
        const updatedCardPositions = {...state.ui.cardPositions};
        if (playerIndex > -1) {
          if (socketId === data.playerId) {
            updatedCardPositions[data.playerId] = calculateCardsPositions(
              data.hands.length,
              directions[playerIndex],
            );
          } else {
            updatedCardPositions[data.playerId] = calculateHiddenCardsPositions(
              data.hands.length,
              directions[playerIndex],
            );
          }
        }

        const lastHands = Object.entries(state.players.all).reduce<
          Record<PlayerId, Card[]>
        >((res, [playerId, pConfig]) => {
          res[playerId] = pConfig.hand;
          return res;
        }, {});
        // Update all players data
        const updatedPlayers = {...state.players.all};
        Object.keys(updatedPlayers).forEach(playerId => {
          if (playerId === data.playerId) {
            updatedPlayers[playerId] = {
              ...updatedPlayers[playerId],
              hand: data.hands,
            };
          }

          updatedPlayers[playerId] = {
            ...updatedPlayers[playerId],
            slapDownAvailable: data.slapDownActiveFor === playerId,
          };
        });

        return {
          ...state,
          game: {
            ...state.game,
            phase: 'active' as GamePhase,
            currentTurn: {
              playerId: data.currentPlayerId,
              startTime: new Date(),
              prevTurn: turnState,
            },
          },
          players: {
            ...state.players,
            all: updatedPlayers,
            handsPrev: lastHands,
          },
          board: {
            ...state.board,
            pickupPile: data.pickupCards,
            discardHistory: [...state.board.discardHistory, turnState],
            layerHistory,
          },
          ui: {
            ...state.ui,
            cardPositions: updatedCardPositions,
          },
        };
      });
    },
    newRound: (data: {
      gameState: PublicGameState;
      playerHands: {[playerId: string]: Card[]};
      firstCard: Card;
      currentPlayerId: PlayerId;
      round: number;
      startDelay: number;
    }) => {
      const socketId = useSocket.getState().getSocketId();

      set(state => {
        // Reset card positions for all players with new hand size (5 cards)
        const updatedCardPositions = {...state.ui.cardPositions};
        state.players.order.forEach((playerId, index) => {
          if (socketId === playerId) {
            updatedCardPositions[playerId] = calculateCardsPositions(
              5,
              directions[index],
            );
          } else {
            updatedCardPositions[playerId] = calculateHiddenCardsPositions(
              5,
              directions[index],
            );
          }
        });

        const lastHands = Object.entries(state.players.all).reduce<
          Record<PlayerId, Card[]>
        >((res, [playerId, pConfig]) => {
          res[playerId] = pConfig.hand;
          return res;
        }, {});
        // Update all players with new hands and reset turn state
        const updatedPlayers = {...state.players.all};
        Object.keys(updatedPlayers).forEach(playerId => {
          const newHand = data.playerHands[playerId] || [];
          updatedPlayers[playerId] = {
            ...updatedPlayers[playerId],
            stats:
              data.gameState.playersStats[playerId] ||
              updatedPlayers[playerId].stats,
            hand: newHand,
            slapDownAvailable: false,
          };
        });

        const allCardsWithPositions = () => {
          // Helper to get positions for a player
          const getPlayerPositions = (
            playerId: PlayerId,
            playerIndex: number,
          ) => {
            const handLength = lastHands[playerId]?.length ?? 0;
            const direction = directions[playerIndex];

            return socketId === playerId
              ? calculateCardsPositions(handLength, direction)
              : calculateRevealCardsPositions(handLength, direction);
          };

          // Collect player cards
          const playerCardsData = state.players.order.flatMap(
            (playerId, index) => {
              const playerCards = lastHands[playerId] || [];
              const positions = getPlayerPositions(playerId, index);

              return playerCards
                .map((card, cardIndex) => ({
                  card,
                  position: positions[cardIndex],
                  playerId,
                }))
                .filter(item => item.position); // only keep cards with valid positions
            },
          );

          // Add pickup pile cards
          const totalWidth = (state.board.pickupPile.length - 1) * CARD_WIDTH;
          const startX = SCREEN_WIDTH / 2 - CARD_WIDTH * 0.5 - totalWidth / 2;

          const pickupCardsData: {
            card: Card;
            position: Position;
            playerId: string | undefined;
          }[] = state.board.pickupPile.map((card, index) => ({
            card,
            position: {
              x: startX + index * CARD_WIDTH,
              y: SCREEN_HEIGHT / 2 - 0.5 * CARD_HEIGHT,
              deg: 0,
            },
            playerId: undefined,
          }));

          return [...playerCardsData, ...pickupCardsData];
        };

        return {
          ...state,
          game: {
            ...state.game,
            phase: 'active',
            round: data.round,
            playersStats:
              state.roundResults?.playersStats ?? state.game.playersStats,
            currentTurn: null,
            rules: {
              ...state.game.rules,
              timePerPlayer: data.gameState.timePerPlayer,
            },
          },
          players: {
            ...state.players,
            all: updatedPlayers,
            handsPrev: lastHands,
          },
          board: {
            pickupPile: [data.firstCard],
            prevRoundPositions: allCardsWithPositions(),
            discardHistory: [],
            layerHistory: {
              layer1: [],
              layer2: [],
              layer3: [],
              lastLength: 0,
            },
          },
          ui: {
            ...state.ui,
            cardPositions: updatedCardPositions,
          },
          roundResults: undefined,
        };
      });
      setTimeout(() => {
        set(state => ({
          ...state,
          game: {
            ...state.game,
            currentTurn: {
              playerId: data.currentPlayerId,
              startTime: new Date(),
              prevTurn: null,
            },
          },
        }));
      }, data.startDelay);
    },
    roundEnded: (data: {
      winnerId: string;
      playersStats: Record<string, PlayerStatus>;
      yanivCaller: string;
      assafCaller?: string;
      yanivCallerDelayedScore?: number;
      lowestValue: number;
      playerHands: {[playerId: string]: Card[]};
      roundPlayers: PlayerId[];
      playersRoundScore: Record<PlayerId, number[]>;
      losers: PlayerId[];
    }) => {
      set(state => {
        return {
          ...state,
          game: {
            ...state.game,
            phase: 'round-end' as GamePhase,
            currentTurn: null,
          },
          roundResults: {
            winnerId: data.winnerId,
            playersHands: data.playerHands,
            yanivCaller: data.yanivCaller,
            assafCaller: data.assafCaller,
            roundPlayers: data.roundPlayers,
            playersStats: data.playersStats,
            playersRoundScore: data.playersRoundScore,
            losers: data.losers,
          },
        };
      });
    },
    gameEnded: data => {
      const {playersStats, places} = data;
      set(state => {
        const updatedPlayers = {...state.players.all};
        Object.keys(updatedPlayers).forEach(playerId => {
          updatedPlayers[playerId] = {
            ...updatedPlayers[playerId],
            stats:
              data.playersStats[playerId] || updatedPlayers[playerId].stats,
            hand: [],
            slapDownAvailable: false,
          };
        });
        return {
          ...state,
          players: {
            ...state.players,
            all: updatedPlayers,
          },
          game: {
            ...state.game,
            phase: 'game-end' as GamePhase,
            currentTurn: null, // No active turn during game end
            playersStats,
          },
          gameResults: {
            places,
            playersStats,
          },
        };
      });
    },
    setGameError: (data: {message: string}) => {
      set({error: data.message});
    },
    setPlayersStatusData: (data: {
      roomId: string;
      playerId: string;
      playersStats: Record<PlayerId, PlayerStatus>;
    }) => {
      const {playersStats} = data;
      set(state => {
        return {
          ...state,
          game: {
            ...state.game,
            playersStats: playersStats,
          },
        };
      });
    },
    humanLost: () => {
      set(state => ({...state, humanLost: true}));
    },
    showEmoji: ({emojiIndex, userId}) => {
      set(state => ({
        ...state,
        emojiTriggers: {
          ...state.emojiTriggers,
          [userId]: {emojiIndex, timestamp: Date.now()},
        },
      }));

      // Auto-cleanup after 3 seconds
      setTimeout(() => {
        set(state => {
          const newTriggers = {...state.emojiTriggers};
          delete newTriggers[userId];
          return {...state, emojiTriggers: newTriggers};
        });
      }, 3000);
    },
  },
  emit: {
    completeTurn: (action: TurnAction, selectedCards: Card[]) => {
      useSocket.getState().emit('complete_turn', {action, selectedCards});
    },
    callYaniv: () => {
      useSocket.getState().emit('call_yaniv');
    },
    slapDown: (card: Card) => {
      useSocket.getState().emit('slap_down', {card});
    },
    playAgain: () => {
      useSocket.getState().emit('player_wants_to_play_again');
    },
    shareEmoji: (emojiIndex: number) => {
      useSocket.getState().emit('share_emoji', {emojiIndex});
    },
  },
}));
