import {create} from 'zustand';
import {useSocket} from './socketStore';
import {useUser} from './userStore';

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: number; // 1-13 (1=Ace, 11=Jack, 12=Queen, 13=King)
  isJoker?: boolean;
}

export interface PublicGameState {
  currentPlayer: number;
  cardsInDeck: number;
  gameStartTime: Date;
  turnStartTime: Date;
  gameEnded: boolean;
  winner?: string;
  timePerPlayer: number;
  waitingForDraw: boolean;
  lastPickedCard?: Card;
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
  showYanivCall: boolean;
  showAsafCall: boolean;
  roundResults: {
    yanivCaller: string;
    yanivCallerValue: number;
    handValues: {[playerId: string]: number};
    hasAsaf: boolean;
    asafPlayers: string[];
    lowestValue: number;
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
  getCardValue: (card: Card) => number;
  getHandValue: (hand: Card[]) => number;
  isValidPlay: (cards: Card[]) => boolean;
  canCallYaniv: () => boolean;
  getRemainingTime: () => number;

  // Event setters
  setGameInitialized: (data: {
    gameState: PublicGameState;
    playerHands: {[playerId: string]: Card[]};
    firstCard: Card;
  }) => void;
  setTurnStarted: (data: {
    currentPlayerId: string;
    timeRemaining: number;
  }) => void;
  setCardsPlayed: (data: {
    playerId: string;
    cards: Card[];
    remainingCards: number;
  }) => void;
  setWaitingForDraw: (data: {
    canDrawDeck: boolean;
    pickupOptions: Card[];
  }) => void;
  setCardDrawn: (data: {card: Card; source: 'deck' | 'pickup'}) => void;
  setRoundEnded: (data: {
    yanivCaller: string;
    yanivCallerValue: number;
    handValues: {[playerId: string]: number};
    hasAsaf: boolean;
    asafPlayers: string[];
    lowestValue: number;
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

// Helper function to get pickup options based on last played cards
const getPickupOptions = (cards: Card[]): Card[] => {
  if (cards.length === 0) return [];

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
    if (index === 0) return true;
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
    const {canCallYaniv} = get();
    if (!canCallYaniv()) {
      set({error: 'לא ניתן לקרוא יניב! יש לך יותר מ-7 נקודות.'});
      return;
    }

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

  getCardValue: (card: Card) => {
    if (card.isJoker) return 0;
    if (card.value === 1) return 1; // Ace = 1
    if (card.value >= 11) return 10; // J, Q, K = 10
    return card.value; // 2-10 = face value
  },

  getHandValue: (hand: Card[]) => {
    const {getCardValue} = get();
    return hand.reduce((sum, card) => sum + getCardValue(card), 0);
  },

  isValidPlay: (cards: Card[]) => {
    if (cards.length === 0) return false;
    if (cards.length === 1) return true;

    // Check if it's a valid set (same value)
    const isValidSet = () => {
      if (cards.length < 2) return false;
      const nonJokers = cards.filter(c => !c.isJoker);
      if (nonJokers.length === 0) return false;
      const targetValue = nonJokers[0].value;
      return nonJokers.every(card => card.value === targetValue);
    };

    // Check if it's a valid sequence (consecutive same suit)
    const isValidSequence = () => {
      if (cards.length < 3) return false;
      const realCards = cards.filter(c => !c.isJoker);
      const jokerCount = cards.length - realCards.length;

      if (realCards.length === 0) return false;

      // All real cards must be same suit
      const suit = realCards[0].suit;
      if (!realCards.every(card => card.suit === suit)) return false;

      // Sort real cards by value
      const sortedValues = realCards.map(c => c.value).sort((a, b) => a - b);

      // Check if sequence is possible with jokers
      let gapsNeeded = 0;
      for (let i = 0; i < sortedValues.length - 1; i++) {
        gapsNeeded += sortedValues[i + 1] - sortedValues[i] - 1;
      }

      return gapsNeeded <= jokerCount;
    };

    return isValidSet() || isValidSequence();
  },

  canCallYaniv: () => {
    const {playerHand, getHandValue, publicState} = get();
    if (!publicState || publicState.waitingForDraw) return false;
    return getHandValue(playerHand) <= 7;
  },

  getRemainingTime: () => {
    const {publicState} = get();
    if (!publicState) return 0;

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
      publicState: data.gameState,
      playerHand: socketId ? data.playerHands[socketId] || [] : [],
      isGameActive: true,
      selectedCards: [],
      showYanivCall: false,
      showAsafCall: false,
      roundResults: null,
      lastPlayedCards: [data.firstCard],
      pickupOptions: [data.firstCard],
    });
  },

  setTurnStarted: (data: {currentPlayerId: string; timeRemaining: number}) => {
    const socketId = useSocket.getState().getSocketId();
    set(state => ({
      ...state,
      isMyTurn: data.currentPlayerId === socketId,
      publicState: state.publicState
        ? {
            ...state.publicState,
            turnStartTime: new Date(),
          }
        : null,
    }));
  },

  setCardsPlayed: (data: {
    playerId: string;
    cards: Card[];
    remainingCards: number;
  }) => {
    set(state => {
      const {playerId, cards} = data;
      const currentUserId = useUser.getState().name; // Using name as ID for now

      return {
        ...state,
        lastPlayedCards: [...cards],
        selectedCards: playerId === currentUserId ? [] : state.selectedCards,
      };
    });
  },

  setWaitingForDraw: (data: {canDrawDeck: boolean; pickupOptions: Card[]}) => {
    set({
      pickupOptions: data.pickupOptions,
    });
  },

  setCardDrawn: (data: {card: Card; source: 'deck' | 'pickup'}) => {
    set(state => ({
      ...state,
      playerHand: [...state.playerHand, data.card],
      selectedCards: [],
      pickupOptions: [],
    }));
  },

  setRoundEnded: (data: {
    yanivCaller: string;
    yanivCallerValue: number;
    handValues: {[playerId: string]: number};
    hasAsaf: boolean;
    asafPlayers: string[];
    lowestValue: number;
  }) => {
    set({
      roundResults: data,
      showYanivCall: true,
      showAsafCall: data.hasAsaf,
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
