import {create} from 'zustand';
import {useSocket} from './socketStore';
import {Card, getCardValue} from '~/types/cards';
import {Player, User} from '~/types/player';

export interface PublicGameState {
  currentPlayer: number;
  cardsInDeck: number;
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
  completeTurn: (
    choice: 'deck' | 'pickup',
    selectedCards: Card[],
    pickupIndex?: number,
  ) => void;
  callYaniv: () => void;
  toggleCardSelection: (index: number) => void;
  clearSelection: () => void;
  clearError: () => void;
  getRemainingTime: () => number;
  // Event setters
  setGameInitialized: (data: {
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
    } & (
      | {source: 'deck'; cardsInDeck: number}
      | {source: 'pickup'; card: Card}
    ),
  ) => void;
  setGameError: (data: {message: string}) => void;
}

export const getHandValue = (hand: Card[]): number => {
  return hand.reduce((sum, card) => sum + getCardValue(card), 0);
};

// Helper function to get pickup options based on last played cards
const getPickupOptions = (cards: Card[]): Card[] => {
  if (cards.length === 0) {
    return [];
  }

  // Single card - can pick it up
  if (cards.length === 1) {
    return [cards[0]];
  }

  // Check if it's a set (same value)
  const isSet = cards.every(card => card.value === cards[0].value);
  if (isSet) {
    return [...cards];
  }

  // Check if it's a sequence (consecutive values)
  const sortedCards = [...cards].sort((a, b) => a.value - b.value);
  const isSequence = sortedCards.every((card, index) => {
    if (index === 0) {
      return true;
    }
    return card.value === sortedCards[index - 1].value + 1;
  });

  if (isSequence) {
    // Sequence - can only pick first or last card
    return [sortedCards[0], sortedCards[sortedCards.length - 1]];
  }

  return [];
};

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
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
  completeTurn: (
    choice: 'deck' | 'pickup',
    selectedCards: Card[],
    pickupIndex?: number,
  ) => {
    useSocket
      .getState()
      .emit('complete_turn', {choice, selectedCards, pickupIndex});
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
    } & (
      | {source: 'deck'; cardsInDeck: number}
      | {source: 'pickup'; card: Card}
    ),
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
          updatedPublicState.cardsInDeck = data.cardsInDeck;
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
        pickupOptions: getPickupOptions(lastPlayedCards),
      };
    });
  },
}));
