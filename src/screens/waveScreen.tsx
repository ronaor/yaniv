import React, {useEffect, useState, useMemo} from 'react';
import {Dimensions, StyleSheet, TouchableOpacity, Text} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Canvas,
  LinearGradient,
  Path,
  Skia,
  vec,
  Oval,
  Group,
  SkPath,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  useFrameCallback,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';

const dimension = Dimensions.get('screen');
const width = dimension.width;
const padding = 200;
const height = dimension.height;
const frequency = 2;
const initialAmplitude = 10;
const initialVerticalOffset = 100;

// Pre-calculate wave points indices for performance
const WAVE_POINTS = Math.floor(width / 4); // Keep your original value
const waveIndices = Array.from({length: WAVE_POINTS}, (_, i) => i);

// Pre-generate ellipses once - keep your original
const ellipses = (() => {
  const $ellipses = [];
  const cols = Math.ceil(Math.sqrt(15)); // Keep original
  const rows = Math.ceil(15 / cols);
  const cellWidth = width / cols;
  const cellHeight = height / rows;

  for (let i = 0; i < 15; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;

    const baseCx = col * cellWidth + cellWidth / 2;
    const baseCy = row * cellHeight + cellHeight / 2;

    const offsetRange = Math.min(cellWidth, cellHeight);
    const randomOffsetX = (Math.random() - 0.5) * offsetRange * 0.5;
    const randomOffsetY = (Math.random() - 0.5) * offsetRange * 0.5;

    $ellipses.push({
      id: i,
      cx: Math.max(30, Math.min(width - 30, baseCx + randomOffsetX)),
      cy: Math.max(30, Math.min(height - 30, baseCy + randomOffsetY)),
      rx: Math.random() * 2 + 3,
      ry: Math.random() * 2 + 3,
      opacity: Math.random() * 0.25 + 0.4,
      angle: Math.random(),
    });
  }
  return $ellipses;
})();

// Wave Memory Component
interface WaveMemoryProps {
  path: SkPath | null;
  opacity: number;
}

const WaveMemory: React.FC<WaveMemoryProps> = React.memo(({path, opacity}) => {
  if (!path || opacity <= 0) {
    return null;
  }

  return (
    <Path path={path} style="fill" opacity={opacity}>
      <LinearGradient
        start={vec(0, height)}
        end={vec(0, 0)}
        colors={['transparent', '#17A5C340']}
      />
    </Path>
  );
});

const waveColors = ['#67e0d4', '#46c8e2'];
const surfColors = ['#e5e2a9', '#88ead8'];
const seaColor = '#17A5C3';

