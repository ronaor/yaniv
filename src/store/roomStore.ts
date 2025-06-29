import {create, StateCreator} from 'zustand';
import {useSocket} from './socketStore';
import {Player, RoomConfig} from '~/types/player';
import {isUndefined} from 'lodash';

export interface RoomState {
  roomId: string | null;
  nickname: string; //TODO
  players: Player[];
  config: RoomConfig | null;
  gameState: 'waiting' | 'started' | null;
  isInRoom: boolean;
  isAdminOfPrivateRoom: boolean;
  canStartTimer: Date | null; //TODO
  isLoading: boolean;
  error: string | null;
  callbacks: {[event: string]: ((data: any) => void) | null};
}

interface RoomStore extends Omit<RoomState, 'callbacks'> {
  createRoom: (
    nickname: string,
    slapDown: boolean,
    timePerPlayer: string,
    canCallYaniv: string,
    maxMatchPoints: string,
  ) => void;
  getRemainingTimeToStartGame: () => number;
  joinRoom: (roomId: string, nickname: string) => void;
  startPrivateGame: (roomId: string) => void;
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
    canStartTheGameIn7Sec: Date | null;
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
  nickname: '', //TODO
  players: [],
  config: null,
  gameState: null,
  isInRoom: false,
  isAdminOfPrivateRoom: false,
  canStartTimer: null, //TODO
  isLoading: false,
  error: null,
  callbacks: {},
};

export const useRoomStore = create<RoomStore>(((set: any, get: any) => {
  return {
    ...initialState,
    createRoom: (
      nickname,
      slapDown,
      timePerPlayer,
      canCallYaniv,
      maxMatchPoints,
    ) => {
      set((state: RoomState) => ({
        ...state,
        nickname,
        isLoading: true,
        error: null,
      }));
      useSocket.getState().emit('create_room', {
        nickname,
        slapDown,
        timePerPlayer,
        canCallYaniv,
        maxMatchPoints,
      });
    },
    getRemainingTimeToStartGame: () => {
      const start = get().canStartTimer;
      if (!start) return 0;

      const elapsedMs = Date.now() - new Date(start).getTime();
      const remaining = 7000 - elapsedMs;

      return Math.max(0, Math.floor(remaining / 1000));
    },
    joinRoom: (roomId, nickname) => {
      set((state: RoomState) => ({
        ...state,
        isLoading: true,
        error: null,
        nickname,
      }));
      useSocket.getState().emit('join_room', {roomId, nickname});
    },
    startPrivateGame: roomId => {
      set((state: RoomState) => ({...state, isLoading: true, error: null}));
      useSocket.getState().emit('start_private_game', {roomId});
    },
    quickGame: (nickname: string) => {
      set((state: RoomState) => ({
        ...state,
        isLoading: true,
        error: null,
        nickname,
      }));
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
    setRoomCreated: data => {
      const {roomId, players, config, canStartTheGameIn7Sec} = data;
      set((state: RoomState) => ({
        ...state,
        roomId,
        players,
        config,
        gameState: 'waiting',
        isInRoom: true,
        isAdminOfPrivateRoom: true,
        isLoading: false,
        canStartTimer: isUndefined(canStartTheGameIn7Sec)
          ? null
          : canStartTheGameIn7Sec,
        error: null,
      }));
    },
    setPlayersJoined: ({players, config}) => {
      set((state: RoomState) => ({...state, players, config, isInRoom: true}));
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
