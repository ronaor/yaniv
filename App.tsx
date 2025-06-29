import React, {useCallback} from 'react';
import {SafeAreaView, StatusBar} from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';
import {NavigationContainer, NavigationState} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '~/screens/home';
import {RootStackParamList} from '~/types/navigation';
import {I18nManager} from 'react-native';
import GameBannerAd from '~/ads/banner';
import GameWithFriendsScreen from '~/screens/gameWithFriends';
import LobbyScreen from '~/screens/lobby';
import GameScreen from '~/screens/game';
import NamePrompt from '~/components/namePrompt';
import useSocketIO from '~/useSocketIO';
import {useRoomStore} from '~/store/roomStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

mobileAds()
  .initialize()
  .then(_ => {});

if (__DEV__) {
  require('./ReactotronConfig.js');
}

const App = () => {
  const backgroundStyle = {
    backgroundColor: '#FFFFFF',
  };
  I18nManager.allowRTL(false);

  useSocketIO();

  const {leaveRoom} = useRoomStore();

  const onStateChange = useCallback(
    (state: NavigationState | undefined) => {
      if (!state) {
        return;
      }

      const currentRoute = state.routes[state.index];
      const previousRoute = state.routes[state.index - 1];
      const currentRouteName = currentRoute?.name;
      const previousRouteName = previousRoute?.name;

      // Check if we were in lobby and now we're not in game screen
      // This means user navigated away from lobby (back to home or other screen)
      if (previousRouteName === 'Lobby' && currentRouteName !== 'Game') {
        leaveRoom();
      }
    },
    [leaveRoom],
  );

  return (
    <>
      <SafeAreaView style={backgroundStyle} />
      <StatusBar backgroundColor={'#FFFFFF'} />
      <NavigationContainer onStateChange={onStateChange}>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            contentStyle: backgroundStyle,
            animation: 'fade',
            gestureDirection: 'horizontal',
          }}>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              animation: 'slide_from_left',
            }}
          />
          <Stack.Screen
            name="GameWithFriends"
            component={GameWithFriendsScreen}
            options={{
              animation: 'slide_from_left',
            }}
          />
          <Stack.Screen
            name="Lobby"
            component={LobbyScreen}
            options={{
              animation: 'slide_from_left',
            }}
          />
          <Stack.Screen
            name="Game"
            component={GameScreen}
            options={{
              animation: 'slide_from_left',
            }}
          />
        </Stack.Navigator>
        <GameBannerAd />
        <NamePrompt />
      </NavigationContainer>
    </>
  );
};

export default App;
