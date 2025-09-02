import React, {useEffect} from 'react';
import {Dimensions, ImageSourcePropType, StyleSheet} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const {width: screenWidth, height: screenHeight} = Dimensions.get('screen');

interface ParallaxLayer {
  source: ImageSourcePropType;
  parallaxFactor: {x: number; y: number};
  style?: any;
}

interface ParallaxBackgroundProps {
  lookPosition: {x: number; y: number};
  layers: ParallaxLayer[];
  containerStyle?: any;
  animationDuration?: number;
  animationEasing?: any;
}

function ParallaxBackground({
  lookPosition,
  layers,
  containerStyle,
  animationDuration = 1000,
  animationEasing = Easing.inOut(Easing.cubic),
}: ParallaxBackgroundProps) {
  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {layers.map((layer, index) => (
        <ParallaxLayer
          key={index}
          lookPosition={lookPosition}
          layer={layer}
          zIndex={layers.length - index} // Back to front rendering
          animationDuration={animationDuration}
          animationEasing={animationEasing}
        />
      ))}
    </Animated.View>
  );
}

interface ParallaxLayerProps {
  lookPosition: {x: number; y: number};
  layer: ParallaxLayer;
  zIndex: number;
  animationDuration: number;
  animationEasing?: any;
}

function ParallaxLayer({
  lookPosition,
  layer,
  zIndex,
  animationDuration,
  animationEasing,
}: ParallaxLayerProps) {
  const translateX = useSharedValue(-lookPosition.x * layer.parallaxFactor.x);
  const translateY = useSharedValue(-lookPosition.y * layer.parallaxFactor.y);

  // Animate to new position when lookPosition prop changes
  useEffect(() => {
    const targetX = -lookPosition.x * layer.parallaxFactor.x;
    const targetY = -lookPosition.y * layer.parallaxFactor.y;

    translateX.value = withTiming(targetX, {
      duration: animationDuration,
      easing: animationEasing,
    });

    translateY.value = withTiming(targetY, {
      duration: animationDuration,
      easing: animationEasing,
    });
  }, [
    lookPosition.x,
    lookPosition.y,
    layer.parallaxFactor,
    translateX,
    translateY,
    animationDuration,
    animationEasing,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}, {translateY: translateY.value}],
  }));

  return (
    <Animated.View style={[styles.layer, {zIndex}, animatedStyle]}>
      <Animated.Image
        source={layer.source}
        style={[styles.image, layer.style]}
        resizeMode="cover"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    width: screenWidth * 1.2, // Slightly larger for parallax movement
    height: screenHeight * 1.2,
    position: 'absolute',
    left: -screenWidth * 0.1, // Center the oversized image
    top: -screenHeight * 0.1,
  },
});

export default ParallaxBackground;
