import Svg, {Image} from 'react-native-svg';
import React, {useEffect} from 'react';

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import {SCREEN_WIDTH} from '~/utils/constants';

const width = 240;
const X = 17 / 24;
const height = width * X;

const titleStyle = {
  paddingVertical: 20,
  paddingHorizontal: 40,
};

interface GameLogoProps {
  enableEnterAnimation?: boolean;
}

function GameLogo({enableEnterAnimation = false}: GameLogoProps) {
  // Animation values
  const opacity = useSharedValue(enableEnterAnimation ? 0 : 1);
  const scale = useSharedValue(enableEnterAnimation ? 0.3 : 1);
  const rotation = useSharedValue(enableEnterAnimation ? -15 : 0);

  // Enter animation
  useEffect(() => {
    if (!enableEnterAnimation) {
      return;
    }

    setTimeout(() => {
      opacity.value = withSpring(1, {damping: 12, stiffness: 80});
      scale.value = withSpring(1, {damping: 8, stiffness: 100});
      rotation.value = withSequence(
        withSpring(8, {damping: 10, stiffness: 120}), // Overshoot rotation
        withSpring(0, {damping: 12, stiffness: 100}), // Settle back
      );
    }, 300); // Start slightly before parallax finishes
  }, [enableEnterAnimation, opacity, scale, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{scale: scale.value}, {rotate: `${rotation.value}deg`}],
  }));

  return (
    <Animated.View style={[titleStyle, animatedStyle]}>
      <Svg
        style={{transform: [{scale: (SCREEN_WIDTH / width) * 0.8}]}}
        width={width}
        height={height}
        viewBox={`0 0 ${3 * width} ${3 * height}`}
        fill="none">
        <Image
          width="710"
          height="500"
          href={require('~/assets/images/title.png')}
          preserveAspectRatio="xMidYMid meet"
        />
      </Svg>
    </Animated.View>
  );
}

export default GameLogo;
