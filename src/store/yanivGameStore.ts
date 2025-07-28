import {create} from 'zustand';
import {useSocket} from './socketStore';
import {
  ActionSource,
  Card,
  DirectionName,
  Location,
  Position,
  TurnAction,
} from '~/types/cards';
import {TurnState} from '~/types/turnState';
import {PlayerStatus} from '~/types/player';
import {getCardKey, getHandValue} from '~/utils/gameRules';
import {CARD_HEIGHT, CARD_SELECT_OFFSET, CARD_WIDTH} from '~/utils/constants';
import {
  calculateCardsPositions,
  calculateHiddenCardsPositions,
} from '~/utils/logic';
import {useRoomStore} from './roomStore';
import {Dimensions} from 'react-native';

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
type MainState =
  | {
      prevTurn: null;
      playerTurn: null;
      state: 'loading';
      roundResults: null;
      turnStartTime: null;
    }
  | {
      prevTurn: null;
      playerTurn: PlayerId;
      state: 'begin';
      roundResults: null;
      turnStartTime: Date;
    }
  | {
      prevTurn: TurnState;
      playerTurn: PlayerId;
      state: 'playing';
      roundResults: null;
      turnStartTime: Date;
    }
  | {
      prevTurn: null;
      playerTurn: null;
      state: 'end';
      roundResults: RoundResults;
      turnStartTime: null;
    };

type PlayerInfo = {
  playerId: PlayerId;
  roundScore: number;
  handCards: Card[];
  myTurn: boolean;
  slapDownAvailable: boolean;
};

type YanivGameFields = {
  mainState: MainState;
  // independent fields:
  round: number;
  playersStats: Record<PlayerId, PlayerStatus>;
  thisPlayer: PlayerInfo;
  pickupCards: Card[];
  playersHands: {[playerId: string]: Card[]};
  playersCardsPositions: Record<PlayerId, Position[]>;
  config: {
    players: PlayerId[];
    timePerPlayer: number;
    slapDownAllowed: boolean;
    canCallYaniv: number;
  };
  error?: string;
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
    }) => void;
    roundEnded: (data: {
      winnerId: string;
      playersStats: Record<string, PlayerStatus>;
      yanivCaller: string;
      assafCaller?: string;
      yanivCallerDelayedScore?: number;
      lowestValue: number;
      playerHands: {[playerId: string]: Card[]};
    }) => void;
    gameEnded: () => void;
    setGameError: (data: {message: string}) => void;
  };
  emit: {
    completeTurn: (action: TurnAction, selectedCards: Card[]) => void;
    callYaniv: () => void;
    slapDown: (card: Card) => void;
  };
};

type YanivGameStore = YanivGameFields & YanivGameMethods;

export type GameUI = {
  deckLocation: Location;
  pickupLocation: Location;
};

type RoundResults = {
  winnerId: string;
  playersStats: Record<PlayerId, PlayerStatus>;
  playersHands: Record<PlayerId, Card[]>;
  yanivCaller: string;
  assafCaller?: string;
};

const initialGameFields: YanivGameFields = {
  mainState: {
    state: 'loading',
    prevTurn: null,
    playerTurn: null,
    roundResults: null,
    turnStartTime: null,
  },
  playersStats: {},
  playersHands: {},
  playersCardsPositions: {},
  round: 0,
  thisPlayer: {
    playerId: '',
    roundScore: 0,
    handCards: [],
    myTurn: false,
    slapDownAvailable: false,
  },
  pickupCards: [],
  config: {
    players: [],
    timePerPlayer: 0,
    slapDownAllowed: false,
    canCallYaniv: 7,
  },
};

const {width: screenWidth, height: screenHeight} = Dimensions.get('screen');

