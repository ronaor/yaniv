import {create, StateCreator} from 'zustand';
import {useSocket} from './socketStore';
import {Player, RoomConfig} from '~/types/player';
import {isUndefined} from 'lodash';

export interface RoomState {
  roomId: string | null;
  nickName: string; //TODO
  players: Player[];
  config: RoomConfig | null;
  votes: Record<string, RoomConfig>;
  gameState: 'waiting' | 'started' | null;
  isInRoom: boolean;
  isAdminOfPrivateRoom: boolean;
  canStartTimer: Date | null; //TODO
  isLoading: boolean;
  error: string | null;
  callbacks: {[event: string]: ((data: any) => void) | null};
}

interface RoomStore extends Omit<RoomState, 'callbacks'> {
  createRoom: (nickName: string, config: RoomConfig) => void;
  getRemainingTimeToStartGame: () => number;
  joinRoom: (roomId: string, nickName: string) => void;
  setQuickGameConfig: (
    roomId: string,
    nickName: string,
    config: RoomConfig,
  ) => void;
  startPrivateGame: (roomId: string) => void;
  quickGame: (nickName: string) => void;
  leaveRoom: (nickName: string) => void;
  checkRoomState: (roomId: string, cb: (state: any) => void) => void;
  clearError: () => void;
  registerCallback: (event: string, cb: ((data: any) => void) | null) => void;
  // Event setters
  setRoomCreated: (data: {
    roomId: string;
    players: Player[];
    config: RoomConfig;
  }) => void;
  setRoomConfigVotes: (data: {roomId: string; votes: RoomConfig[]}) => void;
  setPlayersJoined: (data: {
    roomId: string;
    players: Player[];
    config: RoomConfig;
    canStartTheGameIn10Sec: Date | null;
  }) => void;
  setPlayerLeft: (data: {
    players: Player[];
    votes: Record<string, RoomConfig>;
  }) => void;
  setGameStarted: (data: {
    roomId: string;
    config: RoomConfig;
    players: Player[];
    votes: Record<string, RoomConfig>;
  }) => void;
  setRoomError: (data: {message: string}) => void;
}

const initialState: RoomState = {
  roomId: null,
  nickName: '', //TODO
  players: [],
  config: null,
  gameState: null,
  votes: {},
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
    createRoom: (nickName, config) => {
      set((state: RoomState) => ({
        ...state,
        nickName,
        isLoading: true,
        error: null,
      }));
      useSocket.getState().emit('create_room', {
        nickName,
        config,
      });
    },
    getRemainingTimeToStartGame: () => {
      const start = get().canStartTimer;
      if (!start) return 0;

      const elapsedMs = Date.now() - new Date(start).getTime();
      const remaining = 10000 - elapsedMs;

      return Math.max(0, Math.floor(remaining / 1000));
    },
    joinRoom: (roomId, nickName) => {
      set((state: RoomState) => ({
        ...state,
        isLoading: true,
        error: null,
        nickName,
      }));
      useSocket.getState().emit('join_room', {roomId, nickName});
    },
    quickGame: nickName => {
      set((state: RoomState) => ({
        ...state,
        isLoading: true,
        error: null,
        nickName,
      }));
      useSocket.getState().emit('quick_game', {
        nickName,
      });
    },
    setQuickGameConfig: (roomId, nickName, config) => {
      set((state: RoomState) => ({...state, isLoading: true, error: null}));
      useSocket
        .getState()
        .emit('set_quick_game_config', {roomId, nickName, config});
    },
    leaveRoom: nickName => {
      set({...initialState});
      useSocket.getState().emit('leave_room', {nickName});
    },

    clearError: () => set((state: RoomState) => ({...state, error: null})),
    // Event setters

    setRoomCreated: data => {
      const {roomId, players, config} = data;
      set((state: RoomState) => ({
        ...state,
        roomId,
        players,
        config,
        gameState: 'waiting',
        isInRoom: true,
        isAdminOfPrivateRoom: true,
        isLoading: false,
        error: null,
      }));
    },
    setRoomConfigVotes: ({roomId, votes}) => {
      set((state: RoomState) => ({
        ...state,
        roomId,
        votes: votes,
      }));
    },

    setPlayersJoined: ({roomId, players, config, canStartTheGameIn10Sec}) => {
      set((state: RoomState) => ({
        ...state,
        roomId,
        players,
        config,
        isInRoom: true,
        isLoading: false,
        canStartTimer: isUndefined(canStartTheGameIn10Sec)
          ? null
          : canStartTheGameIn10Sec,
      }));
    },
    setPlayerLeft: ({players, votes}) => {
      set((state: RoomState) => ({...state, players, votes}));
    },
    setGameStarted: ({roomId, config, players, votes}) => {
      set((state: RoomState) => ({
        ...state,
        roomId,
        config,
        players,
        votes,
        gameState: 'started',
        isLoading: false,
      }));
      const cb = get().callbacks.onGameStarted;
      if (cb) {
        cb({roomId, config, players});
      }
    },
    startPrivateGame: roomId => {
      set((state: RoomState) => ({...state, isLoading: true, error: null}));
      useSocket.getState().emit('start_private_game', {roomId});
    },

    setRoomError: ({message}) => {
      set((state: RoomState) => ({
        ...state,
        error: message,
        isLoading: false,
      }));
    },
    registerCallback: (event, cb) => {
      set((state: RoomState) => ({
        ...state,
        callbacks: {...state.callbacks, [event]: cb},
      }));
    },
    checkRoomState: (roomId, _cb) => {
      useSocket.getState().emit('get_room_state', {roomId});
      // Note: Socket.IO callbacks are handled differently, we'll need to listen for the response
    },
  };
}) as StateCreator<RoomStore>);
