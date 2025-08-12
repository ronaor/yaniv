import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {User} from '~/types/player';
import {normalize} from '~/utils/ui';
import AlternatingRowsList from '~/components/menu/alternatingRowsList';

interface PlayersListProps {
  players: User[];
}

interface PlayerItemProps {
  player: User;
  isFirst?: boolean;
  isLast?: boolean;
  index?: number;
}

interface PlayersHeaderProps {
  isFirst?: boolean;
  isLast?: boolean;
  index?: number;
}

function PlayersHeader({}: PlayersHeaderProps) {
  return (
    <View style={styles.headerContent}>
      <Text style={styles.headerTitle}>Players</Text>
    </View>
  );
}

function PlayerItem({player}: PlayerItemProps) {
  return (
    <View style={styles.playerItem}>
      <View style={styles.playerAvatar} />
      <Text style={styles.playerName}>{player.nickName}</Text>
    </View>
  );
}

function PlayersList({players}: PlayersListProps) {
  return (
    <AlternatingRowsList>
      <PlayersHeader />
      {players.map(player => (
        <PlayerItem key={player.id} player={player} />
      ))}
    </AlternatingRowsList>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    backgroundColor: '#843402',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 3,
    paddingTop: 3,
  },
  headerContent: {
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
  playerItem: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
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
