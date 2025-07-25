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
import {CARD_WIDTH} from '~/utils/constants';
import {calculateCardsPositions} from '~/utils/logic';
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
      ui: GameUI | null;
      prevTurn: null;
      playerTurn: null;
      state: 'loading';
      roundResults: null;
      turnStartTime: null;
    }
  | {
      ui: GameUI;
      prevTurn: null;
      playerTurn: PlayerId;
      state: 'begin';
      roundResults: null;
      turnStartTime: Date;
    }
  | {
      ui: GameUI;
      prevTurn: TurnState;
      playerTurn: PlayerId;
      state: 'playing';
      roundResults: null;
      turnStartTime: Date;
    }
  | {
      ui: GameUI;
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
  setUI: (gameUI: GameUI, players: PlayerId[]) => void;
  // updateUI: (playerId: PlayerId, playerPos: Position[]) => void;
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
    ui: null,
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
// const {height: windowHeight, width: windowWidth} = Dimensions.get('window');
const directions: DirectionName[] = ['up', 'right', 'down', 'left'];

export const useYanivGameStore = create<YanivGameStore>((set, get) => ({
  ...initialGameFields,
  setUI: (gameUI: GameUI, players: PlayerId[]) => {
    const socketId = `${useSocket.getState().getSocketId()}`;
    const orderedPlayers = [
      socketId,
      ...players.filter(playerId => playerId !== socketId),
    ];
    const playersCardsPositions = directions
      .slice(0, players.length)
      .reduce<Record<PlayerId, Position[]>>((res, direction, i) => {
        const playerId = orderedPlayers[i];
        res[playerId] = calculateCardsPositions(5, direction);
        return res;
      }, {});

    set(state => {
      return {
        ...state,
        mainState: {
          ...state.mainState,
          ui: gameUI,
        },
        config: {
          ...state.config,
          players: orderedPlayers,
        },
        playersCardsPositions,
      };
    });
  },
  // updateUI: (playerId: PlayerId, playerPos: Position[]) => {
  //   set(state => {
  //     const playersCardsPositions = state.playersCardsPositions;
  //     playersCardsPositions[playerId] = playerPos;
  //     return {...state, playersCardsPositions};
  //   });
  // },
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
      const {config} = useRoomStore.getState();
      const {currentPlayerId, playerHands} = data;
      const socketId = useSocket.getState().getSocketId();
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
            ui: state.mainState.ui!!,
            prevTurn: null,
            playerTurn: data.currentPlayerId,
            roundResults: null,
            turnStartTime: new Date(),
          },
          playersHands: data.playerHands,
          config: {
            players: Object.keys(playerHands),
            timePerPlayer: data.gameState.timePerPlayer,
            slapDownAllowed: config?.slapDown ?? false,
            canCallYaniv: config?.canCallYaniv ?? 7,
          },
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

        const deckPos = state.mainState.ui?.deckLocation ?? {
          x: 0,
          y: 0,
        };
        const pickupPos = state.mainState.ui?.pickupLocation ?? {
          x: 0,
          y: 0,
        };

        const cardsPositions =
          state.playersCardsPositions[playerId]
            ?.filter((_, i) => data.selectedCardsPositions.includes(i))
            .map(pos => ({
              x: pos.x - screenWidth / 2 + 35,
              y: pos.y - screenHeight / 2 - 45,
              deg: pos.deg,
            })) ?? [];

        const playerIndex = state.config.players.indexOf(playerId);
        if (playerIndex > -1) {
          state.playersCardsPositions[playerId] = calculateCardsPositions(
            data.amountBefore,
            directions[playerIndex],
          );
        }
        let cardPosition: Position | undefined;
        let actionType: TurnState['action'] = 'DRAG_FROM_DECK';
        switch (source) {
          case 'deck': {
            cardPosition = {
              ...deckPos,
              x: deckPos.x + 2,
              y: deckPos.y - 41,
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
              x: pickupPos.x + indexOfPickedCard * CARD_WIDTH,
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
            ui: state.mainState.ui!!,
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
            res[playerId] = calculateCardsPositions(5, direction);
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
            ui: state.mainState.ui!!,
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
            ui: state.mainState.ui!!,
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
