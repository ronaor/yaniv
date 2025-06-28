import React from 'react';
import {SafeAreaView, StatusBar} from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '~/screens/home';
import {RootStackParamList} from '~/types/navigation';
import {I18nManager} from 'react-native';
import GameBannerAd from '~/ads/banner';
import GameWithFriendsScreen from '~/screens/gameWithFriends';
import LobbyScreen from '~/screens/lobby';
import {useUser} from '~/store/userStore';
import GameScreen from '~/screens/game';
import NamePrompt from '~/components/namePrompt';

const Stack = createNativeStackNavigator<RootStackParamList>();

mobileAds()
  .initialize()
  .then(_ => {});

const App = () => {
  const backgroundStyle = {
    backgroundColor: '#FFFFFF',
  };
  I18nManager.allowRTL(false);

  React.useEffect(() => {
    useUser.getState().init();
  }, []);

  return (
    <>
      <SafeAreaView style={backgroundStyle} />
      <StatusBar backgroundColor={'#FFFFFF'} />
      <NavigationContainer>
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
