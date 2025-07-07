import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  TouchableOpacity,
  Alert,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {LobbyProps, QuickGameLobbyProps} from '~/types/navigation';
import {colors, textStyles} from '~/theme';
import {useRoomStore} from '~/store/roomStore';
import MenuButton from '~/components/menuButton';
import Clipboard from '@react-native-clipboard/clipboard';
import Dialog from '~/components/dialog';
import StartGameDialog from '~/components/startGameDialog';

function QuickGameLobby({navigation}: QuickGameLobbyProps) {
  const {
    roomId,
    players,
    config,
    votes,
    gameState,
    nickName,
    isAdminOfPrivateRoom,
    canStartTimer,
    getRemainingTimeToStartGame,
    leaveRoom,
    startPrivateGame,
  } = useRoomStore();

  const [newRoomModalOpen, setNewRoomModalOpen] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (gameState === 'started') {
      navigation.replace('Game');
    }
  }, [navigation, gameState]);

  useEffect(() => {
    // On unmount, always leave the room
    return () => {
      if (gameState === 'waiting') {
        leaveRoom(nickName);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaveRoom]);

  useEffect(() => {
    if (players.length < 2) {
      setTimeRemaining(0);
      return;
    }

    let targetSeconds = 0;
    if (players.length === 2) {
      targetSeconds = 15;
    } else if (players.length === 3) {
      targetSeconds = 10;
    } else if (players.length >= 4) {
      targetSeconds = 7;
    }

    const startTime = Date.now();
    const endTime = startTime + targetSeconds * 1000;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        // Let the backend handle game start
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [players.length, canStartTimer]);

  // useEffect(() => {
  //   if (!canStartTimer) return;

  //   const interval = setInterval(() => {
  //     const remaining = getRemainingTimeToStartGame();
  //     setTimeRemaining(remaining);

  //     if (remaining <= 0) {
  //       if (players[1].nickName === nickName && roomId)
  //         // startPrivateGame(roomId);
  //         clearInterval(interval);
  //     }
  //   }, 1000);

  //   return () => clearInterval(interval);
  // }, [canStartTimer, getRemainingTimeToStartGame]); // מאזין לזמן חדש שמגיע מהשרת

  const handleLeave = useCallback(() => {
    Alert.alert('יציאה מהמשחק', 'האם אתה בטוח שברצונך לעזוב?', [
      {text: 'ביטול', style: 'cancel'},
      {
        text: 'צא',
        style: 'destructive',
        onPress: () => {
          leaveRoom(nickName);
          navigation.reset({index: 0, routes: [{name: 'Home'}]});
        },
      },
    ]);
  }, [navigation, leaveRoom]);

  return (
    <View style={styles.body}>
      <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
        <Text style={styles.leaveBtnText}>⟵ עזוב</Text>
      </TouchableOpacity>
      <View style={styles.timerContainer}>
        <Text style={[styles.timer]}>{timeRemaining}s</Text>
      </View>

      <Text style={textStyles.subtitle}>{'שחקנים בחדר:'}</Text>
      <View style={styles.playerListContainer}>
        <FlatList
          data={players}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <Text style={styles.player}>{item.nickName}</Text>
          )}
          style={styles.flatList}
        />
      </View>
      <Text style={styles.status}>
        {gameState === 'started'
          ? 'המשחק התחיל!'
          : `ממתין לשחקנים... (${players.length}/4)`}
      </Text>
      <StartGameDialog onCreateRoom={() => {}} isQuickGameLobby />

      {/* <Dialog
        isModalOpen={newRoomModalOpen}
        onBackgroundPress={() => setNewRoomModalOpen(false)}>
        <StartGameDialog onCreateRoom={} />
      </Dialog> */}
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
  playerListContainer: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  player: {
    fontSize: 18,
    color: colors.text,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    textAlign: 'center',
  },
  status: {
    fontSize: 20,
    color: colors.primary,
    marginTop: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  leaveBtnText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  flatList: {width: '100%'},
  timerContainer: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timer: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  timerUrgent: {
    color: '#FF6B6B',
  },
});

export default QuickGameLobby;
