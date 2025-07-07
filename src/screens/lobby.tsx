import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  TouchableOpacity,
  Alert,
} from 'react-native';
import React, {useCallback, useEffect} from 'react';
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
    nickName,
    isAdminOfPrivateRoom,
    leaveRoom,
    startPrivateGame,
    registerCallback,
  } = useRoomStore();

  useEffect(() => {
    registerCallback('kickout', () => {
      navigation.goBack();
    });
  }, [navigation, registerCallback]);

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
  }, [leaveRoom, nickName, navigation]);

  return (
    <View style={styles.body}>
      <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
        <Text style={styles.leaveBtnText}>⟵ עזוב</Text>
      </TouchableOpacity>

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
