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
import {View, ViewStyle} from 'react-native';
import {isUndefined} from 'lodash';
import {useEffect, useState} from 'react';
import {SCREEN_HEIGHT, SCREEN_WIDTH} from '~/utils/constants';

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

  const tailPath = tailPaths[bubbleDirection ?? 'down'];

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
        viewBox="0 0 691 534"
        fill="none"
        style={animatedStyle}
        animatedProps={animatedProps}>
        <Path
          d="M548.5 463.417C462 409.917 421.5 418.917 408 498.917C340.719 431.779 305.416 431.89 246.5 495.917C237 420.417 197 411.417 114.5 459.417C135.46 408.301 119.5 375.917 37.5 383.917C96 334.917 103.5 291.917 35 256.417C109 242.417 125.5 210.417 96 152.917C171 178.417 212.5 153.417 201 92.417C264.5 141.417 296.688 114.732 308.5 50.917C373.186 117.831 401.063 104.066 445 35.417C461.054 135.406 504.646 111.936 578.5 69.917C554.067 158.263 577.396 178.46 662 180.417C590.682 259.288 582 328.417 635.5 377.417C539 366.417 522.469 395.001 548.5 463.417Z"
          fill="#472304"
          stroke="#472304"
          strokeWidth={12}
        />

        <Path d={tailPath} fill="#FFEEC2" stroke="#472304" strokeWidth={12} />
        <Path
          d="M543.12 453.717C459.38 402.929 420.171 411.473 407.102 487.417C341.967 423.683 307.79 423.788 250.754 484.569C241.557 412.897 202.833 404.353 122.964 449.92C143.255 401.395 127.805 370.653 48.4203 378.248C105.054 331.732 112.315 290.912 46 257.212C117.64 243.922 133.613 213.544 105.054 158.96C177.662 183.167 217.838 159.434 206.705 101.527C268.179 148.043 299.341 122.711 310.776 62.1311C373.399 125.652 400.386 112.585 442.922 47.417C458.464 142.336 500.665 120.057 572.164 80.1678C548.51 164.035 571.095 183.207 653 185.065C583.957 259.937 575.552 325.562 627.345 372.077C533.923 361.635 517.92 388.77 543.12 453.717Z"
          fill="#FFEEC2"
        />
        <Image
          x="60"
          y="10"
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
  down: {position: 'absolute', top: SCREEN_HEIGHT - 390, left: 60, zIndex: 5},
  up: {position: 'absolute', top: 170, left: 60, zIndex: 5},
  right: {
    position: 'absolute',
    left: SCREEN_WIDTH - 310,
    top: SCREEN_HEIGHT / 2 - 170,
    zIndex: 5,
  },
  left: {
    position: 'absolute',
    left: 60,
    top: SCREEN_HEIGHT / 2 - 170,
    zIndex: 5,
  },
};

const tailPaths: Record<DirectionName, string> = {
  right:
    'M499 467.917L611 508.918L556 462.418L576.5 453.418L525.5 394.417L474.5 426.918L523 446.417L499 467.917Z',
  left: 'M160.5 464.917L55.0001 495.417L105 456.917L89.0001 446.917L132 396.417L174.5 427.917L137.5 440.917L160.5 464.917Z',
  down: 'M160.5 464.917L55.0001 495.417L105 456.917L89.0001 446.917L132 396.417L174.5 427.917L137.5 440.917L160.5 464.917Z',
  up: 'M234.5 82.7192L130 31.4175L180 82.7192L158 90.4177L202.5 152.417L252 124.917L216 99.9175L234.5 82.7192Z',
};

export default AssafBubble;
