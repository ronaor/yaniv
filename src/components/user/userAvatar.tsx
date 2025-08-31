import {Dimensions, StyleSheet, Text, View} from 'react-native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import Animated, {
  useSharedValue,
  withTiming,
  useDerivedValue,
  useAnimatedStyle,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import {
  Canvas,
  interpolateColors,
  Path,
  Skia,
} from '@shopify/react-native-skia';
import {OutlinedText} from '../cartoonText';
import {normalize} from '~/utils/ui';
import {DirectionName, Location} from '~/types/cards';
import AvatarImage from './avatarImage';
import {PlayerStatusType} from '~/types/player';
import EmojiBubble from './emojiBubble';

interface UserAvatarProps {
  name: string;
  avatarIndex: number;
  score: number;
  roundScore: number[] | undefined;
  isActive: boolean;
  timePerPlayer?: number;
  isUser?: boolean;
  status: PlayerStatusType;
  kill: boolean;
  direction: DirectionName; // seat & kill direction
  zIndex?: number; // optional stacking override
  emoji?: {
    emojiIndex: number;
    timestamp: number;
  };
}

const SECOND = 1000;
const ANIMATION_TIMING = {
  BUMP_DELAY: 700,
  MOVE_DURATION: 500,
  ABSORB_DELAY: 1200,
  ABSORB_DURATION: 150,
  LOOK_MOMENT: 2000,
};

const CIRCLE_SIZE = 65;
const CANVAS_PADDING = 5;

const CIRCLE_RADIUS = CIRCLE_SIZE / 2;
const CIRCLE_AREA = {
  x: CIRCLE_SIZE / 2 - CIRCLE_RADIUS + CANVAS_PADDING / 2,
  y: CIRCLE_SIZE / 2 - CIRCLE_RADIUS + CANVAS_PADDING / 2,
  width: CIRCLE_RADIUS * 2,
  height: CIRCLE_RADIUS * 2,
};

const {width: screenWidth, height: screenHeight} = Dimensions.get('screen');

