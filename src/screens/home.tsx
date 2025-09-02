import React, {useCallback, useState} from 'react';
import {ImageBackground, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import GameLogo from '~/components/menu/title';

import MenuButton from '~/components/menu/menuButton';

import Dialog from '~/components/dialog';
import CreateRoomDialog from '~/components/dialogs/createRoomDialog';
import UserTopBar from '~/components/user/userTopBar';
import {useRoomStore} from '~/store/roomStore';
import {useSocket} from '~/store/socketStore';
import {useUser} from '~/store/userStore';
import {colors, textStyles} from '~/theme';
import {HomeScreenProps} from '~/types/navigation';
import {RoomConfig} from '~/types/player';
import EditProfileDialog from '~/components/dialogs/editProfileDialog';
import {SCREEN_WIDTH} from '~/utils/constants';

function HomeScreen({navigation}: HomeScreenProps) {
  const {quickGame} = useRoomStore.getState();
  const {emit} = useSocket();
  const [newRoomModalOpen, setNewRoomModalOpen] = useState<boolean>(false);

  const {isConnected} = useSocket();
  const gameWithFriends = () => navigation.navigate('GameWithFriends');
  const {user} = useUser();

  const quickGameHandler = useCallback(async () => {
    // Emit the request
    quickGame(user);

    // Wait for roomId to be set in the store
    const checkRoomCreated = () => {
      return new Promise<string | null>(resolve => {
        const unsubscribe = useRoomStore.subscribe(state => {
          if (state.roomId && state.isInRoom) {
            unsubscribe();
            resolve(state.roomId);
          }
        });

        // Timeout after 5 seconds
        setTimeout(() => {
          unsubscribe();
          resolve(null);
        }, 5000);
      });
    };

    const availableRoomId = await checkRoomCreated();
    if (availableRoomId) {
      navigation.navigate('QuickLobby');
    } else {
      console.error('Room creation timeout');
    }
  }, [user, navigation, quickGame]);

  const handleCreateRoom = (config: RoomConfig) => {
    emit('create_bot_room', {user, config});
    setNewRoomModalOpen(false);
    navigation.navigate('Game');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require('~/assets/images/background.png')}
        style={styles.screen}>
        <View style={styles.body}>
          <GameLogo />
          <View style={styles.menuButtons}>
            <MenuButton
              text={'Quick Game'}
              onPress={quickGameHandler}
              disabled={!isConnected}
            />
            <MenuButton
              text={'Play with Friends'}
              onPress={gameWithFriends}
              disabled={!isConnected}
            />
            <MenuButton
              text={'Play vs Computer'}
              onPress={() => setNewRoomModalOpen(true)}
            />
          </View>
          <EditProfileDialog />
        </View>

        <Dialog
          isModalOpen={newRoomModalOpen}
          onBackgroundPress={() => {
            setNewRoomModalOpen(false);
          }}>
          <CreateRoomDialog
            isPlayWithComputer
            onCreateRoom={handleCreateRoom}
            onClose={() => setNewRoomModalOpen(false)}
          />
        </Dialog>
        <UserTopBar />
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1},
  screen: {
    flex: 1,

    flexDirection: 'column',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    padding: 20,
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
    width: SCREEN_WIDTH,
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
    fontSize: 16,
    color: '#8FCDCA',
    fontWeight: '600',
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
  top: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#00515B',
    borderBottomRightRadius: 25,
    position: 'absolute',
  },
  avatar: {
    backgroundColor: '#13AEAF',
    aspectRatio: 1,
    height: 40,
    borderRadius: 25,
  },
  name: {fontSize: 18, color: '#FDF9D1', fontWeight: '700'},
  user: {flexDirection: 'row', alignItems: 'center', gap: 10},
});

export default HomeScreen;
