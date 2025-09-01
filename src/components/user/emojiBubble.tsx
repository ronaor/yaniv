import React, {useCallback, useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import {Canvas, Circle, RadialGradient, vec} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  useAnimatedStyle,
  Easing,
  withDelay,
} from 'react-native-reanimated';
import EmojiImage from '../emojis/emojiImage';

interface EmojiBubbleProps {
  emojiIndex?: number;
}

function EmojiBubble({emojiIndex = -1}: EmojiBubbleProps) {
  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const translateY = useSharedValue(20);
  const rotation = useSharedValue(0);
  const gradientOpacity = useSharedValue(0);

  const triggerAnimation = useCallback(() => {
    // Reset all values
    opacity.value = 0;
    scale.value = 0;
    translateY.value = 20;
    rotation.value = 0;
    gradientOpacity.value = 0;

    // Enter animation with natural spring curves
    opacity.value = withSpring(1, {
      damping: 12,
      stiffness: 80,
      velocity: 0.5,
    });

    scale.value = withSpring(1, {
      damping: 14,
      stiffness: 100,
      velocity: 0.3,
    });

    translateY.value = withSpring(0, {
      damping: 15,
      stiffness: 120,
      velocity: -0.8,
    });

    gradientOpacity.value = withSpring(1, {
      damping: 10,
      stiffness: 60,
    });

    // Gentle floating rotation during active state
    rotation.value = withSequence(
      withDelay(300, withSpring(3, {damping: 25, stiffness: 40})),
      withSpring(-2, {damping: 25, stiffness: 40}),
      withSpring(1, {damping: 25, stiffness: 40}),
      withSpring(-1, {damping: 25, stiffness: 40}),
    );

    // Auto-exit after 3 seconds with smooth curves
    setTimeout(() => {
      opacity.value = withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });

      scale.value = withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.back(1.5)),
      });

      translateY.value = withTiming(25, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });

      gradientOpacity.value = withTiming(0, {
        duration: 400,
        easing: Easing.out(Easing.quad),
      });

      rotation.value = withTiming(rotation.value + 180, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });
    }, 3000);
  }, [gradientOpacity, opacity, rotation, scale, translateY]);

  // Watch for emojiIndex changes
  useEffect(() => {
    if (emojiIndex >= 0 && emojiIndex <= 8) {
      triggerAnimation();
    }
  }, [emojiIndex, triggerAnimation]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      {scale: scale.value},
      {translateY: translateY.value},
      {rotate: `${rotation.value}deg`},
    ],
  }));

  const gradientStyle = useAnimatedStyle(() => ({
    opacity: gradientOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bubbleContainer, animatedStyle]}>
        {/* Skia Radial Gradient Background */}
        <Animated.View style={[styles.gradientCanvas, gradientStyle]}>
          <Canvas style={styles.canvas}>
            <Circle cx={60} cy={60} r={60}>
              <RadialGradient
                c={vec(60, 60)}
                r={60}
                colors={['#FFFFFF', '#FFFFFF00']}
              />
            </Circle>
          </Canvas>
        </Animated.View>

        {/* Emoji */}
        <View style={styles.emojiContainer}>
          <EmojiImage index={emojiIndex} size={56} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubbleContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gradientCanvas: {
    position: 'absolute',
    width: 120,
    height: 120,
  },
  canvas: {
    width: 120,
    height: 120,
  },
  emojiContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});

export default EmojiBubble;
