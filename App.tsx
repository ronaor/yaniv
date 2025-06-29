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
import {useSocket} from '~/store/socketStore';
import {useRoomStore} from '~/store/roomStore';
import {useGameStore} from '~/store/gameStore';
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
    // Initialize user store
    useUser.getState().init();

    // Initialize socket connection
    const socket = useSocket.getState();
    socket.connect();

    // Register all socket event listeners
    const roomStore = useRoomStore.getState();
    const gameStore = useGameStore.getState();

    // Room events
    socket.on('room_created', ({roomId, players, config}) => {
      roomStore.setRoomCreated({roomId, players, config});
    });

    socket.on('player_joined', ({players, config}) => {
      roomStore.setPlayersJoined({players, config});
    });

    socket.on('player_left', ({players}) => {
      roomStore.setPlayerLeft({players});
    });

    socket.on('start_game', ({roomId, config, players}) => {
      roomStore.setGameStarted({roomId, config, players});
    });

    socket.on('room_error', ({message}) => {
      roomStore.setRoomError({message});
    });

    // Game events
    socket.on('game_initialized', data => {
      gameStore.setGameInitialized(data);
    });

    socket.on('turn_started', data => {
      gameStore.setTurnStarted(data);
    });

    socket.on('player_drew', data => {
      gameStore.playerDrew(data);
    });

    socket.on('game_ended', data => {
      gameStore.setGameEnded(data);
    });

    socket.on('game_error', data => {
      gameStore.setGameError(data);
    });

    // Cleanup on app unmount
    return () => {
      socket.disconnect();
    };
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
