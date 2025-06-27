import React, {useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {colors, textStyles} from '../theme';
import {useSocketStore} from '../SocketContext';
import {useUser} from '../userContext';

function GameScreen({navigation}: any) {
  const {roomId, players, leaveRoom} = useSocketStore();
  const {name: nickname} = useUser();

  // Handle leave game
  const handleLeave = useCallback(() => {
    Alert.alert(
      'יציאה מהמשחק',
      'האם אתה בטוח שברצונך לעזוב? פעולה זו תגרום להפסד ולא תוכל להצטרף שוב.',
      [
        {text: 'ביטול', style: 'cancel'},
        {
          text: 'צא',
          style: 'destructive',
          onPress: () => {
            leaveRoom();
            navigation.reset({index: 0, routes: [{name: 'Home'}]});
            Alert.alert('יצאת מהמשחק', 'לא תוכל להצטרף שוב לחדר זה.');
          },
        },
      ],
    );
  }, [navigation, leaveRoom]);

  // If player is removed from the room (players no longer includes them), go home
  useEffect(() => {
    if (players && !players.some(p => p.nickname === nickname)) {
      navigation.reset({index: 0, routes: [{name: 'Home'}]});
      Alert.alert('יצאת מהמשחק', 'לא תוכל להצטרף שוב לחדר זה.');
    }
  }, [players, navigation, nickname]);

  return (
    <View style={styles.body}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
          <Text style={styles.leaveBtnText}>⟵ עזוב</Text>
        </TouchableOpacity>
      </View>
      <Text style={textStyles.title}>חדר: {roomId}</Text>
      <Text style={textStyles.subtitle}>שחקנים:</Text>
      <FlatList
        data={players}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <Text style={styles.player}>
            {item.nickname}
            {item.nickname === nickname ? ' (אתה)' : ''}
          </Text>
        )}
        style={styles.playerList}
      />
      <View style={styles.gameArea}>
        <Text style={textStyles.body}>כאן תוצג לוח המשחק (בקרוב)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  leaveBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  leaveBtnText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  playerList: {
    width: '100%',
    marginBottom: 16,
  },
  player: {
    fontSize: 18,
    color: colors.text,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    textAlign: 'center',
  },
  gameArea: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
});

export default GameScreen;
