import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import React from 'react';
import MenuButton from '~/components/menuButton';
import {HomeScreenProps} from '~/types/navigation';
import {colors, textStyles} from '~/theme';
import {useUser} from '~/store/userStore';
import {useRoomStore} from '~/store/roomStore';
import {useSocket} from '~/store/socketStore';
import {openNamePromptEdit} from '~/components/namePrompt';

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
    navigation.navigate('Lobby');
  };

  return (
    <View style={styles.body}>
      <View style={styles.header}>
        <Text style={styles.welcome}>
          {name ? `שלום ${name}! ברוך הבא` : ''}
        </Text>
        <TouchableOpacity
          onPress={() => openNamePromptEdit(name)}
          style={styles.changeNameBtn}>
          <Text style={styles.changeNameText}>שנה שם</Text>
        </TouchableOpacity>
      </View>

      {/* Connection Status */}
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
          {isConnected ? 'מחובר' : isConnecting ? 'מתחבר...' : 'לא מחובר'}
        </Text>
      </View>

      <View style={styles.container}>
        <Text style={[textStyles.title, styles.title]}>{'יניב'}</Text>
        <View style={styles.menuButtons}>
          <MenuButton
            text={'משחק מהיר'}
            onPress={quickGameHandler}
            disabled={!isConnected}
          />
          <MenuButton text={'משחק עם חברים'} onPress={gameWithFriends} />
          <MenuButton text={'משחק עם מחשב'} onPress={gameWithAI} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  connectionStatus: {
    position: 'absolute',
    top: 20,
    right: 20,
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
    padding: 20,
    borderRadius: 20,
    backgroundColor: colors.accent,
    gap: 16,
    marginTop: 0,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
    width: '100%',
    alignItems: 'stretch',
  },
});

export default HomeScreen;
