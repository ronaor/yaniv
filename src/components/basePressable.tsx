import {ReactNode, useCallback} from 'react';
import {Pressable} from 'react-native';
import React from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface BasePressableProps {
  onPress?: () => void;
  prePress?: () => void;
  disabled?: boolean;
  children: ReactNode;
  style?: any;
}

function BasePressable(props: BasePressableProps) {
  const {onPress, style, children, ...rest} = props;
  const scaleAnimation = useSharedValue<number>(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scaleAnimation.value}],
  }));

  const onPressIn = useCallback(() => {
    scaleAnimation.value = withSpring(0.9);
  }, [scaleAnimation]);

  const onPressOut = useCallback(() => {
    scaleAnimation.value = withSpring(1);
  }, [scaleAnimation]);

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      style={style}
      {...rest}>
      <Animated.View style={[animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

export default BasePressable;
