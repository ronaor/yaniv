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
import {UserProvider, useUser} from '~/userContext';
import GameScreen from '~/screens/game';
import {colors, textStyles} from '~/theme';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();

mobileAds()
  .initialize()
  .then(_ => {});

function NamePrompt() {
  const {name, setName, loading} = useUser();
  const [input, setInput] = React.useState('');
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (!loading && !name) setShow(true);
    else setShow(false);
  }, [loading, name]);

  if (loading)
    return (
      <Modal visible transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.1)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Modal>
    );

  return (
    <Modal visible={show} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.2)',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <View
          style={{
            backgroundColor: colors.card,
            padding: 24,
            borderRadius: 16,
            alignItems: 'center',
            width: 300,
          }}>
          <Text style={textStyles.title}>הכנס שם</Text>
          <TextInput
            value={input}
            onChangeText={setInput}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              padding: 8,
              width: '100%',
              marginVertical: 12,
              color: colors.text,
              textAlign: 'center',
            }}
            placeholder="השם שלך"
            placeholderTextColor={colors.textSecondary}
            autoFocus
            onSubmitEditing={() => {
              if (input.trim().length > 1) {
                setName(input.trim());
                setShow(false);
              }
            }}
          />
          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              padding: 10,
              borderRadius: 8,
              marginTop: 8,
              width: '100%',
            }}
            onPress={() => {
              if (input.trim().length > 1) {
                setName(input.trim());
                setShow(false);
              }
            }}>
            <Text style={[textStyles.body, {color: '#fff'}]}>שמור</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const App = () => {
  const backgroundStyle = {
    backgroundColor: '#FFFFFF',
  };
  I18nManager.allowRTL(false);

  return (
    <UserProvider>
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
      </NavigationContainer>
      <NamePrompt />
    </UserProvider>
  );
};

export default App;
