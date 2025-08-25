import {StyleSheet, Text, View} from 'react-native';
import {PlayerStatus} from '~/types/player';
import {normalize} from '~/utils/ui';
import React from 'react';
import Animated, {
  FadeInDown,
  FadeOutDown,
  LinearTransition,
} from 'react-native-reanimated';

interface PlayerResultRowProps {
  id: string;
  status: PlayerStatus;
  color: string;
  index: number;
}

const gold = ['#fccd68ff', '#F19E00'];
const silver = ['#CAAE8E', '#AB9579'];
const bronze = ['#E17402', '#B84F00'];
const simple = ['#05ACC4', '#05ACC4'];
const borderColors = [gold, silver, bronze];

function PlayerResultRow({status, color, index}: PlayerResultRowProps) {
  const avatarColors = borderColors[index] ?? simple;
  return (
    <View style={[styles.body, {backgroundColor: color}]}>
      <View style={[styles.avatarWrapper, {borderColor: avatarColors[1]}]}>
        <View style={[styles.avatarCircle, {borderColor: avatarColors[0]}]} />
      </View>
      <View style={styles.nameWrapper}>
        <View style={styles.row}>
          <Text numberOfLines={1} style={styles.nameText}>
            {status.playerName}
          </Text>
          {status.playerStatus === 'playAgain' && (
            <Animated.Text
              entering={FadeInDown}
              exiting={FadeOutDown}
              layout={LinearTransition}
              style={styles.playAgain}>
              {'Lets Play Again'}
            </Animated.Text>
          )}
          {status.playerStatus === 'leave' && (
            <Animated.Text
              entering={FadeInDown}
              exiting={FadeOutDown}
              layout={LinearTransition}
              style={styles.leftTheGame}>
              {'Left the game'}
            </Animated.Text>
          )}
        </View>
        <View style={styles.scoreWrapper}>
          <Text numberOfLines={1} style={styles.scoreText}>
            {status.score}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default PlayerResultRow;

const styles = StyleSheet.create({
  body: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarWrapper: {
    borderWidth: 2,
    borderRadius: 50,
  },
  avatarCircle: {
    borderRadius: 30,
    aspectRatio: 1,
    width: 60,
    backgroundColor: 'white',
    borderWidth: 5,
  },
  nameWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  nameText: {fontSize: normalize(16), fontWeight: '700', color: '#FFFEB6'},
  scoreWrapper: {
    backgroundColor: '#D55F00',
    borderColor: '#582900ff',
    borderWidth: 3,
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 15,
    shadowColor: '#773800ff',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 3.2,
    elevation: 5,
  },
  scoreText: {
    color: '#FFEEBF',
    fontSize: 20,
    fontWeight: '800',
  },
  mark: {alignItems: 'flex-start'},
  playAgain: {color: '#fbf24fff', fontWeight: '700'},
  leftTheGame: {color: '#bca8a8ed', fontWeight: '600'},
  row: {gap: 5},
});
