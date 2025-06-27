import React, {createContext, useContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserContextType {
  name: string;
  setName: (name: string) => void;
  loading: boolean;
}

const UserContext = createContext<UserContextType>({
  name: '',
  setName: () => {},
  loading: true,
});

export const UserProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [name, setNameState] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('yaniv_name').then(storedName => {
      if (storedName) setNameState(storedName);
      setLoading(false);
    });
  }, []);

  const setName = (newName: string) => {
    setNameState(newName);
    AsyncStorage.setItem('yaniv_name', newName);
  };

  return (
    <UserContext.Provider value={{name, setName, loading}}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
