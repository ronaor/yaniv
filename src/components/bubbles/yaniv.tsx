import * as React from 'react';
import Svg, {Ellipse, Path, Image} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {DirectionName} from '~/types/cards';
import {Dimensions, View, ViewStyle} from 'react-native';
import {isUndefined} from 'lodash';
import {useEffect, useState} from 'react';

const {width: screenWidth, height: screenHeight} = Dimensions.get('screen');

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

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

  const bubbleDirection = activeDirection ?? direction;
  const pivotX =
    bubbleDirection === 'down' || bubbleDirection === 'left' ? 40 : -40;
  const pivotY = bubbleDirection === 'down' ? 120 : -120;

  const tailPath = tailPaths[bubbleDirection ?? 'up'];

  useEffect(() => {
    const visible = !isUndefined(direction);
    if (visible) {
      rotation.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
        mass: 1,
      });
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
        mass: 1,
      });
      opacity.value = withTiming(1, {duration: 300});
    } else {
      rotation.value = withSpring(activeDirection === 'right' ? -90 : 90, {
        damping: 15,
        stiffness: 150,
        mass: 1,
      });
      scale.value = withSpring(0.3, {
        damping: 15,
        stiffness: 150,
        mass: 1,
      });
      opacity.value = withTiming(0, {duration: 300});
    }

    const timeout = setTimeout(() => {
      setActiveDirection(direction);
    }, 500);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rotation, scale, opacity, direction]);

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
    <View pointerEvents="none" style={bubbleStyle[bubbleDirection ?? 'up']}>
      <AnimatedSvg
        width={200}
        height={150}
        viewBox="0 0 605 478"
        fill="none"
        style={animatedStyle}
        animatedProps={animatedProps}>
        <Ellipse
          cx={302.439}
          cy={225.12}
          rx={288.429}
          ry={205.441}
          transform="rotate(-4 302.439 225.12)"
          fill="#472304"
        />

        <Path d={tailPath} fill="#FFEEC2" stroke="#472304" strokeWidth={12} />

        <Ellipse
          cx={303.366}
          cy={225.81}
          rx={275.716}
          ry={193.021}
          transform="rotate(-4 303.366 225.81)"
          fill="#FFEEC2"
        />

        <Image
          x="10"
          y="-20"
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
  up: {position: 'absolute', top: screenHeight - 450, left: 10, zIndex: 5},
  down: {position: 'absolute', top: 110, left: 50},
  right: {
    position: 'absolute',
    left: screenWidth - 220,
    top: screenHeight / 2 - 350,
  },
  left: {
    position: 'absolute',
    left: 10,
    top: screenHeight / 2 - 350,
  },
};

const tailPaths: Record<DirectionName, string> = {
  left: 'M282 401C275.998 419.082 266.621 445.107 254 469C306.189 457.628 328.069 430.173 352 401H282Z',
  up: 'M282 401C275.998 419.082 266.621 445.107 254 469C306.189 457.628 328.069 430.173 352 401H282Z',
  right:
    'M323 401C329.002 419.082 338.379 445.107 351 469C298.811 457.628 276.931 430.173 253 401H323Z',
  down: 'M282 401C275.998 419.082 266.621 445.107 254 469C306.189 457.628 328.069 430.173 352 401H282Z',
};

export default YanivBubble;
