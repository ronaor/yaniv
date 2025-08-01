import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  ActivityIndicator,
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
    <View style={styles.body}>
      <View style={styles.container}>
        <Text style={[textStyles.title, styles.title]}>{'משחק עם חברים'}</Text>
        <View style={styles.menuButtons}>
          <MenuButton text={'צור חדר'} onPress={createARoom} />
          <MenuButton text={'כנס לחדר'} onPress={enterARoom} />
        </View>
      </View>
      <Dialog
        isModalOpen={newRoomModalOpen}
        onBackgroundPress={() => setNewRoomModalOpen(false)}>
        <StartGameDialog onCreateRoom={handleCreateRoom} />
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
    borderColor: colors.border,
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
});

export default GameWithFriendsScreen;
