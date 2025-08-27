import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {User} from '~/types/player';

interface UserStore {
  user: User;
  loading: boolean;
  saveProfile: (data: {nickName: string; avatarIndex: number}) => void;
  init: (id: string) => void;
}

export const useUser = create<UserStore>((set, _get) => ({
  user: {id: '', nickName: '', avatarIndex: 0},
  loading: true,
  saveProfile: data => {
    data.avatarIndex;
    set(state => {
      const updatedUser = {
        ...state.user,
        ...data,
      };
      AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      return {
        user: updatedUser,
      };
    });
  },
  init: async socketId => {
    const strData = await AsyncStorage.getItem('user');
    if (strData) {
      const storedUser = {...JSON.parse(strData), id: socketId};
      set({user: storedUser, loading: false});
    } else {
      set({
        user: {
          id: socketId,
          nickName: '',
          avatarIndex: 0,
        },
        loading: false,
      });
    }
  },
}));
