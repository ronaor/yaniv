import {isUndefined} from 'lodash';
import {create, StateCreator} from 'zustand';
import {RoomConfig, User} from '~/types/player';
import {useSocket} from './socketStore';

export interface RoomState {
  roomId: string | null;
  user: User;
  players: User[];
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
  createRoom: (user: User, config: RoomConfig) => void;
  getRemainingTimeToStartGame: () => number;
  joinRoom: (roomId: string, user: User) => void;
  setQuickGameConfig: (config: RoomConfig) => void;
  startPrivateGame: (roomId: string) => void;
  quickGame: (user: User) => void;
  leaveRoom: (user: User) => void;
  checkRoomState: (roomId: string, cb: (state: any) => void) => void;
  clearError: () => void;
  registerCallback: (event: string, cb: ((data: any) => void) | null) => void;
  triggerCallback: (event: string, data: any) => void;
  // Event setters
  setRoomCreated: (data: {
    roomId: string;
    players: User[];
    config: RoomConfig;
  }) => void;
  setRoomConfigVotes: (data: {roomId: string; votes: RoomConfig[]}) => void;
  setPlayersJoined: (data: {
    roomId: string;
    players: User[];
    config: RoomConfig;
    canStartTheGameIn10Sec: Date | null;
  }) => void;
  setPlayerLeft: (data: {
    players: User[];
    votes: Record<string, RoomConfig>;
  }) => void;
  setGameStarted: (data: {
    roomId: string;
    config: RoomConfig;
    players: User[];
  }) => void;
  setRoomError: (data: {message: string}) => void;
}

const initialState: RoomState = {
  roomId: null,
  user: {id: '', nickName: '', avatarIndex: 0},
  players: [],
  config: null,
  gameState: null,
  votes: {},
  isInRoom: false,
  isAdminOfPrivateRoom: false,
  canStartTimer: null,
  isLoading: false,
  error: null,
  callbacks: {},
};

export const useRoomStore = create<RoomStore>(((set: any, get: any) => {
  return {
    ...initialState,
    createRoom: (user, config) => {
      set((state: RoomState) => ({
        ...state,
        user,
        isLoading: true,
        error: null,
      }));
      useSocket.getState().emit('create_room', {
        user,
        config,
      });
    },
    getRemainingTimeToStartGame: () => {
      const start = get().canStartTimer;
      if (!start) {
        return 0;
      }

      const elapsedMs = Date.now() - new Date(start).getTime();
      const remaining = 10000 - elapsedMs;

      return Math.max(0, Math.floor(remaining / 1000));
    },
    joinRoom: (roomId, user) => {
      set((state: RoomState) => ({
        ...state,
        isLoading: true,
        error: null,
        user,
      }));
      useSocket.getState().emit('join_room', {roomId, user});
    },
    quickGame: user => {
      set((state: RoomState) => ({
        ...state,
        isLoading: true,
        error: null,
        user,
      }));
      useSocket.getState().emit('quick_game', {
        user,
      });
    },
    setQuickGameConfig: config => {
      set((state: RoomState) => {
        useSocket.getState().emit('set_quick_game_config', {
          roomId: state.roomId,
          user: state.user,
          config,
        });
        return {...state, isLoading: true, error: null};
      });
    },
    leaveRoom: (user: User) => {
      set((state: RoomState) => {
        useSocket
          .getState()
          .emit('leave_room', {user, isAdmin: state.isAdminOfPrivateRoom});
        return {...initialState};
      });
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
        isAdminOfPrivateRoom: true,
        isInRoom: true,
        isLoading: false,
        error: null,
      }));
    },
    setRoomConfigVotes: ({roomId, votes}) => {
      set((state: RoomState) => ({
        ...state,
        roomId,
        votes,
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

    triggerCallback: (event, data) => {
      const cb = get().callbacks[event];
      if (cb) {
        cb(data);
      }
    },

    checkRoomState: (roomId, _cb) => {
      useSocket.getState().emit('get_room_state', {roomId});
      // Note: Socket.IO callbacks are handled differently, we'll need to listen for the response
    },
  };
}) as StateCreator<RoomStore>);
