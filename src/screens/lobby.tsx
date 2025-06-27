import {StyleSheet, Text, View, FlatList, Alert} from 'react-native';
import React, {useEffect, useState} from 'react';
import {LobbyProps, Player} from '~/types/navigation';
import socket from '../socket';
import {colors, textStyles} from '../theme';

function LobbyScreen({route, navigation}: LobbyProps) {
  const {roomId, players: initialPlayers, config} = route.params;
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    socket.off('player_joined');
    socket.on('player_joined', ({players: updatedPlayers}) => {
      setPlayers(updatedPlayers);
    });
    socket.off('player_left');
    socket.on('player_left', ({players: updatedPlayers}) => {
      setPlayers(updatedPlayers);
    });
    socket.off('start_game');
    socket.on(
      'start_game',
      ({roomId: _roomId, config: _config, players: _players}) => {
        setGameStarted(true);
        Alert.alert('המשחק מתחיל!', 'בהצלחה!');
        // navigation.navigate('Game', {roomId: _roomId, config: _config, players: _players});
      },
    );
    return () => {
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('start_game');
    };
  }, [navigation]);

  return (
    <View style={styles.body}>
      <Text style={textStyles.title}>{'חדר: ' + roomId}</Text>
      <Text style={textStyles.subtitle}>{'שחקנים בחדר:'}</Text>
      <View style={styles.playerListContainer}>
        <FlatList
          data={players}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <Text style={styles.player}>{item.nickname}</Text>
          )}
          style={{width: '100%'}}
        />
      </View>
      <Text style={styles.status}>
        {gameStarted
          ? 'המשחק התחיל!'
          : `ממתין לשחקנים... (${players.length}/${config.numPlayers})`}
      </Text>
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
});

export default LobbyScreen;
