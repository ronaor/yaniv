import {create} from 'zustand';
import {useSocket} from './socketStore';
import {ActionSource, Card, Position, TurnAction} from '~/types/cards';
import {TurnState} from '~/types/turnState';
import {PlayerStatus} from '~/types/player';
// import {Dimensions} from 'react-native';
import {getCardKey, getHandValue} from '~/utils/gameRules';
import {CARD_WIDTH} from '~/utils/constants';

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

type PlayerId = string;
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
  playersNumCards: Record<PlayerId, number>;
  playersCardsPositions: Record<PlayerId, Position[]>;
  config: {
    players: PlayerId[];
    timePerPlayer: number;
    slapDownAllowed: boolean;
  };
};

type YanivGameMethods = {
  setUi: (gameUi: GameUI) => void;
  updateUI: (playerId: PlayerId, playerPos: Position[]) => void;
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
  };
  emit: {
    completeTurn: (action: TurnAction, selectedCards: Card[]) => void;
    callYaniv: () => void;
    getRemainingTime: () => number;
    resetSlapDown: () => void;
    slapDown: (card: Card) => void;
    clearGame: () => void;
  };
};

type YanivGameStore = YanivGameFields & YanivGameMethods;

type GameUI = {
  deckPosition: Position;
  pickupPosition: Position;
  playersPosition: Record<string, Position>;
  playersDirection: Record<string, Position>;
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
  playersNumCards: {},
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
  },
};

// const {height: screenHeight, width: screenWidth} = Dimensions.get('screen');

export const useYanivGameStore = create<YanivGameStore>((set, get) => ({
  ...initialGameFields,
  setUi: (gameUI: GameUI) => {
    set(state => {
      return {
        ...state,
        mainState: {
          ui: gameUI,
          prevTurn: null,
          playerTurn: null,
          state: 'loading',
          roundResults: null,
          turnStartTime: null,
        },
      };
    });
  },
  updateUI: (playerId: PlayerId, playerPos: Position[]) => {
    set(state => {
      const playersCardsPositions = state.playersCardsPositions;
      playersCardsPositions[playerId] = playerPos;
      return {...state, playersCardsPositions};
    });
  },
  subscribed: {
    gameInitialized: (data: {
      gameState: PublicGameState;
      playerHands: {[playerId: string]: Card[]};
      firstCard: Card;
      currentPlayerId: PlayerId;
    }) => {
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
          playersNumCards: Object.entries(data.playerHands).reduce<
            Record<string, number>
          >((res, [playerId, cards]) => {
            res[playerId] = cards.length;
            return res;
          }, {}),
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

        const deckPos = state.mainState.ui?.deckPosition ?? {x: 0, y: 0};
        const pickupPos = state.mainState.ui?.pickupPosition ?? {x: 0, y: 0};

        // const cardsLen = data.amountBefore;
        // const centerIndex = (cardsLen - 1) / 2;
        // const cardsPositions = data.selectedCardsPositions.map(index => {
        //   const shift = index - centerIndex;
        //   const cardTrY =
        //     screenHeight + Math.pow(shift, 2) * 2 - 150 - deckPos.y;

        //   const targetX =
        //     screenWidth / 2 - (cardsLen / 2) * CARD_WIDTH + index * CARD_WIDTH - deckPos.x * 2;
        //   return {x: targetX, y: cardTrY, deg: shift * 3};
        // });

        const cardsPositions = state.playersCardsPositions[playerId].filter(
          (_, i) => data.selectedCardsPositions.includes(i),
        );

        let cardPosition: Position | undefined;
        let actionType: TurnState['action'] = 'DRAG_FROM_DECK';
        switch (source) {
          case 'deck': {
            cardPosition = deckPos;
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
              y: pickupPos.y,
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
        const playersNumCards = {...state.playersNumCards};
        playersNumCards[playerId] = hands.length;

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

        const thisPlayer: PlayerInfo =
          playerId === socketId
            ? {
                playerId,
                roundScore: getHandValue(hands),
                handCards: hands,
                slapDownAvailable: slapDownActiveFor === socketId,
                myTurn: playerId === socketId,
              }
            : {...state.thisPlayer, myTurn: false};

        return {
          ...state,
          playersNumCards,
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
          playersNumCards: Object.entries(data.playerHands).reduce<
            Record<string, number>
          >((res, [playerId, cards]) => {
            res[playerId] = cards.length;
            return res;
          }, {}),
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
  },
  emit: {
    completeTurn: (action: TurnAction, selectedCards: Card[]) => {
      useSocket.getState().emit('complete_turn', {action, selectedCards});
    },
    callYaniv: () => {
      useSocket.getState().emit('call_yaniv');
    },
    getRemainingTime: () => {
      const {
        mainState: {turnStartTime},
        config,
      } = get();
      if (!turnStartTime) {
        return 0;
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
    slapDown: (card: Card) => {
      useSocket.getState().emit('slap_down', {card});
    },
    clearGame: () => {
      set(state => ({...state, initialGameFields}));
    },
  },
}));
