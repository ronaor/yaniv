import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserStore {
  name: string;
  loading: boolean;
  setName: (name: string) => void;
  init: () => void;
}

export const useUser = create<UserStore>((set, _get) => ({
  name: '',
  loading: true,
  setName: (newName: string) => {
    set({name: newName});
    AsyncStorage.setItem('yaniv_name', newName);
  },
  init: async () => {
    const storedName = await AsyncStorage.getItem('yaniv_name');
    if (storedName) {
      set({name: storedName, loading: false});
    } else {
      set({loading: false});
    }
  },
}));

// Call useUser.getState().init() once at app startup (e.g., in App.tsx)
