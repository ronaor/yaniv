import {StyleSheet, Text, View, FlatList} from 'react-native';
import React, {useEffect} from 'react';
import {LobbyProps} from '~/types/navigation';
import {colors, textStyles} from '~/theme';
import {useSocketStore} from '~/socketStore';

function LobbyScreen({navigation}: LobbyProps) {
  const {roomId, players, config, gameState, leaveRoom} = useSocketStore();

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

  return (
    <View style={styles.body}>
      <Text style={textStyles.title}>{'חדר: ' + (roomId || '')}</Text>
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
          : `ממתין לשחקנים... (${players.length}/${config?.numPlayers || '?'})`}
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
  loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flatList: {width: '100%'},
});

export default LobbyScreen;
