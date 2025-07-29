import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTimer} from '~/hooks/useTimer';
import {useYanivGameStore} from '~/store/yanivGameStore';
import {colors} from '~/theme';

function GameTimer() {
  const {game, players: gamePlayers} = useYanivGameStore();

  const isMyTurn = gamePlayers.all[gamePlayers.current]?.isMyTurn;

  const timeRemaining = useTimer(
    isMyTurn,
    game.currentTurn?.startTime,
    game.rules.timePerPlayer,
    game.phase,
  );
  return (
    <View style={styles.timerContainer}>
      {isMyTurn && <Text style={[styles.timer]}>{timeRemaining}s</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  timerContainer: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 40,
  },
  timer: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
export default GameTimer;
