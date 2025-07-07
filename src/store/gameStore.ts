import {create} from 'zustand';
import {Card, getCardValue} from '~/types/cards';
import {Player, User} from '~/types/player';
import {useSocket} from './socketStore';
import {TurnAction} from 'server/cards';

export interface PublicGameState {
  currentPlayer: number;
  gameStartTime: Date;
  turnStartTime: Date;
  gameEnded: boolean;
  winner?: string;
  timePerPlayer: number;
  lastPickedCard?: Card;
  players: Player[];
}
export interface GameStore {
  // State
  playerId: string;
  publicState: PublicGameState | null;
  playerHand: Card[];
  selectedCards: number[];
  isGameActive: boolean;
  isMyTurn: boolean;
  error: string | null;
  finalScores: {[playerId: string]: number} | null;
  lastPlayedCards: Card[]; // Cards from the last player's turn
  pickupOptions: Card[];
  currentPlayerTurn?: string;
  playersScores: Record<string, number>;
  roundResults: {
    winnerId: string;
    playersScores: Record<string, number>;
    yanivCaller: string;
    assafCaller?: string;
    yanivCallerDelayedScore?: number;
    lowestValue: number;
    playerHands: {[playerId: string]: Card[]};
  } | null;

  // Actions
  completeTurn: (action: TurnAction, selectedCards: Card[]) => void;
  callYaniv: () => void;
  toggleCardSelection: (index: number) => void;
  clearSelection: () => void;
  clearError: () => void;
  getRemainingTime: () => number;
  // Event setters
  setGameInitialized: (data: {
    playersScores: Record<string, number>;
    gameState: PublicGameState;
    playerHands: {[playerId: string]: Card[]};
    firstCard: Card;
    users: User[];
  }) => void;
  setNewRound: (data: {
    playersScores: Record<string, number>;
    gameState: PublicGameState;
    playerHands: {[playerId: string]: Card[]};
    firstCard: Card;
    users: User[];
  }) => void;
  setTurnStarted: (data: {
    currentPlayerId: string;
    timeRemaining: number;
  }) => void;
  setRoundEnded: (data: {
    winnerId: string;
    playersScores: Record<string, number>;
    yanivCaller: string;
    assafCaller?: string;
    yanivCallerDelayedScore?: number;
    lowestValue: number;
    playerHands: {[playerId: string]: Card[]};
  }) => void;
  setGameEnded: (data: {
    winner: string;
    finalScores: {[playerId: string]: number};
  }) => void;
  playerDrew: (
    data: {
      playerId: string;
      hands: Card[];
      lastPlayedCards: Card[];
    } & ({source: 'deck'} | {source: 'pickup'; card: Card}),
  ) => void;
  setGameError: (data: {message: string}) => void;
}

export const getHandValue = (hand: Card[]): number => {
  return hand.reduce((sum, card) => sum + getCardValue(card), 0);
};

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  playerId: '',
  publicState: null,
  playerHand: [],
  selectedCards: [],
  isGameActive: false,
  isMyTurn: false,
  error: null,
  finalScores: null,
  lastPlayedCards: [],
  pickupOptions: [],
  showYanivCall: false,
  showAsafCall: false,
  roundResults: null,
  callers: [],
  playersScores: {},
  // Actions
  completeTurn: (action: TurnAction, selectedCards: Card[]) => {
    useSocket.getState().emit('complete_turn', {action, selectedCards});
  },

  callYaniv: () => {
    useSocket.getState().emit('call_yaniv');
  },

  toggleCardSelection: (index: number) => {
    set(state => {
      const isSelected = state.selectedCards.includes(index);

      if (isSelected) {
        return {
          selectedCards: state.selectedCards.filter(i => i !== index),
        };
      } else {
        return {
          selectedCards: [...state.selectedCards, index],
        };
      }
    });
  },

  clearSelection: () => {
    set({selectedCards: []});
  },

  clearError: () => {
    set({error: null});
  },

  getRemainingTime: () => {
    const {publicState} = get();
    if (!publicState) {
      return 0;
    }

    const elapsed =
      (Date.now() - new Date(publicState.turnStartTime).getTime()) / 1000;
    const remaining = Math.max(0, publicState.timePerPlayer - elapsed);
    return Math.ceil(remaining);
  },

  // Event setters
  setGameInitialized: (data: {
    gameState: PublicGameState;
    playerHands: {[playerId: string]: Card[]};
    firstCard: Card;
    users: User[];
  }) => {
    const socketId = useSocket.getState().getSocketId();
    set({
      playerId: socketId ?? '',
      publicState: data.gameState,
      playerHand: socketId ? data.playerHands[socketId] || [] : [],
      isGameActive: true,
      selectedCards: [],
      roundResults: null,
      lastPlayedCards: [data.firstCard],
      pickupOptions: [data.firstCard],
      playersScores: data.users.reduce<Record<string, number>>((obj, user) => {
        obj[user.id] = 0;
        return obj;
      }, {}),
    });
  },
  setNewRound: (data: {
    playersScores: Record<string, number>;
    gameState: PublicGameState;
    playerHands: {[playerId: string]: Card[]};
    firstCard: Card;
    users: User[];
  }) => {
    const socketId = useSocket.getState().getSocketId();
    set({
      publicState: data.gameState,
      playerHand: socketId ? data.playerHands[socketId] || [] : [],
      isGameActive: true,
      selectedCards: [],
      lastPlayedCards: [data.firstCard],
      pickupOptions: [data.firstCard],
      playersScores: data.playersScores,
    });
  },

  setTurnStarted: (data: {currentPlayerId: string; timeRemaining: number}) => {
    const socketId = useSocket.getState().getSocketId();
    set(state => ({
      ...state,
      currentPlayerTurn: data.currentPlayerId,
      isMyTurn: data.currentPlayerId === socketId,
      publicState: state.publicState
        ? {
            ...state.publicState,
            turnStartTime: new Date(),
          }
        : null,
    }));
  },

  setRoundEnded: (data: {
    winnerId: string;
    playersScores: Record<string, number>;
    yanivCaller: string;
    assafCaller?: string;
    yanivCallerDelayedScore?: number;
    lowestValue: number;
    playerHands: {[playerId: string]: Card[]};
  }) => {
    set({
      roundResults: data,
      isMyTurn: false,
    });
    setTimeout(() => {
      set({
        roundResults: null,
      });
    }, 3000);
  },

  setGameEnded: (data: {
    winner: string;
    finalScores: {[playerId: string]: number};
  }) => {
    set({
      finalScores: data.finalScores,
      isGameActive: false,
    });
  },

  setGameError: (data: {message: string}) => {
    set({error: data.message});
  },

  playerDrew: (
    data: {
      playerId: string;
      hands: Card[];
      lastPlayedCards: Card[];
    } & ({source: 'deck'} | {source: 'pickup'; card: Card}),
  ) => {
    set(state => {
      const socketId = useSocket.getState().getSocketId();
      const {source, playerId, hands, lastPlayedCards} = data;

      let playerHand = state.playerHand;
      let updatedPublicState = state.publicState
        ? {...state.publicState, lastPlayedCards}
        : null;
      if (playerId === socketId) {
        playerHand = hands;
      }

      if (updatedPublicState) {
        if (source === 'deck') {
          updatedPublicState.lastPickedCard = undefined;
        } else {
          updatedPublicState.lastPickedCard = data.card;
        }
      }
      return {
        ...state,
        playerHand: playerHand,
        publicState: updatedPublicState,
        lastPlayedCards,
        pickupOptions: lastPlayedCards,
      };
    });
  },
}));
