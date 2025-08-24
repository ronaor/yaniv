import Animated, {FadeIn, FadeOut} from 'react-native-reanimated';
import {OutlinedText} from '../cartoonText';
import {Dimensions, StyleSheet} from 'react-native';
import React, {useEffect, useState} from 'react';
import {isUndefined} from 'lodash';

const {width: screenWidth} = Dimensions.get('screen');

interface PlayerHandProps {
  hidden: boolean;
  handValue?: number;
}

const REMOVAL_DELAY = 1000;

function PlayerHand({hidden, handValue}: PlayerHandProps) {
  const [$hidden, $setHidden] = useState<boolean>(false);

  useEffect(() => {
    $setHidden(hidden);
  }, [hidden]);

  useEffect(() => {
    if (!isUndefined(handValue)) {
      return;
    }
    const timeout = setTimeout(() => {
      $setHidden(true);
    }, REMOVAL_DELAY);
    return () => clearTimeout(timeout);
  }, [handValue]);

  if (hidden || $hidden) {
    return null;
  }

  return (
    <Animated.View
      style={styles.playerHand}
      entering={FadeIn}
      exiting={FadeOut}>
      <OutlinedText
        text={`Hand: ${handValue ?? ''}`}
        fontSize={20}
        width={125}
        height={100}
        fillColor={'#ffffffff'}
        strokeColor={'#562e1399'}
        strokeWidth={4}
        fontWeight={'800'}
        textAnchor={'start'}
      />
    </Animated.View>
  );
}

export default PlayerHand;

const styles = StyleSheet.create({
  playerHand: {
    position: 'absolute',
    bottom: 98,
    left: screenWidth / 2 - 80,
    zIndex: 100,
  },
});
