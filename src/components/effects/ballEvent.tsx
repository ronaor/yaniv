import React, {useEffect, useRef} from 'react';
import {Dimensions, StyleSheet} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  withDelay,
} from 'react-native-reanimated';
import Svg, {Image} from 'react-native-svg';
import {DirectionName} from '~/types/cards';
import {getAvatarCenterPosition} from '../user/userAvatar';

const {width: screenWidth, height: screenHeight} = Dimensions.get('screen');

export type ThrowBallEvent = {from: DirectionName; to: DirectionName};

const ANIMATION_TIMING = {
  TRAVEL_DURATION: 240,
  BOUNCE_DURATION: 700,
  EXIT_DURATION: 700,
  CLEANUP_DELAY: 0,
};

const REBOUND_DISTANCE_BASE = (screenWidth + screenHeight) / 2; // pixels
const MAX_BOUNCE_ANGLE_DEG = 18; // small deflection
const ARC_HEIGHT_PX = 60;
const BALL_SIZE = 50;
const SMALL_DELAY = 700;

interface BallEventProps {
  event: ThrowBallEvent;
  delayIndex: number;
  playSound: () => void;
}

function BallEvent({event, delayIndex, playSound}: BallEventProps) {
  const fromPos = getAvatarCenterPosition(event.from);
  const toPos = getAvatarCenterPosition(event.to);

  // Animation values
  const ballX = useSharedValue(fromPos.x);
  const ballY = useSharedValue(fromPos.y);
  const ballScale = useSharedValue(0);
  const ballRotation = useSharedValue(0);
  const ballOpacity = useSharedValue(1);
  const arcOffset = useSharedValue(0);
  const called = useRef<boolean>(false);

  const enterDelay = SMALL_DELAY + Math.max(0, delayIndex * 200); // 👈 deterministic delay

  useEffect(() => {
    if (called.current) {
      return;
    }
    called.current = true;

    // Approach vector + perpendicular
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const px = -uy; // perpendicular
    const py = ux;
    const oppositeX = fromPos.x + -ux * 5;
    const oppositeY = fromPos.y + -uy * 5;

    // 1) Spawn pop-in and give a reverse move
    ballScale.value = withSpring(1, {damping: 12, stiffness: 300});
    ballY.value = fromPos.y;
    ballX.value = fromPos.x;

    setTimeout(playSound, enterDelay);
    // 2) Spin through throw + bounce (starts with the throw)
    ballRotation.value = withDelay(
      enterDelay,
      withTiming(720, {
        // fixed spin for consistency
        duration:
          ANIMATION_TIMING.TRAVEL_DURATION + ANIMATION_TIMING.EXIT_DURATION,
      }),
    );

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
    ballX.value = withSequence(
      withTiming(oppositeX, {duration: enterDelay}),
      withTiming(toPos.x, {
        duration: ANIMATION_TIMING.TRAVEL_DURATION,
        easing: Easing.inOut(Easing.quad),
      }),
    );

    ballY.value = withSequence(
      withTiming(oppositeY, {duration: enterDelay}),
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
          ballY.value = withTiming(bounceY, {
            duration: moveDur,
            easing: Easing.out(Easing.quad),
          });
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
    fromPos.x,
    fromPos.y,
    toPos.x,
    toPos.y,
    enterDelay,
    playSound,
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
