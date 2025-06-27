import {StyleSheet, Text, TextInput, View, Alert} from 'react-native';
import React, {useEffect, useState} from 'react';
import MenuButton from '~/components/menuButton';
import Dialog from '~/components/dialog';
import EnterNumber from '~/components/enterNumber';
import {GameWithFriendsProps} from '~/types/navigation';
import socket from '../socket';
import {colors, textStyles} from '../theme';

function GameWithFriendsScreen({navigation}: GameWithFriendsProps) {
  const [newRoomModalOpen, setNewRoomModalOpen] = useState<boolean>(false);
  const [enterRoomModalOpen, setEnterRoomModalOpen] = useState<boolean>(false);
  const [numPlayers, setNumPlayers] = useState<number>(3);
  const [timePerPlayer, setTimePerPlayer] = useState<number>(15);
  const [nickname, setNickname] = useState<string>('');
  const [roomCode, setRoomCode] = useState<string>('');

  useEffect(() => {
    // Room created (creator only)
    socket.off('room_created');
    socket.on('room_created', ({roomId, players, config}) => {
      navigation.navigate('Lobby', {
        roomId,
        players,
        config,
        nickname,
        isCreator: true,
      });
    });
    // Joined room (joiner)
    socket.off('player_joined');
    socket.on('player_joined', ({players}) => {
      // Only navigate if not already in lobby
      // (creator will already be in lobby)
      if (!newRoomModalOpen && !enterRoomModalOpen) {
        navigation.navigate('Lobby', {
          roomId: roomCode,
          players,
          config: {numPlayers, timePerPlayer}, // fallback, will update in lobby
          nickname,
          isCreator: false,
        });
      }
    });
    // Error
    socket.off('room_error');
    socket.on('room_error', ({message}) => {
      Alert.alert('שגיאה', message);
    });
    return () => {
      socket.off('room_created');
      socket.off('player_joined');
      socket.off('room_error');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nickname, roomCode, numPlayers, timePerPlayer, navigation]);

  const createARoom = () => {
    setEnterRoomModalOpen(false);
    setNewRoomModalOpen(true);
  };
  const enterARoom = () => {
    setNewRoomModalOpen(false);
    setEnterRoomModalOpen(true);
  };
  const createRoom = () => {
    if (!nickname) {
      Alert.alert('שגיאה', 'יש להזין שם שחקן');
      return;
    }
    socket.emit('create_room', {
      nickname,
      numPlayers,
      timePerPlayer,
    });
    setNewRoomModalOpen(false);
  };
  const enterRoom = () => {
    if (!nickname || !roomCode) {
      Alert.alert('שגיאה', 'יש להזין שם שחקן ומזהה חדר');
      return;
    }
    socket.emit('join_room', {
      roomId: roomCode,
      nickname,
    });
    setEnterRoomModalOpen(false);
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
        <Text style={textStyles.subtitle}>{'חדר חדש'}</Text>
        <View style={styles.dialogBody}>
          <Text style={textStyles.body}>{'שם שחקן'}</Text>
          <TextInput
            value={nickname}
            onChangeText={setNickname}
            style={styles.input}
            placeholder="הכנס שם"
            placeholderTextColor={colors.textSecondary}
          />
          <View style={styles.row}>
            <EnterNumber
              value={numPlayers}
              onValueChanged={setNumPlayers}
              range={[2, 5]}
            />
            <Text style={textStyles.body}>{'מספר משתתפים'}</Text>
          </View>
          <View style={styles.row}>
            <EnterNumber
              value={timePerPlayer}
              onValueChanged={setTimePerPlayer}
              range={[3, 30]}
            />
            <Text style={textStyles.body}>{'משך תור'}</Text>
          </View>
          <MenuButton onPress={createRoom} text="צור חדר" />
        </View>
      </Dialog>
      <Dialog
        isModalOpen={enterRoomModalOpen}
        onBackgroundPress={() => setEnterRoomModalOpen(false)}>
        <Text style={textStyles.subtitle}>{'כניסה לחדר'}</Text>
        <View style={styles.dialogBody}>
          <Text style={textStyles.body}>{'שם שחקן'}</Text>
          <TextInput
            value={nickname}
            onChangeText={setNickname}
            style={styles.input}
            placeholder="הכנס שם"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={textStyles.body}>{'מזהה חדר'}</Text>
          <TextInput
            value={roomCode}
            onChangeText={setRoomCode}
            style={styles.input}
            placeholder="הכנס קוד חדר"
            autoCapitalize="characters"
            placeholderTextColor={colors.textSecondary}
          />
          <MenuButton onPress={enterRoom} text="כנס" />
        </View>
      </Dialog>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
});

export default GameWithFriendsScreen;
