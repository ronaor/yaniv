import {Canvas, Circle, RadialGradient, vec} from '@shopify/react-native-skia';
import {Dimensions, StyleSheet} from 'react-native';
import {DirectionName} from '~/types/cards';
import React, {useEffect} from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const {width: screenWidth, height: screenHeight} = Dimensions.get('screen');

interface LightAroundProps {
  direction: DirectionName;
}

interface LightAroundProps {
  direction: DirectionName;
  isActive: boolean;
}

function LightAround({direction, isActive}: LightAroundProps) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = isActive
      ? withSpring(1, {damping: 15, stiffness: 150})
      : withTiming(0, {duration: 300});
  }, [isActive, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const getPosition = () => {
    switch (direction) {
      case 'up':
        return {cx: screenWidth / 2, cy: 200};
      case 'down':
        return {cx: screenWidth / 2, cy: screenHeight};
      case 'left':
        return {cx: 0, cy: screenHeight / 2 + 57};
      case 'right':
        return {cx: screenWidth, cy: screenHeight / 2 + 57};
    }
  };

  const {cx, cy} = getPosition();

  return (
    <Animated.View style={[styles.overlay, animatedStyle]}>
      <Canvas style={StyleSheet.absoluteFillObject}>
        <Circle cx={cx} cy={cy} r={200}>
          <RadialGradient
            c={vec(cx, cy)}
            r={200}
            colors={['#2ccaff90', '#FFFFFF70']}
          />
        </Circle>
      </Canvas>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {flex: 1},
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    width: screenWidth,
    height: screenHeight,
    zIndex: -1,
  },
});

export default LightAround;
