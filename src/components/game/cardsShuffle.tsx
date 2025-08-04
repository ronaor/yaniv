import React, {useEffect} from 'react';
import {StyleSheet} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
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

interface CircularShuffleCardProps {
  direction: 'right' | 'left';
  loops: number;
  startAnimation: boolean;
  delay: number;
}

const MOVE_DUR = 100;
const MOVE_DISTANCE = CARD_WIDTH * 0.5;
const PHASE_DURATION = MOVE_DUR * 4;

const CircularShuffleCard = ({
  direction,
  delay,
  loops,
  startAnimation,
}: CircularShuffleCardProps) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (startAnimation && loops > 0) {
      const xAnimations = [];
      const yAnimations = [];

      // Add initial delay - stay at (0,0)
      if (delay > 0) {
        xAnimations.push(withTiming(0, {duration: delay}));
        yAnimations.push(withTiming(0, {duration: delay}));
      }

      for (let i = 0; i < loops; i++) {
        if (direction === 'right') {
          // Clockwise:  → right → down → left → up → center

          // Clockwise:  → rightX → rightX → centerX → centerX
          xAnimations.push(
            withTiming(MOVE_DISTANCE, {duration: MOVE_DUR}), // right
            withTiming(MOVE_DISTANCE, {duration: MOVE_DUR}), // down
            withTiming(0, {duration: MOVE_DUR}), // left
            withTiming(0, {duration: MOVE_DUR}), // up
          );

          // Clockwise:  → centerY → downY → downY → centerY
          yAnimations.push(
            withTiming(0, {duration: MOVE_DUR}), // right
            withTiming(MOVE_DISTANCE, {duration: MOVE_DUR}), // down
            withTiming(MOVE_DISTANCE, {duration: MOVE_DUR}), // left
            withTiming(0, {duration: MOVE_DUR}), // up
          );
        } else {
          // Counter-clockwise: center → left → down → right → up → center
          xAnimations.push(
            withTiming(-MOVE_DISTANCE, {duration: MOVE_DUR}), // right
            withTiming(-MOVE_DISTANCE, {duration: MOVE_DUR}), // down
            withTiming(0, {duration: MOVE_DUR}), // left
            withTiming(0, {duration: MOVE_DUR}), // up
          );

          // Clockwise:  → centerY → downY → downY → centerY
          yAnimations.push(
            withTiming(0, {duration: MOVE_DUR}), // right
            withTiming(-MOVE_DISTANCE, {duration: MOVE_DUR}), // down
            withTiming(-MOVE_DISTANCE, {duration: MOVE_DUR}), // left
            withTiming(0, {duration: MOVE_DUR}), // up
          );
        }

        // After each loop, add delay to stay still while other card moves
        if (i < loops - 1) {
          xAnimations.push(withTiming(0, {duration: PHASE_DURATION}));
          yAnimations.push(withTiming(0, {duration: PHASE_DURATION}));
        }
      }

      translateX.value = withSequence(...xAnimations);
      translateY.value = withSequence(...yAnimations);
    }
  }, [startAnimation, loops, direction, delay, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}, {translateY: translateY.value}],
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

      // Calculate total duration: each loop has 2 phases (right then left)
      const totalDuration = loops * PHASE_DURATION * 2;

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
      {/* First card - starts immediately, clockwise */}
      <CircularShuffleCard
        direction="right"
        delay={0}
        loops={loops}
        startAnimation={startAnimation}
      />

      {/* Second card - starts after first completes, counter-clockwise */}
      <CircularShuffleCard
        direction="left"
        delay={PHASE_DURATION}
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
