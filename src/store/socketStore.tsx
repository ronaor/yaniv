import {create} from 'zustand';
import socket from '../socket';

interface SocketStore {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string) => void;
  getSocketId: () => string | null;
}

export const useSocket = create<SocketStore>((set, get) => ({
  isConnected: false,
  isConnecting: false,
  error: null,

  connect: () => {
    const {isConnected, isConnecting} = get();

    if (isConnected || isConnecting) return;

    set({isConnecting: true, error: null});

    socket.connect();

    socket.on('connect', () => {
      console.log('Socket connected');
      set({isConnected: true, isConnecting: false, error: null});
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      set({isConnected: false, isConnecting: false});
    });

    socket.on('connect_error', error => {
      console.error('Socket connection error:', error);
      set({isConnected: false, isConnecting: false, error: error.message});
    });
  },

  disconnect: () => {
    socket.disconnect();
    set({isConnected: false, isConnecting: false});
  },

  emit: (event: string, data?: any) => {
    const {isConnected} = get();
    if (!isConnected) {
      console.warn(`Cannot emit ${event}: socket not connected`);
      return;
    }
    socket.emit(event, data);
  },

  on: (event: string, callback: (data: any) => void) => {
    socket.on(event, callback);
  },

  off: (event: string) => {
    socket.off(event);
  },

  getSocketId: () => {
    return socket.id || null;
  },
}));
