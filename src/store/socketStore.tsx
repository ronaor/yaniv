import {useGameStore} from './gameStore';
import {useRoomStore} from './roomStore';
export type {RoomState} from './roomStore';
export type {GameState, Card, PublicGameState} from './gameStore';

// For backward compatibility - combined hook that includes both stores
export const useSocketStore = () => {
  const roomStore = useRoomStore();
  const gameStore = useGameStore();

  return {
    // Room management
    ...roomStore,

    // Game management
    gameState: gameStore.publicState,
    playerHand: gameStore.playerHand,
    isMyTurn: gameStore.isMyTurn,
    selectedCards: gameStore.selectedCards,
    isGameActive: gameStore.isGameActive,
    finalScores: gameStore.finalScores,

    // Game actions
    drawCard: gameStore.drawCard,
    playCards: gameStore.playCards,
    callYaniv: gameStore.callYaniv,
    toggleCardSelection: gameStore.toggleCardSelection,
    clearSelection: gameStore.clearSelection,

    // Reset everything when leaving room
    leaveRoom: () => {
      roomStore.leaveRoom();
      gameStore.resetGame();
    },
  };
};
