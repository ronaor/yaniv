import React, {useEffect, useMemo} from 'react';
import {StyleSheet} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withRepeat,
  withDelay,
  runOnJS,
  SharedValue,
  interpolate,
  useDerivedValue,
  cancelAnimation,
} from 'react-native-reanimated';
import CardBack from '~/components/cards/cardBack';
import {CARD_WIDTH, SMALL_DELAY} from '~/utils/constants';

interface CardShuffleProps {
  startAnimation: boolean;
  startShuffle?: boolean;
  loops: number;
  onFinish?: () => void;
}

interface ShiftedCardProps {
  spread: SharedValue<number>;
  relation?: number; // pixels at spread=1
}

// Keep this tiny and memoized (prevents re-renders)
const ShiftedCard = React.memo(function ShiftedCard({
  spread,
  relation = 0,
}: ShiftedCardProps) {
  const style = useAnimatedStyle(() => {
    const t = interpolate(spread.value, [0, 1], [0, relation]);
    return {
      position: 'absolute',
      transform: [{translateX: t}, {translateY: t}],
    };
  });
  return (
    <Animated.View style={style}>
      <CardBack />
    </Animated.View>
  );
});

const MOVE_DUR = SMALL_DELAY;
const MOVE_DISTANCE = CARD_WIDTH * 0.5;
const PHASE_DURATION = MOVE_DUR * 4;

// Build sequences ONCE, not in effects
const makeShuffle = (dir: 'right' | 'left') => {
  if (dir === 'right') {
    return {
      x: [
        withTiming(0, {duration: PHASE_DURATION}), // initial delay phase
        withTiming(MOVE_DISTANCE, {duration: MOVE_DUR}),
        withTiming(MOVE_DISTANCE, {duration: MOVE_DUR}),
        withTiming(0, {duration: MOVE_DUR}),
        withTiming(0, {duration: MOVE_DUR}),
      ],
      y: [
        withTiming(0, {duration: PHASE_DURATION}), // initial delay phase
        withTiming(0, {duration: MOVE_DUR}),
        withTiming(MOVE_DISTANCE, {duration: MOVE_DUR}),
        withTiming(MOVE_DISTANCE, {duration: MOVE_DUR}),
        withTiming(0, {duration: MOVE_DUR}),
      ],
    };
  }
  // left (counter-clockwise)
  return {
    x: [
      withTiming(-MOVE_DISTANCE, {duration: MOVE_DUR}),
      withTiming(-MOVE_DISTANCE, {duration: MOVE_DUR}),
      withTiming(0, {duration: MOVE_DUR}),
      withTiming(0, {duration: MOVE_DUR}),
      withTiming(0, {duration: PHASE_DURATION}), // trailing delay
    ],
    y: [
      withTiming(0, {duration: MOVE_DUR}),
      withTiming(-MOVE_DISTANCE, {duration: MOVE_DUR}),
      withTiming(-MOVE_DISTANCE, {duration: MOVE_DUR}),
      withTiming(0, {duration: MOVE_DUR}),
      withTiming(0, {duration: PHASE_DURATION}), // trailing delay
    ],
  };
};

interface CircularShuffleCardProps {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  spread: SharedValue<number>;
}

const CircularShuffleCard = ({
  translateX,
  translateY,
  spread,
}: CircularShuffleCardProps) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}, {translateY: translateY.value}],
  }));
  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <ShiftedCard spread={spread} relation={8} />
      <ShiftedCard spread={spread} relation={4} />
      <ShiftedCard spread={spread} relation={0} />
    </Animated.View>
  );
};

const CardShuffle = ({
  startAnimation,
  startShuffle = false,
  loops,
  onFinish,
}: CardShuffleProps) => {
  const spread = useSharedValue(startShuffle ? 1 : 0);

  // derive rotation on UI thread (no per-frame JS)
  const containerRotation = useDerivedValue(() =>
    interpolate(spread.value, [0, 1], [0, 45]),
  );

  const c1TranslateX = useSharedValue(0);
  const c1TranslateY = useSharedValue(0);
  const c2TranslateX = useSharedValue(0);
  const c2TranslateY = useSharedValue(0);

  // precompute sequences (stable)
  const rightSeq = useMemo(() => makeShuffle('right'), []);
  const leftSeq = useMemo(() => makeShuffle('left'), []);

  useEffect(() => {
    // Clean up on unmount
    return () => {
      cancelAnimation(spread);
      cancelAnimation(c1TranslateX);
      cancelAnimation(c1TranslateY);
      cancelAnimation(c2TranslateX);
      cancelAnimation(c2TranslateY);
    };
  }, [c1TranslateX, c1TranslateY, c2TranslateX, c2TranslateY, spread]);

  useEffect(() => {
    if (!startAnimation) {
      return;
    }

    // 1) open (spread: 0 -> 1)
    spread.value = withTiming(1, {duration: MOVE_DUR}, finished => {
      'worklet';
      if (!finished) {
        return;
      }

      // 2) start both card loops entirely on UI thread
      c1TranslateX.value = withRepeat(
        withSequence(...rightSeq.x),
        loops,
        false,
      ) as number;
      c1TranslateY.value = withRepeat(
        withSequence(...rightSeq.y),
        loops,
        false,
      ) as number;
      c2TranslateX.value = withRepeat(
        withSequence(...leftSeq.x),
        loops,
        false,
      ) as number;
      c2TranslateY.value = withRepeat(
        withSequence(...leftSeq.y),
        loops,
        false,
      ) as number;

      // 3) schedule closing & finish without setTimeout/JS bridge
      const total = loops * PHASE_DURATION * 2 + MOVE_DUR; // same math as before

      if (loops > 0) {
        spread.value = withDelay(
          total + 1000,
          withTiming(0, {duration: MOVE_DUR}, done => {
            'worklet';
            if (done && onFinish) {
              runOnJS(onFinish)();
            }
          }),
        );
      }
    });
  }, [
    startAnimation,
    loops,
    onFinish,
    rightSeq,
    leftSeq,
    spread,
    c1TranslateX,
    c1TranslateY,
    c2TranslateX,
    c2TranslateY,
  ]);

  const shuffleContainerStyle = useAnimatedStyle(() => ({
    transform: [
      {rotate: `${containerRotation.value}deg`},
      {translateX: containerRotation.value},
    ],
  }));

  return (
    <Animated.View style={shuffleContainerStyle} pointerEvents="none">
      <CircularShuffleCard
        translateX={c1TranslateX}
        translateY={c1TranslateY}
        spread={spread}
      />
      <CircularShuffleCard
        translateX={c2TranslateX}
        translateY={c2TranslateY}
        spread={spread}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {position: 'absolute'},
});

export default CardShuffle;
