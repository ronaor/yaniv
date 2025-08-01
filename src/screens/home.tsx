import React from 'react';
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import GameLogo from '~/components/menu/title';

import MenuButton from '~/components/menu/menuButton';
import {openNamePromptEdit} from '~/components/namePrompt';

import {useRoomStore} from '~/store/roomStore';
import {useSocket} from '~/store/socketStore';
import {useUser} from '~/store/userStore';
import {colors, textStyles} from '~/theme';
import {HomeScreenProps} from '~/types/navigation';

const {width: screenWidth} = Dimensions.get('screen');

function HomeScreen({navigation}: HomeScreenProps) {
  const {quickGame} = useRoomStore();
  const {isConnected, isConnecting} = useSocket();
  const gameWithFriends = () => navigation.navigate('GameWithFriends');
  const gameWithAI = () => {};
  const {name} = useUser();

  const quickGameHandler = () => {
    if (!name) {
      // Optionally show an alert
      return;
    }
    quickGame(name);
    navigation.navigate('QuickLobby');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require('~/assets/images/background.png')}
        style={styles.screen}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>
              {name ? `hello ${name}! welcome` : ''}
            </Text>
            <TouchableOpacity
              onPress={() => openNamePromptEdit(name)}
              style={styles.changeNameBtn}>
              <Text style={styles.changeNameText}>change name</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.connectionStatus}>
            <View
              style={[
                styles.connectionDot,
                {
                  backgroundColor: isConnected
                    ? colors.success
                    : isConnecting
                    ? colors.warning
                    : colors.error,
                },
              ]}
            />
            <Text style={styles.connectionText}>
              {isConnected
                ? 'connected'
                : isConnecting
                ? 'connecting...'
                : 'disconnected'}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <GameLogo />
          <View style={styles.menuButtons}>
            <MenuButton
              text={'Quick Game'}
              onPress={quickGameHandler}
              disabled={!isConnected}
            />
            <MenuButton text={'Play with Friends'} onPress={gameWithFriends} />
            <MenuButton text={'Play vs Computer'} onPress={gameWithAI} />
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1},
  screen: {
    flex: 1,
    padding: 20,
    flexDirection: 'column',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
    justifyContent: 'space-between',
    width: screenWidth,
    paddingHorizontal: 10,
    paddingVertical: 10,
    position: 'absolute',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  welcome: {
    ...textStyles.body,
    color: colors.primary,
    fontWeight: 'bold',
    marginRight: 12,
  },
  changeNameBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  changeNameText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  container: {
    flexDirection: 'column',
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  title: {
    marginBottom: 32,
  },
  menuButtons: {
    padding: 10,
    gap: 16,
    width: '100%',
  },
});

export default HomeScreen;
