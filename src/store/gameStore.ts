import {create} from 'zustand';
import {Card, getCardValue} from '~/types/cards';
import {useSocket} from './socketStore';
import {TurnAction} from 'server/cards';
import {PlayerStatus} from '~/types/player';

export interface PublicGameState {
  currentPlayer: number;
  gameStartTime: Date;
  turnStartTime: Date;
  gameEnded: boolean;
  winner?: string;
  timePerPlayer: number;
  playersStats: Record<string, PlayerStatus>;
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
  pickupCards: Card[]; // Cards from the last player's turn
  currentPlayerTurn?: string;
  slapDownAvailable: boolean;
  lastPickedCard?: Card;
  roundResults: {
    winnerId: string;
    playersStats: Record<string, PlayerStatus>;
    yanivCaller: string;
    assafCaller?: string;
    yanivCallerDelayedScore?: number;
    lowestValue: number;
    playerHands: {[playerId: string]: Card[]};
  } | null;

  // Actions
  completeTurn: (action: TurnAction, selectedCards: Card[]) => void;
  callYaniv: () => void;
  clearError: () => void;
  getRemainingTime: () => number;
  // Event setters
  setGameInitialized: (data: {
    gameState: PublicGameState;
    playerHands: {[playerId: string]: Card[]};
    firstCard: Card;
  }) => void;
  setNewRound: (data: {
    gameState: PublicGameState;
    playerHands: {[playerId: string]: Card[]};
    firstCard: Card;
  }) => void;
  setTurnStarted: (data: {
    currentPlayerId: string;
    timeRemaining: number;
  }) => void;
  setRoundEnded: (data: {
    winnerId: string;
    playersStats: Record<string, PlayerStatus>;
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
  playerDrew: (data: {
    playerId: string;
    hands: Card[];
    pickupCards: Card[];
    slapDownActiveFor: string | undefined;
    source: 'pickup' | 'deck';
    card: Card;
    isSlappedDown: boolean;
  }) => void;
  slapDown: (card: Card) => void;
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
  pickupCards: [],
  showYanivCall: false,
  showAsafCall: false,
  roundResults: null,
  callers: [],
  playersStats: {},
  slapDownAvailable: false,
  // Actions
  completeTurn: (action: TurnAction, selectedCards: Card[]) => {
    useSocket.getState().emit('complete_turn', {action, selectedCards});
  },

  callYaniv: () => {
    useSocket.getState().emit('call_yaniv');
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
  }) => {
    const socketId = useSocket.getState().getSocketId();
    set({
      playerId: socketId ?? '',
      publicState: data.gameState,
      playerHand: socketId ? data.playerHands[socketId] || [] : [],
      isGameActive: true,
      selectedCards: [],
      roundResults: null,
      pickupCards: [data.firstCard],
    });
  },
  setNewRound: (data: {
    gameState: PublicGameState;
    playerHands: {[playerId: string]: Card[]};
    firstCard: Card;
  }) => {
    const socketId = useSocket.getState().getSocketId();
    set({
      publicState: data.gameState,
      playerHand: socketId ? data.playerHands[socketId] || [] : [],
      isGameActive: true,
      selectedCards: [],
      pickupCards: [data.firstCard],
      roundResults: null,
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
    playersStats: Record<string, PlayerStatus>;
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
  slapDown: (card: Card) => {
    useSocket.getState().emit('slap_down', {card});
  },
  playerDrew: (data: {
    playerId: string;
    hands: Card[];
    pickupCards: Card[];
    slapDownActiveFor: string | undefined;
    source: 'pickup' | 'deck'; // different animation for each source
    card: Card;
    isSlappedDown: boolean;
  }) => {
    set(state => {
      const socketId = useSocket.getState().getSocketId();
      const {playerId, hands, pickupCards, slapDownActiveFor, isSlappedDown} =
        data;

      let playerHand = state.playerHand;
      let updatedPublicState = state.publicState
        ? {...state.publicState, pickupCards}
        : null;
      if (playerId === socketId) {
        playerHand = hands;
      }

      return {
        ...state,
        playerHand: playerHand,
        publicState: updatedPublicState,
        pickupCards,
        slapDownAvailable: slapDownActiveFor === socketId,
        isSlapDown: isSlappedDown, // when updating state do it with an effect of slap-down
        lastPickedCard: data.card,
      };
    });
  },
}));