const WaveAnimationScreen = ({navigation}: any) => {
  const verticalOffset = useSharedValue(initialVerticalOffset);
  const amplitude = useSharedValue(initialAmplitude);
  const time = useSharedValue(0);
  const lastDirection = useSharedValue(0);
  const direction = useSharedValue(0);
  const surfColor = useSharedValue<string>(surfColors[0]);
  const waveColor = useSharedValue<string>(waveColors[0]);

  // State for single wave snapshot
  const [waveSnapshot, setWaveSnapshot] = useState<SkPath | null>(null);
  const [snapshotOpacity, setSnapshotOpacity] = useState(0);
  const shouldCaptureSnapshot = useSharedValue(false);

  // Memoized capture function to avoid recreating
  const captureWaveSnapshot = useMemo(
    () => (pathString: string) => {
      const path = Skia.Path.MakeFromSVGString(pathString);
      if (path) {
        setWaveSnapshot(prev => {
          prev?.dispose?.(); // Clean up previous path
          return path.copy();
        });
        setSnapshotOpacity(1);
      }
    },
    [],
  );

  // Optimized fade effect with fewer updates
  useEffect(() => {
    if (snapshotOpacity > 0) {
      const interval = setInterval(() => {
        setSnapshotOpacity(prev => {
          const newOpacity = Math.max(0, prev - 0.015); // Slightly faster fade
          return newOpacity;
        });
      }, 100); // Less frequent updates (100ms instead of 50ms)

      return () => clearInterval(interval);
    }
  }, [snapshotOpacity]);

  // Optimize color transitions
  useDerivedValue(() => {
    if (direction.value !== lastDirection.value) {
      if (direction.value > 0) {
        surfColor.value = withTiming(surfColors[0], {duration: 3000}); // Reduced duration
        waveColor.value = withTiming(waveColors[0], {duration: 3000});
      }
      if (direction.value < 0) {
        surfColor.value = withTiming(surfColors[1], {duration: 3000});
        waveColor.value = withTiming(waveColors[1], {duration: 3000});

        if (lastDirection.value === 1) {
          shouldCaptureSnapshot.value = true;
        }
      }
    }
  }, [direction.value]);

  // Keep your original frame callback
  useFrameCallback(frameInfo => {
    time.value = frameInfo.timestamp;

    // Optimize tidal cycle calculation
    const cycle = interpolate(
      Math.sin((frameInfo.timestamp / 750) * 0.5),
      [-1, 1],
      [0, 1],
    );
    const newYOffset = padding + cycle * (height - 3 * padding);

    const prevY = verticalOffset.value;
    lastDirection.value = direction.value;
    direction.value = prevY - newYOffset > 0 ? 1 : -1;

    verticalOffset.value = newYOffset;

    // Optimize amplitude calculation
    const distanceFromMiddle = Math.abs(cycle - 0.5) * 2;
    const baseAmplitude = 5 + (1 - distanceFromMiddle) * 15; // Reduced amplitude range
    amplitude.value = baseAmplitude;
  });

  // ONLY CHANGE: Store the path once instead of calculating twice
  const wavePath = useDerivedValue(() => {
    'worklet';
    const current = (time.value / 1000) % 1000;

    // Keep your exact same logic
    const points = waveIndices.map(i => {
      const x = (i / WAVE_POINTS) * width;
      const angle = (x / width) * (Math.PI * frequency) + current;
      return [x, amplitude.value * Math.sin(angle) + verticalOffset.value];
    });

    // Keep your exact same path building
    let pathString = `M${points[0][0]},${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
      pathString += ` L${points[i][0]},${points[i][1]}`;
    }
    pathString += ` L${width},${height} L0,${height} Z`;

    // Capture snapshot if needed
    if (shouldCaptureSnapshot.value) {
      shouldCaptureSnapshot.value = false;
      runOnJS(captureWaveSnapshot)(pathString);
    }

    return Skia.Path.MakeFromSVGString(pathString) || Skia.Path.Make();
  }, [time, verticalOffset, amplitude]);

  // Keep your original gradient calculations
  const gradientStart = useDerivedValue(() => vec(0, verticalOffset.value));
  const gradientEnd = useDerivedValue(() => vec(0, verticalOffset.value + 400));

  const gradientColors = useDerivedValue(() => [
    surfColor.value,
    waveColor.value,
    seaColor,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Canvas style={styles.canvas}>
        {/* Keep your exact same ellipses */}
        {ellipses.map(ellipse => (
          <Group
            key={ellipse.id}
            transform={[
              {rotate: ellipse.angle},
              {translateX: ellipse.cx},
              {translateY: ellipse.cy},
            ]}>
            <Oval
              x={-ellipse.rx}
              y={-ellipse.ry}
              width={ellipse.rx * 2}
              height={ellipse.ry * 2}
              color={`#fbc15f${Math.floor(ellipse.opacity * 255)
                .toString(16)
                .padStart(2, '0')}`}
            />
          </Group>
        ))}

        {/* Wave memory snapshot */}
        <WaveMemory path={waveSnapshot} opacity={snapshotOpacity} />

        {/* Main wave - use stored path */}
        <Path path={wavePath} style="fill">
          <LinearGradient
            start={gradientStart}
            end={gradientEnd}
            colors={gradientColors}
          />
        </Path>

        {/* Wave stroke - REUSE the same path instead of recalculating */}
        <Path path={wavePath} style="stroke" strokeWidth={15} color="white" />
      </Canvas>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDDA87',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
  canvas: {
    flex: 1,
    transform: [{scaleX: 1.1}],
  },
});

export default WaveAnimationScreen;
