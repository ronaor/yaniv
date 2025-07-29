import {StyleSheet, Text, View} from 'react-native';
import React, {useEffect} from 'react';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  useDerivedValue,
} from 'react-native-reanimated';
import {
  Canvas,
  interpolateColors,
  Path,
  Skia,
} from '@shopify/react-native-skia';

interface UserAvatarProps {
  name: string;
  score: number;
  isActive: boolean;
  timePerPlayer: number;
}

const CIRCLE_SIZE = 70;

function UserAvatar({name, score, isActive, timePerPlayer}: UserAvatarProps) {
  const circleProgress = useSharedValue<number>(0);

  useEffect(() => {
    if (isActive) {
      circleProgress.value = withTiming(1, {duration: timePerPlayer * 1000});
    } else {
      circleProgress.value = withTiming(0, {duration: 200});
    }
  }, [circleProgress, isActive, timePerPlayer]);

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

  const circleStyle = useAnimatedStyle(
    () => ({borderColor: isActive ? '#0c7599' : 'white'}),
    [],
  );

  return (
    <View style={styles.container}>
      <View style={styles.circleContainer}>
        <Animated.View style={[circleStyle, styles.circle]} />
        {isActive && (
          <Canvas style={styles.progressCanvas}>
            <Path
              path={progressPath}
              style="stroke"
              strokeWidth={6}
              strokeCap="round"
              color={progressColor}
            />
          </Canvas>
        )}
      </View>
      <View style={styles.gradientWrap}>
        <LinearGradient
          style={styles.gradient}
          colors={['#E05F0B', '#AE4906', '#AE4906']}>
          <View style={styles.log}>
            <Text style={styles.name}>{name}</Text>
          </View>
        </LinearGradient>
      </View>
      <View style={styles.gradientScore}>
        <Text style={styles.score}>{score}</Text>
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
    backgroundColor: '#139AC8',
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
    aspectRatio: 1,
    top: 0,
    left: 0,
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  },
  gradientScore: {
    marginTop: -6,
    alignSelf: 'flex-end',
    marginEnd: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    borderColor: '#732C03',
    borderWidth: 2,
    backgroundColor: '#E9872A',
    minWidth: 23,
  },
});