const directions: DirectionName[] = ['up', 'right', 'down', 'left'];

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
      mainState: {turnStartTime},
      config,
    } = get();
    if (!turnStartTime) {
      return config.timePerPlayer;
    }
    const elapsed = (Date.now() - new Date(turnStartTime).getTime()) / 1000;
    const remaining = Math.max(0, config.timePerPlayer - elapsed);
    return Math.ceil(remaining);
  },
  resetSlapDown: () => {
    set(state => ({
      ...state,
      thisPlayer: {...state.thisPlayer, slapDownAvailable: false},
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
      const currentPlayerIndex = playerIds.findIndex(id => id === socketId);

      const orderedPlayers: PlayerId[] = [];
      for (let i = 0; i < playerIds.length; i++) {
        const index = (currentPlayerIndex + i) % playerIds.length;
        orderedPlayers.push(playerIds[index]);
      }

      const playersCardsPositions = directions
        .slice(0, players.length)
        .reduce<Record<PlayerId, Position[]>>((res, direction, i) => {
          const playerId = orderedPlayers[i];
          if (socketId === playerId) {
            res[playerId] = calculateCardsPositions(5, direction);
          } else {
            res[playerId] = calculateHiddenCardsPositions(5, direction);
          }
          return res;
        }, {});

      const thisPlayerHands = socketId ? playerHands[socketId] || [] : [];
      set(state => {
        return {
          ...state,
          round: 0,
          playersStats: Object.keys(playerHands).reduce<
            Record<string, PlayerStatus>
          >((res, playerId) => {
            res[playerId] = {
              score: 0,
              lost: false,
            };
            return res;
          }, {}),
          thisPlayer: {
            playerId: socketId ?? '',
            roundScore: getHandValue(thisPlayerHands),
            handCards: thisPlayerHands,
            myTurn: currentPlayerId === socketId,
            slapDownAvailable: false,
          },
          pickupCards: [data.firstCard],
          mainState: {
            state: 'begin',
            prevTurn: null,
            playerTurn: data.currentPlayerId,
            roundResults: null,
            turnStartTime: new Date(),
          },
          playersHands: data.playerHands,
          config: {
            players: orderedPlayers,
            timePerPlayer: data.gameState.timePerPlayer,
            slapDownAllowed: config?.slapDown ?? false,
            canCallYaniv: config?.canCallYaniv ?? 7,
          },
          playersCardsPositions,
        };
      });
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
        const {playerId, source, pickupCards, hands, slapDownActiveFor} = data;

        const deckPos = {
          y: screenHeight / 2 - 2 * CARD_HEIGHT,
          x: screenWidth / 2 - CARD_WIDTH * 0.5,
        };
        const pickupPos = {
          y: screenHeight / 2 + CARD_HEIGHT * 0.5,
          x: screenWidth / 2,
        };

        // ✅ קודם עדכן את המיקומים החדשים
        const playerIndex = state.config.players.indexOf(playerId);
        if (playerIndex > -1) {
          if (socketId === playerId) {
            state.playersCardsPositions[playerId] = calculateCardsPositions(
              data.amountBefore,
              directions[playerIndex],
            );
          } else {
            state.playersCardsPositions[playerId] =
              calculateHiddenCardsPositions(
                data.amountBefore,
                directions[playerIndex],
              );
          }
        }

        // ✅ אחר כך חשב cardsPositions מהמיקומים המעודכנים
        const cardsPositions =
          state.playersCardsPositions[playerId]
            ?.filter((_, i) => data.selectedCardsPositions.includes(i))
            .map(pos => ({
              x:
                pos.x -
                screenWidth / 2 +
                CARD_WIDTH / 2 +
                (CARD_WIDTH * (data.selectedCardsPositions.length - 1)) / 2,
              y:
                pos.y -
                screenHeight / 2 -
                (socketId === playerId ? CARD_SELECT_OFFSET : 0),
              deg: pos.deg,
            })) ?? [];

        let cardPosition: Position | undefined;
        let actionType: TurnState['action'] = 'DRAG_FROM_DECK';
        switch (source) {
          case 'deck': {
            cardPosition = {
              ...deckPos,
              x: deckPos.x,
              y: deckPos.y,
              deg: 0,
            };
            actionType = 'DRAG_FROM_DECK';
            break;
          }
          case 'pickup': {
            // we want to get the index of the card that is in the discard_pile
            // for accurate transition
            const pCard = data.card;
            const indexOfPickedCard = state.pickupCards.findIndex(
              card => getCardKey(card) === getCardKey(pCard),
            );
            cardPosition = {
              x:
                pickupPos.x +
                indexOfPickedCard * CARD_WIDTH -
                ((state.pickupCards.length - 1) * CARD_WIDTH) / 2,
              y: pickupPos.y - 35,
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
        const playersHands = {...state.playersHands};
        playersHands[playerId] = hands;

        const prevTurn: TurnState = {
          round: state.round,
          step: (state.mainState.prevTurn?.step ?? -1) + 1,
          playerId,
          // השלך קלפים
          discard: {
            cards: pickupCards,
            cardsPositions: cardsPositions,
            // deckPos is always the target
          },
          // משוך קלף
          draw: cardPosition && {
            card: data.card,
            cardPosition,
            // calculate the target inside the player cards
          },
          pickupCards: pickupCards,
          action: actionType,
        };

        const thisPlayer: PlayerInfo = {
          ...state.thisPlayer,
          ...(playerId === socketId
            ? {
                roundScore: getHandValue(hands),
                handCards: hands,
              }
            : {}),
          myTurn: data.currentPlayerId === socketId,
          slapDownAvailable: slapDownActiveFor === socketId,
        };

        return {
          ...state,
          playersHands,
          mainState: {
            ...state.mainState,
            state: 'playing',
            prevTurn,
            playerTurn: data.currentPlayerId,
            roundResults: null,
            turnStartTime: new Date(),
          },
          pickupCards,
          thisPlayer,
        };
      });
    },
    newRound: (data: {
      gameState: PublicGameState;
      playerHands: {[playerId: string]: Card[]};
      firstCard: Card;
      currentPlayerId: PlayerId;
    }) => {
      const socketId = useSocket.getState().getSocketId();
      const {currentPlayerId, playerHands, gameState} = data;
      const thisPlayerHands = socketId ? playerHands[socketId] || [] : [];

      set(state => {
        const playersCardsPositions = directions
          .slice(0, state.config.players.length)
          .reduce<Record<PlayerId, Position[]>>((res, direction, i) => {
            const playerId = state.config.players[i];
            if (socketId === playerId) {
              res[playerId] = calculateCardsPositions(5, direction);
            } else {
              res[playerId] = calculateHiddenCardsPositions(5, direction);
            }
            return res;
          }, {});

        return {
          ...state,
          round: state.round + 1,
          playersStats: gameState.playersStats,
          thisPlayer: {
            ...state.thisPlayer,
            roundScore: getHandValue(thisPlayerHands),
            handCards: thisPlayerHands,
            myTurn: currentPlayerId === socketId,
            slapDownAvailable: false,
          },
          pickupCards: [data.firstCard],
          mainState: {
            state: 'begin',
            prevTurn: null,
            playerTurn: data.currentPlayerId,
            roundResults: null,
            turnStartTime: new Date(),
          },
          playersHands: data.playerHands,
          playersCardsPositions,
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
    }) => {
      set(state => {
        const thisPlayer: PlayerInfo = {
          ...state.thisPlayer,
          myTurn: false,
        };

        return {
          ...state,
          mainState: {
            ...state.mainState,
            prevTurn: null,
            playerTurn: null,
            state: 'end',
            roundResults: {
              winnerId: data.winnerId,
              playersStats: data.playersStats,
              playersHands: data.playerHands,
              yanivCaller: data.yanivCaller,
              assafCaller: data.assafCaller,
            },
            turnStartTime: null,
          },
          thisPlayer,
        };
      });
    },
    gameEnded: () => {},
    setGameError: (data: {message: string}) => {
      set({error: data.message});
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
  },
}));
