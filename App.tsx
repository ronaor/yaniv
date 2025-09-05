import 'react-native-gesture-handler';
import React, {useCallback} from 'react';
import {
  DefaultTheme,
  NavigationContainer,
  NavigationState,
} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {I18nManager} from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';
import {LogBox} from 'react-native';
import MenuBackground, {useMenuStore} from '~/components/menu/menuBackground';
import GameBannerAd from '~/ads/banner';

import HomeScreen from '~/screens/home';
import GameWithFriendsScreen from '~/screens/gameWithFriends';
import LobbyScreen from '~/screens/lobby';
import QuickGameLobby from '~/screens/quickGameLobby';
import GameScreen from '~/screens/game';

import {useRoomStore} from '~/store/roomStore';
import useSocketIO from '~/useSocketIO';
import '~/sounds';
import {edgeToEdgeSlide, Fade} from '~/utils/edgeToEdgeSlide';
import {RootStackParamList} from '~/types/navigation';

const Stack = createStackNavigator<RootStackParamList>();

if (__DEV__) {
  require('./ReactotronConfig.js');
}

mobileAds()
  .initialize()
  .then(() => {});

LogBox.ignoreLogs([
  'Sending `onAnimatedValueUpdate` with no listeners registered.',
  'onAnimatedValueUpdate', // belt-and-suspenders
]);

const theme = {
  ...DefaultTheme,
  colors: {...DefaultTheme.colors, background: 'transparent'},
};

// helper: get active route name from nested states (if you later nest)
const getActiveRouteName = (
  state: NavigationState | undefined,
): string | undefined => {
  if (!state) {
    return;
  }
  const route = state.routes[state.index];
  // @ts-ignore: nested state optional
  if (route?.state) {
    return getActiveRouteName(route.state as NavigationState);
  }
  return route?.name;
};

export default function App() {
  I18nManager.allowRTL(false);
  useSocketIO();

  const {leaveRoom, user} = useRoomStore();

  const {setLookPosition} = useMenuStore();

  const onStateChange = useCallback(
    (state: NavigationState | undefined) => {
      if (!state) {
        return;
      }

      const routes = state.routes;
      const i = state.index;
      const currentRoute = routes[i];
      const prevRoute = routes[i - 1];

      const currentName = getActiveRouteName(state) ?? currentRoute?.name;
      const prevName = prevRoute?.name;
      switch (currentName) {
        case 'GameWithFriends':
        case 'Lobby': {
          setLookPosition({x: -50, y: 100});
          break;
        }
        case 'Home': {
          setLookPosition({x: 0, y: 100});
          break;
        }

        case 'QuickLobby': {
          setLookPosition({x: 60, y: 100});
          break;
        }
        case 'Game': {
          break;
        }
      }

      if (
        (prevName === 'Lobby' || prevName === 'QuickLobby') &&
        currentName !== 'Game'
      ) {
        leaveRoom(user);
      }
    },
    [leaveRoom, setLookPosition, user],
  );

  return (
    <GestureHandlerRootView>
      <MenuBackground />

      <NavigationContainer theme={theme} onStateChange={onStateChange}>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            cardStyle: {backgroundColor: 'transparent'},
            gestureDirection: I18nManager.isRTL
              ? 'horizontal-inverted'
              : 'horizontal',
            cardStyleInterpolator: edgeToEdgeSlide,
            detachPreviousScreen: false,
          }}>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              cardStyleInterpolator: Fade,
              gestureEnabled: false,
              title: 'Home',
            }}
          />
          <Stack.Screen
            name="GameWithFriends"
            component={GameWithFriendsScreen}
            options={{
              title: 'GameWithFriends',
              gestureDirection: 'horizontal-inverted',
            }}
          />
          <Stack.Screen
            name="Lobby"
            component={LobbyScreen}
            options={{title: 'Lobby', gestureDirection: 'horizontal-inverted'}}
          />
          <Stack.Screen
            name="QuickLobby"
            component={QuickGameLobby}
            options={{title: 'QuickGameLobby'}}
          />

          {/* Keep Game but fade it (often feels best when entering gameplay) */}
          <Stack.Screen
            name="Game"
            component={GameScreen}
            options={{
              cardStyleInterpolator: Fade,
              gestureEnabled: false,
              title: 'Game',
            }}
          />
        </Stack.Navigator>

        <GameBannerAd />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
