import {Dimensions} from 'react-native';
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
} from '~/utils/constants';
import {getCardKey, getHandValue} from '~/utils/gameRules';
import {
  calculateAllPlayerPositions,
  calculateCardsPositions,
  calculateHiddenCardsPositions,
  createPlayerOrder,
  createPlayersData,
  generateUUID,
} from '~/utils/logic';
import {useRoomStore} from './roomStore';
import {useSocket} from './socketStore';

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
  handsPrev?: Record<PlayerId, Card[]>;
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
};

type PlayerData = {
  stats: PlayerStatus;
  hand: Card[];
  isMyTurn: boolean;
  roundScore: number;
  slapDownAvailable: boolean;
};

//#endregion

//region Board State
type BoardState = {
  pickupPile: Card[];
  discardHistory: TurnState[];
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
    }) => void;
    gameEnded: (data: {
      winnerId: string;
      finalScores: Record<string, number>;
      playersStats: Record<string, PlayerStatus>;
    }) => void;
    setGameError: (data: {message: string}) => void;
    setPlayersStatusData: (data: {
      roomId: string;
      playerId: string;
      playersStats: Record<PlayerId, PlayerStatus>;
    }) => void;
  };
  emit: {
    completeTurn: (action: TurnAction, selectedCards: Card[]) => void;
    callYaniv: () => void;
    slapDown: (card: Card) => void;
    playAgain: () => void;
  };
};

type YanivGameStore = YanivGameFields & YanivGameMethods;

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
    discardHistory: [],
  },
  roundResults: undefined,
  ui: {
    cardPositions: {},
    deckPosition: {x: 0, y: 0},
    pickupPosition: {x: 0, y: 0},
  },
};

const {width: screenWidth, height: screenHeight} = Dimensions.get('screen');

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
        y: screenHeight / 2 - 2 * CARD_HEIGHT,
        x: screenWidth / 2 - CARD_WIDTH * 0.5,
      };
      const pickupPosition = {
        y: screenHeight / 2,
        x: screenWidth / 2 - CARD_WIDTH * 0.5,
      };

      set(state => ({
        ...state,
        gameId: generateUUID(),
        game: {
          phase: 'active',
          round: 0,
          currentTurn: {
            playerId: data.currentPlayerId,
            startTime: new Date(),
            prevTurn: null,
          },
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
          discardHistory: [],
        },
        ui: {
          cardPositions,
          deckPosition,
          pickupPosition,
        },
        roundResults: undefined,
      }));
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

      set(state => {
        // Calculate discard positions from selected cards
        const playerIndex = state.players.order.indexOf(data.playerId);
        const playerPositions = state.ui.cardPositions[data.playerId] || [];

        const cardsPositions = data.selectedCardsPositions
          .map(i => playerPositions[i])
          .filter(Boolean)
          .map(pos => ({
            x:
              pos.x -
              screenWidth / 2 +
              CARD_WIDTH / 2 +
              (CARD_WIDTH * (data.selectedCardsPositions.length - 1)) / 2,
            y:
              pos.y -
              screenHeight / 2 +
              CARD_HEIGHT / 2 -
              (socketId === data.playerId ? CARD_SELECT_OFFSET : 0),
            deg: pos.deg,
          }));

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
            cardsPositions: cardsPositions,
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
              data.amountBefore,
              directions[playerIndex],
            );
          } else {
            updatedCardPositions[data.playerId] = calculateHiddenCardsPositions(
              data.amountBefore,
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
              roundScore: getHandValue(data.hands),
            };
          }

          updatedPlayers[playerId] = {
            ...updatedPlayers[playerId],
            isMyTurn: data.currentPlayerId === playerId,
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
              handsPrev: lastHands,
            },
          },
          players: {
            ...state.players,
            all: updatedPlayers,
          },
          board: {
            ...state.board,
            pickupPile: data.pickupCards,
            discardHistory: [...state.board.discardHistory, turnState],
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
            isMyTurn: data.currentPlayerId === playerId,
            slapDownAvailable: false,
            roundScore: getHandValue(newHand),
          };
        });

        return {
          ...state,
          game: {
            ...state.game,
            phase: 'active',
            round: data.round,
            currentTurn: {
              playerId: data.currentPlayerId,
              startTime: new Date(),
              prevTurn: null, // No previous turn at start of new round
              handsPrev: lastHands,
            },
            rules: {
              ...state.game.rules,
              timePerPlayer: data.gameState.timePerPlayer,
            },
          },
          players: {
            ...state.players,
            all: updatedPlayers,
          },
          board: {
            pickupPile: [data.firstCard],
            discardHistory: [],
          },
          ui: {
            ...state.ui,
            cardPositions: updatedCardPositions,
          },
          roundResults: undefined,
        };
      });
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
    }) => {
      console.log('Round Ended ,', data.playersStats, data.roundPlayers);
      set(state => {
        return {
          ...state,
          game: {
            ...state.game,
            phase: 'round-end' as GamePhase,
            currentTurn: null, // No active turn during round end
          },
          players: {
            ...state.players,
          },
          roundResults: {
            winnerId: data.winnerId,
            playersHands: data.playerHands,
            yanivCaller: data.yanivCaller,
            assafCaller: data.assafCaller,
            roundPlayers: data.roundPlayers,
            playersStats: data.playersStats,
          },
        };
      });
    },
    gameEnded: (data: {
      winnerId: string;
      finalScores: Record<string, number>;
      playersStats: Record<string, PlayerStatus>;
    }) => {
      const {playersStats} = data;
      set(state => {
        return {
          ...state,
          game: {
            ...state.game,
            phase: 'game-end' as GamePhase,
            currentTurn: null, // No active turn during game end
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
  },
}));
