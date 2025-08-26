import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserStore {
  name: string;
  avatarIndex: number;
  loading: boolean;
  setName: (name: string) => void;
  setAvatarIndex: (index: number) => void;
  init: () => void;
}

export const useUser = create<UserStore>((set, _get) => ({
  name: '',
  avatarIndex: 0,
  loading: true,
  setName: (newName: string) => {
    set({name: newName});
    AsyncStorage.setItem('user_name', newName);
  },
  setAvatarIndex: (index: number) => {
    set({avatarIndex: index});
    AsyncStorage.setItem('user_avatar_index', index.toString());
  },
  init: async () => {
    const storedName = await AsyncStorage.getItem('user_name');
    const storedAvatarIndex = await AsyncStorage.getItem('user_avatar_index');

    set({
      name: storedName || '',
      avatarIndex: storedAvatarIndex ? parseInt(storedAvatarIndex, 10) : 0,
      loading: false,
    });
  },
}));
