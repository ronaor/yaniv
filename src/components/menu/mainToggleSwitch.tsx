import {
  Canvas,
  Rect,
  LinearGradient as SkiaLinearGradient,
  vec,
} from '@shopify/react-native-skia';
import React, {useCallback, useEffect} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface MenuToggleSwitchProps {
  isOn: boolean;
  setIsOn: (isOn: boolean) => void;
}

function MenuToggleSwitch({isOn, setIsOn}: MenuToggleSwitchProps) {
  const endColor = useSharedValue<string>(isOn ? '#247916' : '#797979ff');
  const startColor = useSharedValue<string>(isOn ? '#9BF931' : '#dededeff');
  const mainColor = useSharedValue<string>(isOn ? '#45AC27' : '#afafafff');
  const ballPosition = useSharedValue<number>(isOn ? 0 : -25);

  const gradientColors = useDerivedValue(() => {
    return [startColor.value, endColor.value];
  });

  const ballStyle = useAnimatedStyle(() => ({
    transform: [{translateX: ballPosition.value}],
  }));

  const toggleStyle = useAnimatedStyle(() => ({
    width: 50,
    height: 25,
    borderRadius: 20,
    backgroundColor: mainColor.value,
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 3,
  }));

  useEffect(() => {
    endColor.value = withTiming(isOn ? '#247916' : '#797979ff');
    startColor.value = withTiming(isOn ? '#9BF931' : '#dededeff');
    mainColor.value = withTiming(isOn ? '#45AC27' : '#afafafff');
    ballPosition.value = withTiming(isOn ? 0 : -25);
  }, [ballPosition, endColor, isOn, mainColor, startColor]);

  const onPress = useCallback(() => setIsOn(!isOn), [isOn, setIsOn]);

  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <View style={styles.gradientContainer}>
        <Canvas style={styles.canvas}>
          <Rect x={0} y={0} width={100} height={100}>
            <SkiaLinearGradient
              start={vec(0, 0)}
              end={vec(0, 30)}
              colors={gradientColors}
            />
          </Rect>
        </Canvas>
        <Animated.View style={toggleStyle}>
          <Animated.View style={[styles.ball, ballStyle]} />
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    backgroundColor: '#631C00',
    padding: 2,
    borderRadius: 20,
  },
  gradientContainer: {
    borderRadius: 20,
    padding: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  ball: {
    aspectRatio: 1,
    width: 20,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
  },
});

export default MenuToggleSwitch;
