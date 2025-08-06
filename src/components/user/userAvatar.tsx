import {StyleSheet, Text, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  withTiming,
  useDerivedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import {
  Canvas,
  interpolateColors,
  Path,
  Skia,
} from '@shopify/react-native-skia';
import {OutlinedText} from '../cartoonText';

interface UserAvatarProps {
  name: string;
  score: number;
  roundScore: number | undefined;
  isActive: boolean;
  timePerPlayer?: number;
}

const CIRCLE_SIZE = 75;

function UserAvatar({
  name,
  score,
  roundScore = 0,
  isActive,
  timePerPlayer,
}: UserAvatarProps) {
  const circleProgress = useSharedValue<number>(0);

  // Round score animation values
  const roundScoreScale = useSharedValue<number>(0);
  const roundScoreX = useSharedValue<number>(-30);
  const scoreScale = useSharedValue<number>(1);
  const [displayScore, setDisplayScore] = useState<number>(score);

  // Timer progress animation
  useEffect(() => {
    if (timePerPlayer && isActive) {
      circleProgress.value = withTiming(1, {duration: timePerPlayer * 1000});
    } else {
      circleProgress.value = withTiming(0, {duration: 200});
    }
  }, [circleProgress, isActive, timePerPlayer]);

  // Round score absorption animation
  useEffect(() => {
    if (roundScore === 0) {
      return;
    }

    // Phase 1: Round score appears
    roundScoreScale.value = withTiming(1, {duration: 400});

    // Phase 2: Move toward score bubble (after 500ms delay)
    setTimeout(() => {
      roundScoreX.value = withTiming(0, {duration: 600});
    }, 500);

    // Phase 3: Absorption animation (after 1200ms total)
    setTimeout(() => {
      // Round score gets absorbed (shrinks)
      roundScoreScale.value = withTiming(0, {duration: 300});

      // Score bubble pulses
      scoreScale.value = withSpring(
        1.3,
        {damping: 12, stiffness: 200},
        finished => {
          if (finished) {
            scoreScale.value = withSpring(1, {damping: 15, stiffness: 150});
          }
        },
      );

      // Update the displayed score
      runOnJS(setDisplayScore)(score + roundScore);
    }, 1000);
  }, [roundScore, score, roundScoreX, roundScoreScale, scoreScale]);

  useEffect(() => {
    if (roundScore === 0) {
      setDisplayScore(score);
    }
  }, [score, roundScore]);

  const progressPath = useDerivedValue(() => {
    const radius = (CIRCLE_SIZE - 5) / 2;
    const centerX = CIRCLE_SIZE / 2;
    const centerY = CIRCLE_SIZE / 2;
    const sweepAngle = circleProgress.value * 360;

    if (sweepAngle === 0) {
      return Skia.Path.Make();
    }

    const path = Skia.Path.Make();
    path.addArc(
      {
        x: centerX - radius,
        y: centerY - radius,
        width: radius * 2,
        height: radius * 2,
      },
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
      {scale: roundScoreScale.value},
    ],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.circleContainer}>
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
      </View>
      <View style={styles.logContainer}>
        <View style={styles.gradientWrap}>
          <LinearGradient
            style={styles.gradient}
            colors={['#E05F0B', '#AE4906', '#AE4906']}>
            <View style={styles.log}>
              <Text style={styles.name}>{name}</Text>
            </View>
          </LinearGradient>
        </View>
        <View>
          <Animated.View style={[styles.gradientScore, scoreStyle]}>
            <Text style={styles.score}>{displayScore}</Text>
          </Animated.View>
          {roundScore > 0 && (
            <Animated.View style={[styles.roundScore, roundScoreStyle]}>
              <OutlinedText
                text={`+${roundScore}`}
                fontSize={16}
                width={30}
                height={30}
                strokeWidth={5}
                fillColor={'#FFFFFF'}
                strokeColor={'#158ac9ff'}
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
    backgroundColor: '#199BC9',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  circleContainer: {
    marginBottom: -8,
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
  logContainer: {},
  name: {
    paddingHorizontal: 5,
    paddingVertical: 3,
    fontSize: 17,
    fontWeight: '900',
    color: '#FDEBC0',
  },
  score: {
    paddingVertical: 2,
    paddingHorizontal: 3,
    fontSize: 13,
    fontWeight: '900',
    color: '#FDEBC0',
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientWrap: {
    borderWidth: 2,
    borderColor: '#732C03',
    backgroundColor: '#732C03',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gradient: {
    paddingVertical: 3,
    borderRadius: 13,
  },
  log: {
    backgroundColor: '#BB550C',
    flexDirection: 'row',
    borderRadius: 13,
    paddingHorizontal: 5,
  },
  scoreContainer: {
    position: 'relative',
  },
  gradientScore: {
    marginTop: -6,
    alignSelf: 'flex-start',
    marginStart: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    borderColor: '#732C03',
    borderWidth: 2,
    backgroundColor: '#E9872A',
    minWidth: 24,
  },
  roundScore: {
    position: 'absolute',
    paddingVertical: 2,
    paddingHorizontal: 3,
    fontSize: 15,
    fontWeight: '900',
    color: '#17a6ffff',
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -14,
    alignSelf: 'flex-start',
    borderRadius: 20,
    minWidth: 24,
  },
});