/** Internal seating layout — same coordinates you used on the screen */
const seatStyle: Record<DirectionName, any> = {
  down: {position: 'absolute', bottom: 110, left: 10, zIndex: 100},
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

/** Kill (throw-out) constants */
const KILL_DURATION = 4000;
const KILL_DIST_BASE = Math.max(screenWidth, screenHeight) * 0.45; // base throw distance
const KILL_LATERAL_WOBBLE = 30; // px random side wobble
const KILL_SPIN = 1000; // deg

function UserAvatar({
  name,
  avatarIndex,
  score,
  roundScore = [],
  isActive,
  timePerPlayer,
  isUser = false,
  kill,
  direction,
  zIndex = 100,
  emoji,
}: UserAvatarProps) {
  const circleProgress = useSharedValue<number>(0);
  const refRoundScore = useRef<number[]>([]);
  // Round score animation values
  const roundScoreScale = useSharedValue<number>(0);
  const roundScoreX = useSharedValue<number>(-30);
  const roundScoreY = useSharedValue<number>(0);
  const scoreScale = useSharedValue<number>(1);
  const avatarScale = useSharedValue<number>(1);
  const [displayScore, setDisplayScore] = useState<number>(score);
  const [displayAddScore, setDisplayAddScore] = useState<number>(0);

  // Kill wrapper shared values (translate/rotate/scale/opacity)
  const killTx = useSharedValue(0);
  const killTy = useSharedValue(0);
  const killRot = useSharedValue(0);
  const killScale = useSharedValue(1);
  const killOpacity = useSharedValue(1);

  // Timer progress animation
  useEffect(() => {
    if (timePerPlayer && isActive) {
      avatarScale.value = withTiming(1.1);
      circleProgress.value = 0;
      circleProgress.value = withTiming(1, {duration: timePerPlayer * SECOND});
    } else {
      circleProgress.value = withTiming(0, {duration: 200});
      avatarScale.value = withTiming(1);
    }
  }, [avatarScale, circleProgress, isActive, timePerPlayer]);

  const runAnimations = useCallback(
    (phases: {action: () => void; delay?: number}[]) => {
      phases.forEach(({delay, action}) =>
        !delay ? action() : setTimeout(action, delay),
      );
    },
    [],
  );

  const scoreMergingAnimation = useCallback(
    (
      addedScore: number,
      from: Location & {scale: number} = {x: -35, y: 0, scale: 1},
    ) => {
      // Reset position
      roundScoreScale.value = 0;
      roundScoreX.value = from.x;
      roundScoreY.value = from.y;

      runAnimations([
        {
          // Phase 1: Bump in with bounce effect
          action: () => {
            setDisplayAddScore(addedScore);
            roundScoreScale.value = withSpring(from.scale, {
              damping: 10,
              stiffness: 200,
              mass: 0.8,
            });
          },
        },
        {
          // Phase 2: After brief pause, accelerate toward score bubble
          action: () => {
            roundScoreX.value = withTiming(0, {
              duration: ANIMATION_TIMING.MOVE_DURATION,
              easing: Easing.bezier(0.0, 0, 1, 0), // Super slow start, explosive finish
            });
            roundScoreY.value = withTiming(0, {
              duration: ANIMATION_TIMING.MOVE_DURATION,
              easing: Easing.bezier(0.0, 0, 1, 0),
            });
            roundScoreScale.value = withTiming(1, {
              duration: ANIMATION_TIMING.MOVE_DURATION,
            });
          },
          delay: ANIMATION_TIMING.BUMP_DELAY,
        },
        {
          action: () => {
            // Round score gets absorbed instantly
            roundScoreScale.value = withTiming(0, {
              duration: ANIMATION_TIMING.ABSORB_DURATION,
            });
            // Score bubble pulse
            scoreScale.value = withTiming(1.25, {duration: 200}, finished => {
              if (finished) {
                scoreScale.value = withSpring(1, {damping: 10, stiffness: 200});
              }
            });
            setDisplayScore(prev => prev + addedScore);
          },
          delay: ANIMATION_TIMING.ABSORB_DELAY,
        },
      ]);
    },
    [roundScoreScale, roundScoreX, roundScoreY, runAnimations, scoreScale],
  );

  // Round score absorption animation
  useEffect(() => {
    if (roundScore.length === 0 || refRoundScore.current === roundScore) {
      return;
    }
    refRoundScore.current = roundScore;

    if (isUser) {
      scoreMergingAnimation(roundScore[0], {
        x: screenWidth / 2 - 60,
        y: -16,
        scale: 1.48,
      });
    } else {
      scoreMergingAnimation(roundScore[0]);
    }
    let i = 1;
    const interval = setInterval(() => {
      if (i < roundScore.length) {
        scoreMergingAnimation(roundScore[i]);
        i += 1;
      } else {
        clearInterval(interval);
      }
    }, ANIMATION_TIMING.LOOK_MOMENT);

    return () => clearInterval(interval);
  }, [isUser, roundScore, scoreMergingAnimation]);

  useEffect(() => {
    if (roundScore.length === 0) {
      setDisplayScore(score);
    }
  }, [score, roundScore]);

  /** ----- KILL (throw-out) animation ----- */
  useEffect(() => {
    // Direction unit vector
    const dirMap: Record<DirectionName, {x: number; y: number}> = {
      up: {x: -1, y: -1},
      down: {x: -1, y: 2},
      left: {x: -1, y: 0},
      right: {x: 1, y: 0},
    };
    const d = dirMap[direction] ?? {x: 0, y: -1};

    if (kill) {
      // randomized distance & lateral wobble
      const dist = KILL_DIST_BASE * (0.85 + Math.random() * 0.5);
      const wobbleX = (Math.random() - 0.5) * KILL_LATERAL_WOBBLE;
      const wobbleY = (Math.random() - 0.5) * KILL_LATERAL_WOBBLE;

      // directional spin sign (left/right mirror)
      const spinSign =
        direction === 'left'
          ? -1
          : direction === 'right'
          ? 1
          : Math.random() < 0.5
          ? -1
          : 1;
      const spins = KILL_SPIN * spinSign;

      // animate out
      killTx.value = withTiming(d.x * dist + wobbleX, {
        duration: KILL_DURATION,
        easing: Easing.out(Easing.quad),
      });
      killTy.value = withTiming(d.y * dist + wobbleY, {
        duration: KILL_DURATION,
        easing: Easing.out(Easing.quad),
      });
      killRot.value = withTiming(spins, {
        duration: KILL_DURATION,
        easing: Easing.out(Easing.quad),
      });
      killScale.value = withTiming(0.9, {duration: KILL_DURATION});
      killOpacity.value = withTiming(0.6, {duration: KILL_DURATION});
    } else {
      // reset back to seat
      killTx.value = withTiming(0, {duration: 250});
      killTy.value = withTiming(0, {duration: 250});
      killRot.value = withTiming(0, {duration: 250});
      killScale.value = withTiming(1, {duration: 250});
      killOpacity.value = withTiming(1, {duration: 250});
    }
  }, [kill, direction, killTx, killTy, killRot, killScale, killOpacity]);

  /** Progress ring values */
  const progressPath = useDerivedValue(() => {
    const sweepAngle = circleProgress.value * 360;
    if (sweepAngle === 0) {
      return Skia.Path.Make();
    }
    const path = Skia.Path.Make();
    path.addArc(CIRCLE_AREA, -90, sweepAngle);
    return path;
  });

  const progressColor = useDerivedValue(() => {
    return interpolateColors(
      circleProgress.value,
      [0, 0.5, 1],
      ['#00FF00', '#FFFF00', '#FF0000'],
    );
  });

  /** Visual styles */
  const circleStyle = {
    width: isActive ? CIRCLE_SIZE + CANVAS_PADDING : CIRCLE_SIZE,
  };

  const scoreStyle = useAnimatedStyle(() => ({
    transform: [{scale: scoreScale.value}],
  }));

  const roundScoreStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: roundScoreX.value},
      {translateY: roundScoreY.value},
      {scale: roundScoreScale.value},
    ],
  }));

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{scale: avatarScale.value}],
  }));

  const killedWrapperStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: killTx.value},
      {translateY: killTy.value},
      {rotate: `${killRot.value}deg`},
      {scale: killScale.value},
    ],
    opacity: killOpacity.value,
  }));

  return (
    <Animated.View
      style={[seatStyle[direction], {zIndex}, killedWrapperStyle]}
      pointerEvents={kill ? 'none' : 'auto'} // optional: ignore touches while flying out
    >
      <View style={styles.container}>
        <Animated.View
          pointerEvents="none"
          style={[styles.circleContainer, avatarStyle]}>
          <Animated.View style={[styles.circle, circleStyle]}>
            <AvatarImage size={CIRCLE_SIZE - 5} index={avatarIndex} />
            <View style={styles.emoji}>
              <EmojiBubble emojiIndex={emoji?.emojiIndex} />
            </View>
          </Animated.View>

          {isActive && (
            <Canvas style={styles.progressCanvas}>
              <Path
                path={progressPath}
                style="stroke"
                strokeWidth={5}
                strokeCap="round"
                color={progressColor}
              />
            </Canvas>
          )}
        </Animated.View>

        <View>
          <View style={styles.gradientWrap}>
            <Text
              numberOfLines={1}
              style={[
                styles.name,
                {fontSize: normalize(name.length > 5 ? 11 : 13)},
              ]}>
              {name}
            </Text>
          </View>
          <View>
            <Animated.View style={[styles.gradientScore, scoreStyle]}>
              <Text style={styles.score}>{displayScore}</Text>
            </Animated.View>
            {roundScore.length > 0 && (
              <Animated.View style={[styles.roundScore, roundScoreStyle]}>
                <OutlinedText
                  text={`${displayAddScore >= 0 ? '+' : ''}${displayAddScore}`}
                  fontSize={14}
                  width={50}
                  height={30}
                  strokeWidth={4}
                  fillColor={'#FFFFFF'}
                  strokeColor={`${
                    displayAddScore >= 0 ? '#158ac9ff' : '#15c924ff'
                  }`}
                  fontWeight={'900'}
                />
              </Animated.View>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default UserAvatar;

const styles = StyleSheet.create({
  circle: {
    width: CIRCLE_SIZE,
    aspectRatio: 1,
    borderRadius: 40,
    borderWidth: 5,
    backgroundColor: '#FDE5B8',
    borderColor: '#732C03',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 1,
  },
  circleContainer: {
    marginBottom: -5,
    position: 'relative',
  },
  progressCanvas: {
    position: 'absolute',
    width: CIRCLE_SIZE + CANVAS_PADDING,
    height: CIRCLE_SIZE + CANVAS_PADDING,
    top: 0,
    left: 0,
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    aspectRatio: 1,
    width: CIRCLE_SIZE * 1.5,
    top: 0,
  },
  name: {
    fontSize: normalize(13),
    fontWeight: '900',
    color: '#FDEBC0',
  },
  score: {
    paddingVertical: 2,
    paddingHorizontal: 3,
    fontSize: 12,
    fontWeight: '900',
    color: '#FDEBC0',
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientWrap: {
    borderWidth: 2,
    borderColor: '#732C03',
    backgroundColor: '#BB550C',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  gradient: {
    paddingVertical: 3,
    borderRadius: 13,
  },
  scoreContainer: {
    position: 'relative',
  },
  gradientScore: {
    marginTop: -6,
    alignSelf: 'flex-end',
    marginEnd: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    borderColor: '#994a00ff',
    borderWidth: 2,
    backgroundColor: '#E9872A',
    minWidth: 24,
  },
  roundScore: {
    position: 'absolute',
    paddingVertical: 2,
    paddingHorizontal: 3,
    fontSize: normalize(10),
    fontWeight: '900',
    color: '#17a6ffff',
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -13,
    marginEnd: 8,
    alignSelf: 'flex-end',
    borderRadius: 20,
    minWidth: 24,
  },
  emoji: {position: 'absolute', zIndex: 200},
});

/**
 * Calculate avatar center position from direction using the same seatStyle constants
 * This ensures consistency with the component's positioning
 */
export const getAvatarCenterPosition = (
  direction: DirectionName,
): {x: number; y: number} => {
  const style = seatStyle[direction];
  let x = 0,
    y = 0;

  if (!style || typeof style !== 'object') {
    return {x, y};
  }

  // Calculate X position
  if (typeof style.left === 'number') {
    x = style.left + CIRCLE_SIZE / 2;
  } else if (typeof style.right === 'number') {
    x = screenWidth - style.right - CIRCLE_SIZE / 2;
  }

  // Calculate Y position
  if (typeof style.top === 'number') {
    y = style.top + CIRCLE_SIZE / 2;
  } else if (typeof style.bottom === 'number') {
    y = screenHeight - style.bottom - CIRCLE_SIZE / 2;
  }

  return {x, y};
};
