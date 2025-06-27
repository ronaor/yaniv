import {create, StateCreator} from 'zustand';
import socket from './socket';
import {Player, RoomConfig} from './types/navigation';

export interface SocketState {
  roomId: string | null;
  players: Player[];
  config: RoomConfig | null;
  gameState: 'waiting' | 'started' | null;
  isInRoom: boolean;
  isLoading: boolean;
  error: string | null;
  callbacks: {[event: string]: ((data: any) => void) | null};
}

interface SocketStore extends Omit<SocketState, 'callbacks'> {
  createRoom: (
    nickname: string,
    numPlayers: number,
    timePerPlayer: number,
  ) => void;
  joinRoom: (roomId: string, nickname: string) => void;
  leaveRoom: () => void;
  checkRoomState: (roomId: string, cb: (state: any) => void) => void;
  clearError: () => void;
  registerCallback: (event: string, cb: ((data: any) => void) | null) => void;
}

const initialState: SocketState = {
  roomId: null,
  players: [],
  config: null,
  gameState: null,
  isInRoom: false,
  isLoading: false,
  error: null,
  callbacks: {},
};

export const useSocketStore = create<SocketStore>(((set: any, get: any) => {
  // Register socket listeners once
  if (!(socket as any)._yanivListenersRegistered) {
    socket.on('room_created', ({roomId, players, config}) => {
      set((state: SocketState) => ({
        ...state,
        roomId,
        players,
        config,
        gameState: 'waiting',
        isInRoom: true,
        isLoading: false,
      }));
    });
    socket.on('player_joined', ({players, config}) => {
      set((state: SocketState) => ({...state, players, config}));
    });
    socket.on('player_left', ({players}) => {
      set((state: SocketState) => ({...state, players}));
    });
    socket.on('start_game', ({roomId, config, players}) => {
      set((state: SocketState) => ({
        ...state,
        roomId,
        config,
        players,
        gameState: 'started',
        isLoading: false,
      }));
      const cb = get().callbacks['onGameStarted'];
      if (cb) cb({roomId, config, players});
    });
    socket.on('room_error', ({message}) => {
      set((state: SocketState) => ({
        ...state,
        error: message,
        isLoading: false,
      }));
    });
    (socket as any)._yanivListenersRegistered = true;
  }

  return {
    ...initialState,
    createRoom: (nickname, numPlayers, timePerPlayer) => {
      set((state: SocketState) => ({...state, isLoading: true, error: null}));
      socket.emit('create_room', {nickname, numPlayers, timePerPlayer});
    },
    joinRoom: (roomId, nickname) => {
      set((state: SocketState) => ({...state, isLoading: true, error: null}));
      socket.emit('join_room', {roomId, nickname});
    },
    leaveRoom: () => {
      set({...initialState});
      socket.emit('leave_room');
    },
    checkRoomState: (roomId, cb) => {
      socket.emit('get_room_state', {roomId}, cb);
    },
    clearError: () => set((state: SocketState) => ({...state, error: null})),
    registerCallback: (event, cb) => {
      set((state: SocketState) => ({
        ...state,
        callbacks: {...state.callbacks, [event]: cb},
      }));
    },
  };
}) as StateCreator<SocketStore>);
