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
import {LobbyProps} from '~/types/navigation';
import {colors, textStyles} from '~/theme';
import {useRoomStore} from '~/store/roomStore';
import MenuButton from '~/components/menuButton';
import Clipboard from '@react-native-clipboard/clipboard';

function LobbyScreen({navigation}: LobbyProps) {
  const {
    roomId,
    players,
    config,
    gameState,
    nickname,
    isAdminOfPrivateRoom,
    canStartTimer,
    getRemainingTimeToStartGame,
    leaveRoom,
    startPrivateGame,
  } = useRoomStore();

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
        leaveRoom();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaveRoom]);

  useEffect(() => {
    if (!canStartTimer) return;

    const interval = setInterval(() => {
      const remaining = getRemainingTimeToStartGame();
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        if (players[1].nickname === nickname && roomId)
          startPrivateGame(roomId);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [canStartTimer, getRemainingTimeToStartGame]); // מאזין לזמן חדש שמגיע מהשרת

  const handleLeave = useCallback(() => {
    Alert.alert('יציאה מהמשחק', 'האם אתה בטוח שברצונך לעזוב?', [
      {text: 'ביטול', style: 'cancel'},
      {
        text: 'צא',
        style: 'destructive',
        onPress: () => {
          leaveRoom();
          navigation.reset({index: 0, routes: [{name: 'Home'}]});
        },
      },
    ]);
  }, [navigation, leaveRoom]);

  console.log('timeRemaining', timeRemaining);
  return (
    <View style={styles.body}>
      <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
        <Text style={styles.leaveBtnText}>⟵ עזוב</Text>
      </TouchableOpacity>
      <View style={styles.timerContainer}>
        <Text style={[styles.timer]}>{timeRemaining}s</Text>
      </View>
      <Pressable
        onPress={() => {
          if (roomId) {
            Clipboard.setString(roomId);
            alert('קוד החדר הועתק ללוח!');
          }
        }}
        style={{
          marginBottom: 20,
          alignItems: 'center',
          backgroundColor: colors.accent,
          padding: 10,
          borderRadius: 16,
        }}>
        <Text style={textStyles.title}>{'קוד חדר: ' + (roomId || '')}</Text>
      </Pressable>
      <Text style={textStyles.subtitle}>{'שחקנים בחדר:'}</Text>
      <View style={styles.playerListContainer}>
        <FlatList
          data={players}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <Text style={styles.player}>{item.nickname}</Text>
          )}
          style={styles.flatList}
        />
      </View>
      <Text style={styles.status}>
        {gameState === 'started'
          ? 'המשחק התחיל!'
          : `ממתין לשחקנים... (${players.length}/4)`}
      </Text>

      {isAdminOfPrivateRoom && (
        <MenuButton
          onPress={() => roomId && startPrivateGame(roomId)}
          text="התחל משחק!"
          disabled={players.length === 1}
        />
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

export default LobbyScreen;
