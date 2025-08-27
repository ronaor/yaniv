import React, {useCallback, useEffect} from 'react';
import {Dimensions, StyleSheet, ViewStyle} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  runOnJS,
  withDelay,
} from 'react-native-reanimated';
import Svg, {Image} from 'react-native-svg';
import {DirectionName} from '~/types/cards';

const {width: screenWidth, height: screenHeight} = Dimensions.get('screen');

export type ThrowBallEvent = {from: DirectionName; to: DirectionName};

const recordStyle: Record<DirectionName, ViewStyle> = {
  down: {position: 'absolute', top: screenHeight - 256, left: 10, zIndex: 100},
  up: {position: 'absolute', top: 80, left: 30, zIndex: 100},
  left: {
    position: 'absolute',
    left: 10,
    top: screenHeight / 2 - 20,
    zIndex: 100,
  },
  right: {
    position: 'absolute',
    right: 10,
    top: screenHeight / 2 - 20,
    zIndex: 100,
  },
};

const ANIMATION_TIMING = {
  TRAVEL_DURATION: 240,
  BOUNCE_DURATION: 700,
  EXIT_DURATION: 700,
  CLEANUP_DELAY: 0,
};

const REBOUND_DISTANCE_BASE = screenWidth; // pixels
const MAX_BOUNCE_ANGLE_DEG = 18; // small deflection
const ARC_HEIGHT_PX = 60;
const BALL_SIZE = 50;

interface BallEventProps {
  event: ThrowBallEvent;
  delayIndex: number; // 👈 new: delay multiplier
  onComplete?: () => void;
}

const getPositionFromDirection = (
  direction: DirectionName,
): {x: number; y: number} => {
  const style = recordStyle[direction];
  let x = 0,
    y = 0;
  if (!style || typeof style !== 'object') {
    return {x, y};
  }
  if (typeof style.left === 'number') {
    x = style.left + 40;
  } else if (typeof style.right === 'number') {
    x = screenWidth - style.right - 40;
  }
  if (typeof style.top === 'number') {
    y = style.top + 40;
  } else if (typeof style.bottom === 'number') {
    y = screenHeight - style.bottom - 40;
  }
  return {x, y};
};

function BallEvent({event, delayIndex, onComplete}: BallEventProps) {
  const fromPos = getPositionFromDirection(event.from);
  const toPos = getPositionFromDirection(event.to);

  // Animation values
  const ballX = useSharedValue(fromPos.x);
  const ballY = useSharedValue(fromPos.y);
  const ballScale = useSharedValue(0);
  const ballRotation = useSharedValue(0);
  const ballOpacity = useSharedValue(1);
  const arcOffset = useSharedValue(0);

  const enterDelay = Math.max(0, delayIndex * 200); // 👈 deterministic delay

  const cleanup = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    // 1) Spawn pop-in
    ballScale.value = withSpring(1, {damping: 12, stiffness: 300});

    // 2) Spin through throw + bounce (starts with the throw)
    ballRotation.value = withDelay(
      enterDelay,
      withTiming(720, {
        // fixed spin for consistency
        duration:
          ANIMATION_TIMING.TRAVEL_DURATION + ANIMATION_TIMING.EXIT_DURATION,
      }),
    );

    // Approach vector + perpendicular
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const px = -uy; // perpendicular
    const py = ux;

    // Slightly randomized bounce direction (keeps variety)
    const randDeg = (Math.random() * 2 - 1) * MAX_BOUNCE_ANGLE_DEG; // [-MAX, MAX]
    const a = (randDeg * Math.PI) / 180;
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    // straight back rotated by 'a'
    const bx = -ux * cosA + px * sinA;
    const by = -uy * cosA + py * sinA;

    const bounceX = toPos.x + bx * REBOUND_DISTANCE_BASE;
    const bounceY = toPos.y + by * REBOUND_DISTANCE_BASE;

    // 3) Travel to target (starts after enterDelay)
    ballX.value = withDelay(
      enterDelay,
      withTiming(toPos.x, {
        duration: ANIMATION_TIMING.TRAVEL_DURATION,
        easing: Easing.inOut(Easing.quad),
      }),
    );

    ballY.value = withDelay(
      enterDelay,
      withTiming(
        toPos.y,
        {
          duration: ANIMATION_TIMING.TRAVEL_DURATION,
          easing: Easing.inOut(Easing.quad),
        },
        // === Impact reached: ricochet immediately ===
        finished => {
          if (!finished) {
            return;
          }

          // Impact squash
          ballScale.value = withSequence(
            withTiming(1.18, {
              duration: ANIMATION_TIMING.BOUNCE_DURATION * 0.45,
            }),
            withTiming(1.0, {
              duration: ANIMATION_TIMING.BOUNCE_DURATION * 0.55,
            }),
          );

          // Fade/scale over ricochet
          ballOpacity.value = withTiming(0, {
            duration: ANIMATION_TIMING.EXIT_DURATION,
          });
          ballScale.value = withTiming(0.9, {
            duration: ANIMATION_TIMING.EXIT_DURATION,
          });

          // Y hump during ricochet: 0 -> H -> 0
          arcOffset.value = 0;
          arcOffset.value = withSequence(
            withTiming(ARC_HEIGHT_PX, {
              duration: ANIMATION_TIMING.EXIT_DURATION / 2,
              easing: Easing.out(Easing.quad),
            }),
            withTiming(0, {
              duration: ANIMATION_TIMING.EXIT_DURATION / 2,
              easing: Easing.in(Easing.quad),
            }),
          );

          // Position to ricochet point
          const moveDur = ANIMATION_TIMING.EXIT_DURATION * 0.75;
          ballX.value = withTiming(bounceX, {
            duration: moveDur,
            easing: Easing.out(Easing.quad),
          });
          ballY.value = withTiming(
            bounceY,
            {duration: moveDur, easing: Easing.out(Easing.quad)},
            end => end && runOnJS(cleanup)(),
          );
        },
      ),
    );
  }, [
    ballOpacity,
    ballRotation,
    ballScale,
    ballX,
    ballY,
    arcOffset,
    cleanup,
    fromPos.x,
    fromPos.y,
    toPos.x,
    toPos.y,
    enterDelay,
  ]);

  const ballStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: ballX.value - BALL_SIZE / 2},
      {translateY: ballY.value - BALL_SIZE / 2 - arcOffset.value},
      {scale: ballScale.value},
      {rotate: `${ballRotation.value}deg`},
    ],
    opacity: ballOpacity.value,
  }));

  return (
    <Animated.View style={[styles.ball, ballStyle]}>
      <Svg width={BALL_SIZE} height={BALL_SIZE} viewBox="0 0 90 90">
        <Image
          width="90"
          height="90"
          href={require('~/assets/images/seaBall.png')}
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ball: {
    position: 'absolute',
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    backgroundColor: 'transparent', // image provides the look
  },
});

export default BallEvent;
