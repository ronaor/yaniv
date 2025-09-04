import * as React from 'react';
import Svg, {Ellipse, Path, Image} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {DirectionName} from '~/types/cards';
import {View, ViewStyle} from 'react-native';
import {isUndefined} from 'lodash';
import {useEffect, useState} from 'react';
import {SCREEN_HEIGHT, SCREEN_WIDTH} from '~/utils/constants';
import {YANIV_SOUND} from '~/sounds';
import useSound from '~/hooks/useSound';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const springConfig = {
  damping: 15,
  stiffness: 150,
  mass: 1,
};

interface YanivBubbleProps {
  direction?: DirectionName;
}

const YanivBubble = ({direction}: YanivBubbleProps) => {
  const rotation = useSharedValue(-90);
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  const [activeDirection, setActiveDirection] = useState<
    DirectionName | undefined
  >(direction);

  const {playSound} = useSound(YANIV_SOUND);

  const bubbleDirection = activeDirection ?? direction;
  const pivotX =
    bubbleDirection === 'up' || bubbleDirection === 'left' ? 40 : -40;
  const pivotY = bubbleDirection === 'up' ? 120 : -120;

  const tailPath = tailPaths[bubbleDirection ?? 'down'];

  useEffect(() => {
    const visible = !isUndefined(direction);
    if (visible) {
      playSound();
      setActiveDirection(direction);
      rotation.value = activeDirection === 'right' ? -90 : 90;
      rotation.value = withSpring(0, springConfig);
      scale.value = withSpring(1, springConfig);
      opacity.value = withTiming(1, {duration: 300});
    } else {
      // Hide: Animate out + update position after
      rotation.value = withSpring(
        activeDirection === 'right' ? -90 : 90,
        springConfig,
        finished => {
          if (finished) {
            runOnJS(setActiveDirection)(undefined);
          }
        },
      );
      scale.value = withSpring(0.3, springConfig);
      opacity.value = withTiming(0, {duration: 300});
    }
  }, [activeDirection, direction, opacity, playSound, rotation, scale]);
  // Use useAnimatedProps for SVG opacity
  const animatedProps = useAnimatedProps(() => ({
    opacity: opacity.value,
  }));

  // Use useAnimatedStyle for transforms only
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: -pivotX},
      {translateY: -pivotY},
      {rotate: `${rotation.value}deg`},
      {scale: scale.value},
      {translateX: pivotX},
      {translateY: pivotY},
    ],
  }));

  return (
    <View pointerEvents="none" style={bubbleStyle[bubbleDirection ?? 'down']}>
      <AnimatedSvg
        width={200}
        height={150}
        viewBox="0 0 691 534"
        fill="none"
        style={animatedStyle}
        animatedProps={animatedProps}>
        <Ellipse
          cx={343.057}
          cy={276.034}
          rx={288.429}
          ry={205.441}
          transform="rotate(-4 343.057 276.034)"
          fill="#472304"
        />

        <Path d={tailPath} fill="#FFEEC2" stroke="#472304" strokeWidth={12} />

        <Ellipse
          cx={343.984}
          cy={276.724}
          rx={275.716}
          ry={193.021}
          transform="rotate(-4 343.984 276.724)"
          fill="#FFEEC2"
        />

        <Image
          x="40"
          y="30"
          width="610"
          height="500"
          href={require('~/assets/images/yaniv.png')}
          preserveAspectRatio="xMidYMid meet"
        />
      </AnimatedSvg>
    </View>
  );
};

const bubbleStyle: Record<DirectionName, ViewStyle> = {
  down: {position: 'absolute', top: SCREEN_HEIGHT - 380, left: 60, zIndex: 5},
  up: {position: 'absolute', top: 170, left: 50},
  right: {
    position: 'absolute',
    left: SCREEN_WIDTH - 260,
    top: SCREEN_HEIGHT / 2 - 140,
  },
  left: {
    position: 'absolute',
    left: 50,
    top: SCREEN_HEIGHT / 2 - 140,
  },
};

const tailPaths: Record<DirectionName, string> = {
  right:
    'M537.5 317.973C560.41 390.253 575.54 407.066 617.523 436.291C543.907 443.951 494.905 400.584 429 348.78L537.5 317.973Z',
  left: 'M186.194 365.247C161.682 436.405 147.435 453.782 109 485.307C172.696 486.448 218.139 440.786 278.847 385.622L186.194 365.247Z',
  down: 'M186.194 365.247C161.682 436.405 147.435 453.782 109 485.307C172.696 486.448 218.139 440.786 278.847 385.622L186.194 365.247Z',
  up: 'M275.5 103C275.5 65 265.5 48.5 234 14.4998C275.5 21.5 315.5 41 348 89.7655L275.5 103Z',
};

export default YanivBubble;
