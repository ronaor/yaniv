import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import Svg, {Image} from 'react-native-svg';
import {useTimer} from '~/hooks/useTimer';
import {useYanivGameStore} from '~/store/yanivGameStore';
import {OutlinedText} from '../cartoonText';

const image = require('~/assets/images/float.png');

function GameTimer() {
  const {game} = useYanivGameStore();

  const timeRemaining = useTimer(
    true,
    game.currentTurn?.startTime,
    game.rules.timePerPlayer,
    game.phase,
  );
  const styleOpacity = useMemo(
    () =>
      game.phase === 'active'
        ? {
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.25,
            shadowRadius: 5,
            elevation: 5,
          }
        : {opacity: 0},
    [game.phase],
  );

  return (
    <View style={[styles.timerContainer, styleOpacity]}>
      <Svg width={70} height={70} viewBox="0 0 100 100">
        <Image width="100" height="100" href={image} />
        <OutlinedText
          text={`${timeRemaining}`}
          fontSize={30}
          width={100}
          height={98}
          fillColor={'#FFC606'}
          strokeColor={'#5B2500'}
          strokeWidth={4}
          fontWeight={'700'}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  timerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: 70,
  },
  timer: {
    position: 'absolute',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    top: 8,
  },
});
export default GameTimer;
