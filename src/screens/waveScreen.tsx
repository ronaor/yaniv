import React from 'react';
import {Dimensions, StyleSheet} from 'react-native';

import {
  Canvas,
  LinearGradient,
  Path,
  Skia,
  vec,
  SkPath,
  Image,
  useImage,
  PathOp,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  useFrameCallback,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

const dimension = Dimensions.get('screen');
const width = dimension.width;

const height = dimension.height;
const frequency = 2;
const initialAmplitude = 10;
const initialVerticalOffset = 100;

// Pre-calculate wave points indices for performance
const WAVE_POINTS = Math.floor(width / 4);
const waveIndices = Array.from({length: WAVE_POINTS}, (_, i) => i);

// Wave range configuration
const waveMaxY = height - 100; // Fixed bottom position
const minYRange = [height - 500, height - 200]; // Range for random minY values

// Function to generate random minY
const generateRandomMinY = () => {
  'worklet';
  return minYRange[0] + Math.random() * (minYRange[1] - minYRange[0]);
};

const waveColors = ['#46c8e2b4', '#46c8e2'];
const surfColors = ['#91f7d56b', '#91f7d5ac'];
const seaColor = '#0087b8f7';

const WaveAnimationBackground = () => {
  const verticalOffset = useSharedValue(initialVerticalOffset);
  const amplitude = useSharedValue(initialAmplitude);
  const time = useSharedValue(0);
  const lastDirection = useSharedValue(0);
  const direction = useSharedValue(0);
  const surfColor = useSharedValue<string>(surfColors[0]);
  const waveColor = useSharedValue<string>(waveColors[0]);

  // Dynamic minY value
  const waveMinY = useSharedValue(generateRandomMinY());

  // State for single wave snapshot
  const snapshotPath = useSharedValue<SkPath>(Skia.Path.Make());
  const snapshotOpacity = useSharedValue(0);
  const shouldCaptureSnapshot = useSharedValue(false);

  // Fade animation for snapshot
  useDerivedValue(() => {
    if (snapshotOpacity.value > 0) {
      snapshotOpacity.value = Math.max(0, snapshotOpacity.value - 0.0015);
    }
  }, [time.value]);

  // Color transitions and snapshot trigger
  useDerivedValue(() => {
    if (direction.value !== lastDirection.value) {
      if (direction.value > 0) {
        surfColor.value = withTiming(surfColors[0], {duration: 3000});
        waveColor.value = withTiming(waveColors[0], {duration: 3000});
      }
      if (direction.value < 0) {
        surfColor.value = withTiming(surfColors[1], {duration: 3000});
        waveColor.value = withTiming(waveColors[1], {duration: 3000});

        // Set flag to capture snapshot in frame callback
        if (lastDirection.value === 1) {
          shouldCaptureSnapshot.value = true;
        }
      }

      // Generate new random minY when wave reaches bottom (changes from down to up)
      if (direction.value > 0 && lastDirection.value < 0) {
        waveMinY.value = generateRandomMinY();
      }
    }
  }, [direction.value]);

  // Frame callback
  useFrameCallback(frameInfo => {
    time.value = frameInfo.timestamp;

    // Tidal cycle calculation
    const cycle = interpolate(
      Math.sin((frameInfo.timestamp / 2000) * 0.5),
      [-1, 1],
      [0, 1],
    );
    const newYOffset = waveMinY.value + cycle * (waveMaxY - waveMinY.value);

    const prevY = verticalOffset.value;
    lastDirection.value = direction.value;
    direction.value = prevY - newYOffset > 0 ? 1 : -1;

    verticalOffset.value = newYOffset;

    // Amplitude calculation
    const distanceFromMiddle = Math.abs(cycle - 0.5) * 2;
    const baseAmplitude = 5 + (1 - distanceFromMiddle) * 15;
    amplitude.value = baseAmplitude;

    // Capture snapshot when flag is set
    if (shouldCaptureSnapshot.value) {
      shouldCaptureSnapshot.value = false;

      const current = (time.value / 1000) % 1000;
      const points = waveIndices.map(i => {
        const x = (i / WAVE_POINTS) * width;
        const angle = (x / width) * (Math.PI * frequency) + current;
        return [x, amplitude.value * Math.sin(angle) + verticalOffset.value];
      });

      let pathString = `M${points[0][0]},${points[0][1]}`;
      for (let i = 1; i < points.length; i++) {
        pathString += ` L${points[i][0]},${points[i][1]}`;
      }
      pathString += ` L${width},${height} L0,${height} Z`;

      const path = Skia.Path.MakeFromSVGString(pathString);
      if (path) {
        snapshotPath.value = path.copy();
        snapshotOpacity.value = 1;
      }
    }
  });

  // Wave path calculation (clean, no snapshot logic)
  const wavePath = useDerivedValue(() => {
    'worklet';
    const current = (time.value / 1000) % 1000;

    const points = waveIndices.map(i => {
      const x = (i / WAVE_POINTS) * width;
      const angle = (x / width) * (Math.PI * frequency) + current;
      return [x, amplitude.value * Math.sin(angle) + verticalOffset.value];
    });

    let pathString = `M${points[0][0]},${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
      pathString += ` L${points[i][0]},${points[i][1]}`;
    }
    pathString += ` L${width},${height} L0,${height} Z`;

    return Skia.Path.MakeFromSVGString(pathString) || Skia.Path.Make();
  }, [time, verticalOffset, amplitude]);

  const maskedSnapshotPath = useDerivedValue(() => {
    'worklet';
    if (snapshotOpacity.value <= 0) {
      return Skia.Path.Make();
    }

    // Create a copy of the snapshot path
    const maskedPath = snapshotPath.value.copy();

    // Subtract the current wave path using path operations
    const currentPath = wavePath.value;
    if (currentPath) {
      // Use path difference operation - try 'Difference' (capital D)
      const result = Skia.Path.MakeFromOp(
        maskedPath,
        currentPath,
        PathOp.Difference,
      );
      return result || Skia.Path.Make();
    }

    return maskedPath;
  }, [snapshotPath.value, wavePath.value, snapshotOpacity.value]);

  // Gradient calculations
  const gradientStart = useDerivedValue(() => vec(0, verticalOffset.value));
  const gradientEnd = useDerivedValue(() => vec(0, verticalOffset.value + 400));

  const gradientColors = useDerivedValue(() => [
    surfColor.value,
    waveColor.value,
    seaColor,
  ]);

  const image = useImage(require('~/assets/images/beach_1.png'));

  return (
    <Canvas style={styles.canvas}>
      {/* Background */}
      <Image
        image={image}
        width={dimension.width}
        height={dimension.height - 50}
        fit={'fill'}
      />

      {/* Wave memory snapshot - masked to exclude current wave area */}
      <Path
        path={maskedSnapshotPath}
        style="fill"
        color={'#17a6c32d'}
        opacity={snapshotOpacity}
      />

      {/* Main wave */}
      <Path path={wavePath} style="fill">
        <LinearGradient
          start={gradientStart}
          end={gradientEnd}
          colors={gradientColors}
        />
      </Path>

      {/* Wave stroke */}
      <Path
        path={wavePath}
        style="stroke"
        transform={[{translateY: -8}]}
        strokeWidth={15}
        color="#FFFFFFF0"
      />
    </Canvas>
  );
};

const styles = StyleSheet.create({
  canvas: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    transform: [{scaleX: 1.05}],
    backgroundColor: '#FDDA87',
  },
});

export default WaveAnimationBackground;
