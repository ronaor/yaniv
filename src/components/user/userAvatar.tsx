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
import {Location} from '~/types/cards';

interface UserAvatarProps {
  name: string;
  score: number;
  roundScore: number[] | undefined;
  isActive: boolean;
  timePerPlayer?: number;
  isUser?: boolean;
}

const SECOND = 1000;
const ANIMATION_TIMING = {
  BUMP_DELAY: 700,
  MOVE_DURATION: 500,
  ABSORB_DELAY: 1200,
  ABSORB_DURATION: 150,
  LOOK_MOMENT: 2000,
};
const CIRCLE_SIZE = 60;
const CIRCLE_RADIUS = (CIRCLE_SIZE - 5) / 2;
const CIRCLE_AREA = {
  x: CIRCLE_SIZE / 2 - CIRCLE_RADIUS,
  y: CIRCLE_SIZE / 2 - CIRCLE_RADIUS,
  width: CIRCLE_RADIUS * 2,
  height: CIRCLE_RADIUS * 2,
};
const {width: screenWidth} = Dimensions.get('screen');

function UserAvatar({
  name,
  score,
  roundScore = [],
  isActive,
  timePerPlayer,
  isUser = false,
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
      from: Location & {scale: number} = {x: -30, y: 0, scale: 1},
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
              easing: Easing.bezier(0.0, 0, 1, 0), // Super slow start, explosive finish
            });
          },
          delay: ANIMATION_TIMING.BUMP_DELAY,
        },
        {
          action: () => {
            // Round score gets absorbed instantly (it's moving very fast now)
            roundScoreScale.value = withTiming(0, {
              duration: ANIMATION_TIMING.ABSORB_DURATION,
            });
            // Score bubble pulses with explosive energy
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
        x: screenWidth / 2 - 50,
        y: -39,
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

  const progressPath = useDerivedValue(() => {
    const sweepAngle = circleProgress.value * 360;
    if (sweepAngle === 0) {
      return Skia.Path.Make();
    }
    const path = Skia.Path.Make();
    path.addArc(
      CIRCLE_AREA,
      -90, // Start from top
      sweepAngle,
    );
    return path;
  });

  const progressColor = useDerivedValue(() => {
    return interpolateColors(
      circleProgress.value,
      [0, 0.5, 1],
      ['#00FF00', '#FFFF00', '#FF0000'],
    );
  });

  const circleStyle = {borderColor: isActive ? '#0c7599' : '#16C4DD'};

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

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.circleContainer, avatarStyle]}>
        <Animated.View style={[circleStyle, styles.circle]} />
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
          <Text style={styles.name}>{name}</Text>
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
  );
}

export default UserAvatar;

const styles = StyleSheet.create({
  circle: {
    width: CIRCLE_SIZE,
    aspectRatio: 1,
    borderRadius: 40,
    borderWidth: 5,
    backgroundColor: '#04a8e3ff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  circleContainer: {
    marginBottom: -5,
    position: 'relative',
  },
  progressCanvas: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    top: 0,
    left: 0,
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
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
});
