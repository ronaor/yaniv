import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import MenuButton from '~/components/menu/menuButton';
import Dialog from '~/components/dialog';
import {GameWithFriendsProps} from '~/types/navigation';
import {colors, textStyles} from '~/theme';
import {useUser} from '~/store/userStore';
import {useRoomStore} from '~/store/roomStore';
import StartGameDialog from '~/components/startGameDialog';
import {RoomConfig} from '~/types/player';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import LeaveButton from '~/components/menu/leaveButton';

function GameWithFriendsScreen({navigation}: GameWithFriendsProps) {
  const [newRoomModalOpen, setNewRoomModalOpen] = useState<boolean>(false);
  const [enterRoomModalOpen, setEnterRoomModalOpen] = useState<boolean>(false);
  const [roomCode, setRoomCode] = useState<string>('');
  const {name} = useUser();
  const {
    createRoom,
    joinRoom,
    clearError,
    isInRoom,
    isLoading,
    error,
    gameState,
  } = useRoomStore();

  useEffect(() => {
    if (gameState === 'started') {
      navigation.replace('Game');
    } else if (isInRoom) {
      setNewRoomModalOpen(false);
      setEnterRoomModalOpen(false);
      navigation.replace('Lobby');
    }
  }, [gameState, isInRoom, navigation]);

  useEffect(() => {
    if (error) {
      Alert.alert('שגיאה', error, [{text: 'סגור', onPress: clearError}]);
    }
  }, [error, clearError]);

  const createARoom = () => {
    setEnterRoomModalOpen(false);
    setNewRoomModalOpen(true);
  };
  const enterARoom = () => {
    setNewRoomModalOpen(false);
    setEnterRoomModalOpen(true);
  };
  const handleCreateRoom = (data: RoomConfig) => {
    if (!name) {
      Alert.alert('שגיאה', 'יש להזין שם שחקן');
      return;
    }
    createRoom(name, data);
  };

  const handleJoinRoom = () => {
    if (!name || !roomCode) {
      Alert.alert('שגיאה', 'יש להזין שם שחקן ומזהה חדר');
      return;
    }
    joinRoom(roomCode, name);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require('~/assets/images/background.png')}
        style={styles.screen}>
        <View style={styles.topBar}>
          <LeaveButton text={'Exit'} onPress={navigation.goBack} />
        </View>
        <View style={styles.body}>
          <View style={styles.headerContainer}>
            <LinearGradient
              style={styles.headerGradient}
              colors={['#DE8216', '#702900']}>
              <View style={styles.headerContent}>
                <Text style={styles.title}>{'Game with Friends'}</Text>
              </View>
            </LinearGradient>
          </View>
          <View style={styles.container}>
            <View style={styles.menuButtons}>
              <MenuButton text={'Create Room'} onPress={createARoom} />
              <MenuButton text={'Enter Room'} onPress={enterARoom} />
            </View>
          </View>
          <Dialog
            isModalOpen={newRoomModalOpen}
            onBackgroundPress={() => {
              setNewRoomModalOpen(false);
            }}>
            <StartGameDialog
              onCreateRoom={handleCreateRoom}
              onClose={() => setNewRoomModalOpen(false)}
            />
          </Dialog>
          <Dialog
            isModalOpen={enterRoomModalOpen}
            onBackgroundPress={() => setEnterRoomModalOpen(false)}>
            <Text style={textStyles.subtitle}>{'כניסה לחדר'}</Text>
            <View style={styles.dialogBody}>
              <Text style={textStyles.body}>{'מזהה חדר'}</Text>
              <TextInput
                value={roomCode}
                onChangeText={setRoomCode}
                style={styles.input}
                placeholder="הכנס קוד חדר"
                autoCapitalize="characters"
                placeholderTextColor={colors.textSecondary}
              />
              <MenuButton onPress={handleJoinRoom} text="כנס" />
            </View>
          </Dialog>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1},
  screen: {flex: 1},
  body: {
    flex: 2,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 50,
  },
  container: {
    flexDirection: 'column',
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderRadius: 24,
    padding: 24,
    gap: 50,
  },
  title: {
    fontSize: 30,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  menuButtons: {
    padding: 20,
    borderRadius: 20,
    gap: 16,
    marginTop: 0,
    width: '100%',
    alignItems: 'stretch',
  },
  dialogBody: {
    paddingTop: 20,
    paddingHorizontal: 10,
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 16,
    marginTop: 8,
  },
  enterNumberContainer: {
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginVertical: 5,
    width: 180,
    textAlign: 'right',
    color: colors.text,
    backgroundColor: colors.background,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  headerContainer: {
    backgroundColor: '#502404',
    padding: 3,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerGradient: {
    backgroundColor: '#843402',
    borderRadius: 20,
    paddingHorizontal: 3,
    paddingTop: 3,
    flexDirection: 'column',
  },
  headerContent: {
    backgroundColor: '#A9500F',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    gap: 10,
  },
  topBar: {padding: 20, flexDirection: 'row'},
});

export default GameWithFriendsScreen;
