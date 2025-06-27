import {NativeStackScreenProps} from '@react-navigation/native-stack';

export type Player = {
  id: string;
  nickname: string;
};

export type RoomConfig = {
  numPlayers: number;
  timePerPlayer: number;
};

export type RootStackParamList = {
  Home: undefined;
  GameWithFriends: undefined;
  Lobby: {
    roomId: string;
    players: Player[];
    config: RoomConfig;
    nickname: string;
    isCreator: boolean;
  };
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
