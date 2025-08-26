import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {User} from '~/types/player';
import {useSocket} from './socketStore';

interface UserStore {
  user: User;
  loading: boolean;
  setName: (name: string) => void;
  setAvatarIndex: (index: number) => void;
  init: () => void;
}

export const useUser = create<UserStore>((set, _get) => ({
  user: {id: '', nickName: '', avatarIndex: 0},
  loading: true,
  setName: (newName: string) => {
    set(state => ({user: {...state.user, name: newName}}));
    AsyncStorage.setItem('user_name', newName);
  },
  setAvatarIndex: (index: number) => {
    set(state => ({user: {...state.user, avatarIndex: index}}));
    AsyncStorage.setItem('user_avatar_index', index.toString());
  },
  init: async () => {
    const socketId = useSocket.getState().getSocketId();
    const storedName = await AsyncStorage.getItem('user_name');
    const storedAvatarIndex = await AsyncStorage.getItem('user_avatar_index');
    set({
      user: {
        id: `${socketId}`,
        nickName: storedName || '',
        avatarIndex: storedAvatarIndex ? parseInt(storedAvatarIndex, 10) : 0,
      },
      loading: false,
    });
  },
}));
