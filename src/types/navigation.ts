import {NativeStackScreenProps} from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  GameWithFriends: undefined;
  Lobby?: undefined;
  QuickLobby?: undefined;
  Game?: undefined;
};

export type HomeScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Home'
>;
export type GameWithFriendsProps = NativeStackScreenProps<
  RootStackParamList,
  'GameWithFriends'
>;
export type LobbyProps = NativeStackScreenProps<RootStackParamList, 'Lobby'>;
export type GameScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Game'
>;
export type QuickGameLobbyProps = NativeStackScreenProps<
  RootStackParamList,
  'QuickLobby'
>;
