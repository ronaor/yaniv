import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {User} from '~/types/player';
import {normalize} from '~/utils/ui';

interface PlayersListProps {
  players: User[];
}

interface PlayerItemProps {
  player: User;
  index: number;
  isLast: boolean;
}

function PlayerItem({player, index, isLast}: PlayerItemProps) {
  const isOdd = index % 2 === 1;

  return (
    <View
      style={[
        styles.playerItemOuter,
        isOdd ? styles.playerItemOuterOdd : styles.playerItemOuterEven,
        isLast && styles.playerItemOuterLast,
      ]}>
      <View
        style={[
          styles.playerItemInner,
          isOdd ? styles.playerItemInnerOdd : styles.playerItemInnerEven,
          isLast && styles.playerItemInnerLast,
        ]}>
        <View style={styles.playerAvatar} />
        <Text style={styles.playerName}>{player.nickName}</Text>
      </View>
    </View>
  );
}

function PlayersList({players}: PlayersListProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        style={styles.headerGradient}
        colors={['#DE8216', '#702900']}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Players</Text>
        </View>
      </LinearGradient>
      {players.map((player, index) => (
        <PlayerItem
          key={player.id}
          player={player}
          index={index}
          isLast={index === players.length - 1}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#502404',
    padding: 3,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerGradient: {
    backgroundColor: '#843402',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 3,
    paddingTop: 3,
  },
  headerContent: {
    backgroundColor: '#A9500F',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 5,
  },
  headerTitle: {
    color: '#F9F09D',
    fontSize: normalize(22),
    textAlign: 'center',
    fontWeight: '700',
    paddingBottom: 3,
  },
  playerItemOuter: {
    paddingHorizontal: 3,
  },
  playerItemOuterEven: {
    backgroundColor: '#702900',
  },
  playerItemOuterOdd: {
    backgroundColor: '#903300',
  },
  playerItemOuterLast: {
    borderBottomRightRadius: 25,
    borderBottomLeftRadius: 25,
    paddingBottom: 3,
  },
  playerItemInner: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  playerItemInnerEven: {
    backgroundColor: '#7C3709',
  },
  playerItemInnerOdd: {
    backgroundColor: '#AA4E08',
  },
  playerItemInnerLast: {
    borderBottomRightRadius: 25,
    borderBottomLeftRadius: 25,
  },
  playerAvatar: {
    aspectRatio: 1,
    width: 25,
    backgroundColor: '#F7AD02',
    borderRadius: 25,
    borderColor: '#3B1603',
    borderWidth: 2,
  },
  playerName: {
    color: '#F9F09D',
    fontSize: normalize(16),
    textAlign: 'left',
    fontWeight: '700',
  },
});

export default PlayersList;
