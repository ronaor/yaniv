import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  NewGame: undefined;
  Tutorial: undefined;
  UserInfo: {user: string};
};

export type HomeScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Home'
>;
export type NewGameProps = NativeStackScreenProps<
  RootStackParamList,
  'NewGame'
>;
export type DetailsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'UserInfo'
>;
export type TutorialNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Tutorial'
>;
