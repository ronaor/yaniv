import {create, StateCreator} from 'zustand';
import {useSocket} from './socketStore';
import {Player, RoomConfig} from '~/types/player';

export interface RoomState {
  roomId: string | null;
  players: Player[];
  config: RoomConfig | null;
  gameState: 'waiting' | 'started' | null;
  isInRoom: boolean;
  isLoading: boolean;
  error: string | null;
  callbacks: {[event: string]: ((data: any) => void) | null};
}

interface RoomStore extends Omit<RoomState, 'callbacks'> {
  createRoom: (
    nickname: string,
    numPlayers: number,
    timePerPlayer: number,
  ) => void;
  joinRoom: (roomId: string, nickname: string) => void;
  quickGame: (nickname: string) => void;
  leaveRoom: () => void;
  checkRoomState: (roomId: string, cb: (state: any) => void) => void;
  clearError: () => void;
  registerCallback: (event: string, cb: ((data: any) => void) | null) => void;
  // Event setters
  setRoomCreated: (data: {
    roomId: string;
    players: Player[];
    config: RoomConfig;
  }) => void;
  setPlayersJoined: (data: {players: Player[]; config: RoomConfig}) => void;
  setPlayerLeft: (data: {players: Player[]}) => void;
  setGameStarted: (data: {
    roomId: string;
    config: RoomConfig;
    players: Player[];
  }) => void;
  setRoomError: (data: {message: string}) => void;
}

const initialState: RoomState = {
  roomId: null,
  players: [],
  config: null,
  gameState: null,
  isInRoom: false,
  isLoading: false,
  error: null,
  callbacks: {},
};

export const useRoomStore = create<RoomStore>(((set: any, get: any) => {
  return {
    ...initialState,
    createRoom: (nickname, numPlayers, timePerPlayer) => {
      set((state: RoomState) => ({...state, isLoading: true, error: null}));
      useSocket
        .getState()
        .emit('create_room', {nickname, numPlayers, timePerPlayer});
    },
    joinRoom: (roomId, nickname) => {
      set((state: RoomState) => ({...state, isLoading: true, error: null}));
      useSocket.getState().emit('join_room', {roomId, nickname});
    },
    quickGame: (nickname: string) => {
      set((state: RoomState) => ({...state, isLoading: true, error: null}));
      useSocket.getState().emit('quick_game', {nickname});
    },
    leaveRoom: () => {
      set({...initialState});
      useSocket.getState().emit('leave_room');
    },
    checkRoomState: (roomId, _cb) => {
      useSocket.getState().emit('get_room_state', {roomId});
      // Note: Socket.IO callbacks are handled differently, we'll need to listen for the response
    },
    clearError: () => set((state: RoomState) => ({...state, error: null})),
    registerCallback: (event, cb) => {
      set((state: RoomState) => ({
        ...state,
        callbacks: {...state.callbacks, [event]: cb},
      }));
    },
    // Event setters
    setRoomCreated: ({roomId, players, config}) => {
      set((state: RoomState) => ({
        ...state,
        roomId,
        players,
        config,
        gameState: 'waiting',
        isInRoom: true,
        isLoading: false,
      }));
    },
    setPlayersJoined: ({players, config}) => {
      set((state: RoomState) => ({...state, players, config}));
    },
    setPlayerLeft: ({players}) => {
      set((state: RoomState) => ({...state, players}));
    },
    setGameStarted: ({roomId, config, players}) => {
      set((state: RoomState) => ({
        ...state,
        roomId,
        config,
        players,
        gameState: 'started',
        isLoading: false,
      }));
      console.log('start_game');
      const cb = get().callbacks.onGameStarted;
      if (cb) {
        cb({roomId, config, players});
      }
    },
    setRoomError: ({message}) => {
      set((state: RoomState) => ({
        ...state,
        error: message,
        isLoading: false,
      }));
    },
  };
}) as StateCreator<RoomStore>);
