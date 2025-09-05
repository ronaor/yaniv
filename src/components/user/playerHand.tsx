import Animated, {FadeIn, FadeOut} from 'react-native-reanimated';
import {OutlinedText} from '../cartoonText';
import React, {useEffect, useMemo, useState} from 'react';
import {isUndefined} from 'lodash';
import {getAvatarCenterPosition} from './userAvatar';
import {Platform} from 'react-native';

interface PlayerHandProps {
  hidden: boolean;
  handValue?: number;
}

const REMOVAL_DELAY = 1000;

function PlayerHand({hidden, handValue}: PlayerHandProps) {
  const [$hidden, $setHidden] = useState<boolean>(false);

  const playerHandStyles = useMemo(() => {
    const avatarPos = getAvatarCenterPosition('down');
    return {
      position: 'absolute' as const,
      // Position it to the right of the avatar with some spacing
      left: avatarPos.x + 80 + (Platform.OS === 'android' ? -15 : 0),
      top: avatarPos.y - 30, // 50px above avatar center
    };
  }, []);

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
    <Animated.View style={playerHandStyles} entering={FadeIn} exiting={FadeOut}>
      <OutlinedText
        text={`Hand: ${handValue ?? ''}`}
        fontSize={18}
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
