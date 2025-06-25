import React from 'react';
import {SafeAreaView, StatusBar} from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '~/screens/home';
import {RootStackParamList} from '~/types/navigation';
import {I18nManager} from 'react-native';
import GameBannerAd from '~/ads/banner';

const Stack = createNativeStackNavigator<RootStackParamList>();

mobileAds()
  .initialize()
  .then(_ => {});

const App = () => {
  const backgroundStyle = {
    backgroundColor: '#FFFFFF',
  };
  I18nManager.allowRTL(false);

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
        </Stack.Navigator>
        <GameBannerAd />
      </NavigationContainer>
    </>
  );
};

export default App;
