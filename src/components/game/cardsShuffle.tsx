import React, {useEffect} from 'react';
import {StyleSheet} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import CardBack from '~/components/cards/cardBack';
import {CARD_WIDTH} from '~/utils/constants';

interface CardShuffleProps {
  startAnimation: boolean;
  loops: number;
  onFinish?: () => void;
}

interface ShuffleCardProps {
  direction: 'left' | 'right';
  delay: number;
  loops: number;
  startAnimation: boolean;
}

const MOVE_DUR = 200;
const ShuffleCard = ({
  direction,
  delay,
  loops,
  startAnimation,
}: ShuffleCardProps) => {
  const translateX = useSharedValue(0);

  const targetPosition =
    direction === 'left' ? -CARD_WIDTH * 0.5 : CARD_WIDTH * 0.5;

  useEffect(() => {
    if (startAnimation && loops > 0) {
      // Create animation sequence for multiple loops
      const animations = [];

      for (let i = 0; i < loops; i++) {
        animations.push(
          withTiming(targetPosition, {duration: MOVE_DUR}), // Go out
          withTiming(0, {duration: MOVE_DUR}), // Come back to center
        );
      }

      translateX.value = withDelay(delay, withSequence(...animations));
    }
  }, [startAnimation, loops, delay, targetPosition, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
  }));

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <CardBack />
    </Animated.View>
  );
};

const CardShuffle = ({startAnimation, loops, onFinish}: CardShuffleProps) => {
  const containerRotation = useSharedValue(0);

  useEffect(() => {
    if (startAnimation && loops > 0) {
      // Start with rotation
      containerRotation.value = withTiming(45, {duration: MOVE_DUR});

      // Calculate total animation duration
      const maxDelay = 600; // highest delay
      const totalLoopDuration = loops * MOVE_DUR * 2; // each loop is 800ms (400 out + 400 back)
      const totalDuration = maxDelay + totalLoopDuration;

      // Return rotation to 0 and call onFinish after all animations complete
      setTimeout(() => {
        containerRotation.value = withTiming(0, {duration: 200}, finished => {
          'worklet';
          if (finished && onFinish) {
            runOnJS(onFinish)();
          }
        });
      }, totalDuration);
    }
  }, [startAnimation, loops, containerRotation, onFinish]);

  const shuffleContainerStyle = useAnimatedStyle(() => ({
    transform: [
      {rotate: `${containerRotation.value}deg`},
      {translateX: containerRotation.value},
    ],
  }));

  return (
    <Animated.View style={shuffleContainerStyle}>
      <ShuffleCard
        direction="left"
        delay={600}
        loops={loops}
        startAnimation={startAnimation}
      />

      <ShuffleCard
        direction="right"
        delay={600}
        loops={loops}
        startAnimation={startAnimation}
      />

      <ShuffleCard
        direction="left"
        delay={300}
        loops={loops}
        startAnimation={startAnimation}
      />
      <ShuffleCard
        direction="right"
        delay={300}
        loops={loops}
        startAnimation={startAnimation}
      />
      <ShuffleCard
        direction="right"
        delay={0}
        loops={loops}
        startAnimation={startAnimation}
      />

      <ShuffleCard
        direction="left"
        delay={0}
        loops={loops}
        startAnimation={startAnimation}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
  },
});

export default CardShuffle;
