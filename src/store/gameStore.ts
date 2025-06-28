import {create, StateCreator} from 'zustand';
import socket from '../socket';

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: number; // 1-13 (1=Ace, 11=Jack, 12=Queen, 13=King)
}

export interface PublicGameState {
  currentPlayer: number;
  discardPile: Card[];
  cardsInDeck: number;
  gameStartTime: Date;
  turnStartTime: Date;
  gameEnded: boolean;
  winner?: string;
}

export interface GameState {
  // Game state
  publicState: PublicGameState | null;
  playerHand: Card[];
  currentPlayerId: string | null;
  timeRemaining: number;

  // UI state
  isMyTurn: boolean;
  selectedCards: number[];
  isLoading: boolean;
  error: string | null;

  // Game status
  isGameActive: boolean;
  finalScores: {[playerId: string]: number} | null;
}

interface GameStore extends GameState {
  // Game actions
  drawCard: () => void;
  playCards: (cardIndices: number[]) => void;
  callYaniv: () => void;

  // Card selection
  toggleCardSelection: (index: number) => void;
  clearSelection: () => void;

  // State management
  clearError: () => void;
  resetGame: () => void;

  // Internal methods
  setPlayerHand: (hand: Card[]) => void;
  setPublicState: (state: PublicGameState) => void;
}

const initialState: GameState = {
  publicState: null,
  playerHand: [],
  currentPlayerId: null,
  timeRemaining: 0,
  isMyTurn: false,
  selectedCards: [],
  isLoading: false,
  error: null,
  isGameActive: false,
  finalScores: null,
};

export const useGameStore = create<GameStore>(((set: any, get: any) => {
  // Register socket listeners once
  if (!(socket as any)._yanivGameListenersRegistered) {
    socket.on('game_initialized', ({gameState, playerHands}) => {
      const myId = socket.id;
      if (myId) {
        set((state: GameState) => ({
          ...state,
          publicState: gameState,
          playerHand: playerHands[myId] || [],
          isGameActive: true,
          isLoading: false,
        }));
      }
    });

    socket.on('turn_started', ({currentPlayerId, timeRemaining}) => {
      const myId = socket.id;
      set((state: GameState) => ({
        ...state,
        currentPlayerId,
        timeRemaining,
        isMyTurn: currentPlayerId === myId,
        selectedCards: [], // Clear selection on new turn
      }));
    });

    socket.on('card_drawn', ({card}) => {
      set((state: GameState) => ({
        ...state,
        playerHand: [...state.playerHand, card],
        isLoading: false,
      }));
    });

    socket.on('player_drew_card', ({_, cardsRemaining}) => {
      set((state: GameState) => ({
        ...state,
        publicState: state.publicState
          ? {
              ...state.publicState,
              cardsInDeck: cardsRemaining,
            }
          : null,
      }));
    });

    socket.on('cards_played', ({playerId, cards, remainingCards}) => {
      const myId = socket.id;
      set((state: GameState) => {
        let newHand = state.playerHand;

        // If it's my play, remove the cards from my hand
        if (playerId === myId) {
          // Remove played cards from hand (they were already removed by the play action)
          newHand = state.playerHand;
        }

        return {
          ...state,
          playerHand: newHand,
          publicState: state.publicState
            ? {
                ...state.publicState,
                discardPile: [...state.publicState.discardPile, ...cards],
              }
            : null,
          selectedCards: [],
          isLoading: false,
        };
      });
    });

    socket.on('deck_reshuffled', ({cardsInDeck}) => {
      set((state: GameState) => ({
        ...state,
        publicState: state.publicState
          ? {
              ...state.publicState,
              cardsInDeck,
            }
          : null,
      }));
    });

    socket.on('game_ended', ({winner, finalScores}) => {
      set((state: GameState) => ({
        ...state,
        publicState: state.publicState
          ? {
              ...state.publicState,
              gameEnded: true,
              winner,
            }
          : null,
        finalScores,
        isGameActive: false,
        isMyTurn: false,
      }));
    });

    socket.on('game_error', ({message}) => {
      set((state: GameState) => ({
        ...state,
        error: message,
        isLoading: false,
      }));
    });

    (socket as any)._yanivGameListenersRegistered = true;
  }

  return {
    ...initialState,

    drawCard: () => {
      set((state: GameState) => ({...state, isLoading: true, error: null}));
      socket.emit('draw_card');
    },

    playCards: (cardIndices: number[]) => {
      if (cardIndices.length === 0) {
        set((state: GameState) => ({...state, error: 'בחר קלפים לשחק'}));
        return;
      }

      set((state: GameState) => {
        // Remove played cards from hand optimistically
        const newHand = state.playerHand.filter(
          (_, index) => !cardIndices.includes(index),
        );
        return {
          ...state,
          playerHand: newHand,
          selectedCards: [],
          isLoading: true,
          error: null,
        };
      });

      socket.emit('play_cards', {cardIndices});
    },

    callYaniv: () => {
      set((state: GameState) => ({...state, isLoading: true, error: null}));
      socket.emit('call_yaniv');
    },

    toggleCardSelection: (index: number) => {
      set((state: GameState) => {
        const newSelection = state.selectedCards.includes(index)
          ? state.selectedCards.filter(i => i !== index)
          : [...state.selectedCards, index];
        return {...state, selectedCards: newSelection};
      });
    },

    clearSelection: () => {
      set((state: GameState) => ({...state, selectedCards: []}));
    },

    clearError: () => {
      set((state: GameState) => ({...state, error: null}));
    },

    resetGame: () => {
      set(initialState);
    },

    setPlayerHand: (hand: Card[]) => {
      set((state: GameState) => ({...state, playerHand: hand}));
    },

    setPublicState: (publicState: PublicGameState) => {
      set((state: GameState) => ({...state, publicState}));
    },
  };
}) as StateCreator<GameStore>);
