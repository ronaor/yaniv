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
    const radius = 32.5; // (75 - 5*2) / 2 = circle radius minus border
    const centerX = 37.5; // 75 / 2
    const centerY = 37.5; // 75 / 2
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

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: isActive ? 'transparent' : 'white',
  }));

  return (
    <View style={styles.container}>
      <View style={styles.circleContainer}>
        <Animated.View style={[animatedStyle, styles.circle]} />
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
      <View style={styles.log}>
        <LinearGradient
          style={styles.gradientLeft}
          colors={['#E9872A', '#821601', '#821601']}>
          <View style={styles.logLeft}>
            <Text style={styles.name}>{name}</Text>
          </View>
        </LinearGradient>
        <LinearGradient
          style={styles.gradientRight}
          colors={['#E9872A', '#E57D21', '#821601']}>
          <View style={styles.logRight}>
            <Text style={styles.score}>{score}</Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

export default UserAvatar;

const styles = StyleSheet.create({
  circle: {
    width: 75,
    aspectRatio: 1,
    borderRadius: 40,
    borderWidth: 5,
    backgroundColor: '#139AC8',
  },
  circleContainer: {
    marginBottom: -8,
    position: 'relative',
  },
  progressCanvas: {
    position: 'absolute',
    width: 75,
    height: 75,
    top: 0,
    left: 0,
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    padding: 5,
    paddingEnd: 7.5,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FDEBC0',
  },
  score: {
    padding: 5,
    paddingStart: 7.5,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FDEBC0',
  },
  gradientRight: {
    paddingEnd: 3,
    paddingVertical: 3,
    borderTopEndRadius: 20,
    borderBottomEndRadius: 20,
    overflow: 'hidden',
  },
  logRight: {
    borderTopEndRadius: 22,
    borderBottomEndRadius: 22,
    backgroundColor: '#ef8e2df0',
    flexDirection: 'row',
  },
  gradientLeft: {
    paddingStart: 3,
    paddingVertical: 3,
    borderTopStartRadius: 20,
    borderBottomStartRadius: 20,
    overflow: 'hidden',
  },
  logLeft: {
    backgroundColor: '#BB550C',
    flexDirection: 'row',
    borderTopStartRadius: 22,
    borderBottomStartRadius: 22,
  },
  log: {
    flexDirection: 'row',
    backgroundColor: '#821601',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
