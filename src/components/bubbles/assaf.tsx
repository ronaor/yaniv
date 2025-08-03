import * as React from 'react';
import Svg, {Image, Path} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useAnimatedProps,
  runOnJS,
} from 'react-native-reanimated';
import {DirectionName} from '~/types/cards';
import {Dimensions, View, ViewStyle} from 'react-native';
import {isUndefined} from 'lodash';
import {useEffect, useState} from 'react';

const {width: screenWidth, height: screenHeight} = Dimensions.get('screen');

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const springConfig = {
  damping: 15,
  stiffness: 150,
  mass: 1,
};
interface AssafBubbleProps {
  direction?: DirectionName;
}

const AssafBubble = ({direction}: AssafBubbleProps) => {
  const rotation = useSharedValue(-90);
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  const [activeDirection, setActiveDirection] = useState<
    DirectionName | undefined
  >(direction);

  const bubbleDirection = activeDirection ?? direction;

  const pivotX = bubbleDirection === 'right' ? -50 : 50;
  const pivotY = bubbleDirection === 'up' ? 120 : -120;
  useEffect(() => {
    const visible = !isUndefined(direction);

    if (visible) {
      // Show: Update position + animate in
      setActiveDirection(direction);
      rotation.value = direction === 'left' || direction === 'down' ? 90 : -90;
      rotation.value = withSpring(0, springConfig);
      scale.value = withSpring(1, springConfig);
      opacity.value = withTiming(1, {duration: 300});
    } else {
      // Hide: Animate out + update position after
      rotation.value = withSpring(
        activeDirection === 'left' || activeDirection === 'down' ? 90 : -90,
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
  }, [activeDirection, direction, opacity, rotation, scale]);

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

  // Use useAnimatedProps for SVG opacity
  const animatedProps = useAnimatedProps(() => ({
    opacity: opacity.value,
  }));

  return (
    <View pointerEvents="none" style={bubbleStyle[bubbleDirection ?? 'down']}>
      <AnimatedSvg
        width={250}
        height={180}
        viewBox="0 0 660 574"
        fill="none"
        style={animatedStyle}
        animatedProps={animatedProps}>
        <Path
          d="M341.5 480.5L267.5 569.5L290 504L267.5 507L280 437.5C253 454 249 454.5 230.5 477.5C221 402 181 393 98.5 441C119.46 389.884 103.5 357.5 21.5 365.5C80 316.5 87.5 273.5 19 238C93 224 109.5 192 80 134.5C155 160 196.5 135 185 74C248.5 123 280.688 96.3152 292.5 32.5C357.186 99.4139 385.063 85.6487 429 17C445.054 116.989 488.646 93.5194 562.5 51.5C538.067 139.846 561.396 160.043 646 162C574.682 240.871 566 310 619.5 359C523 348 506.469 376.584 532.5 445C446 391.5 405.5 400.5 392 480.5C377.14 460.318 371 448.5 344 433L314 473.5L341.5 480.5Z"
          fill="#FFEEC2"
          stroke="#472304"
          strokeWidth={12}
          transform={bubbleDirection && pathTransform[bubbleDirection]}
        />
        <Image
          translateY={bubbleDirection === 'up' ? 50 : 0}
          x="50"
          y="-10"
          width="610"
          height="500"
          href={require('~/assets/images/assaf.png')}
          preserveAspectRatio="xMidYMid meet"
        />
      </AnimatedSvg>
    </View>
  );
};

const bubbleStyle: Record<DirectionName, ViewStyle> = {
  down: {position: 'absolute', top: screenHeight - 450, left: 0, zIndex: 5},
  up: {position: 'absolute', top: 150, left: 30, zIndex: 5},
  right: {
    position: 'absolute',
    left: screenWidth - 250,
    top: screenHeight / 2 - 330,
    zIndex: 5,
  },
  left: {
    position: 'absolute',
    left: 0,
    top: screenHeight / 2 - 330,
    zIndex: 5,
  },
};

const pathTransform: Record<DirectionName, string | undefined> = {
  left: undefined,
  down: undefined,
  right: 'scale(-1, 1) translate(-660, 0)',
  up: 'scale(1, -1) translate(0, -574)',
};

export default AssafBubble;
