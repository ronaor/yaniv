import {NativeStackScreenProps} from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  GameWithFriends: undefined;
};

export type HomeScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Home'
>;
export type NewGameProps = NativeStackScreenProps<
  RootStackParamList,
  'GameWithFriends'
>;
