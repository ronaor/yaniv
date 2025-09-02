import {Canvas, Circle, RadialGradient, vec} from '@shopify/react-native-skia';
import {StyleSheet} from 'react-native';
import {DirectionName} from '~/types/cards';
import React, {useEffect} from 'react';
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  useDerivedValue,
} from 'react-native-reanimated';
import {SCREEN_WIDTH, SCREEN_HEIGHT} from '~/utils/constants';

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

  const getPosition = () => {
    switch (direction) {
      case 'down':
        return {cx: SCREEN_WIDTH / 2, cy: SCREEN_HEIGHT};
      case 'up':
        return {cx: SCREEN_WIDTH / 2, cy: 40};
      case 'left':
        return {cx: -70, cy: SCREEN_HEIGHT / 2 - 50};
      case 'right':
        return {cx: SCREEN_WIDTH + 70, cy: SCREEN_HEIGHT / 2 - 50};
    }
  };

  const r = useDerivedValue(() => 200 * scale.value);

  const {cx, cy} = getPosition();

  return (
    <Animated.View style={styles.overlay}>
      <Canvas style={StyleSheet.absoluteFillObject}>
        <Circle cx={cx} cy={cy} r={r}>
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
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: -1,
  },
});

export default LightAround;
