import React, {useEffect} from 'react';
import {StyleSheet} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface ParallaxLayer {
  component: React.ComponentType<any>;
  parallaxFactor: {x: number; y: number};
  props?: any;
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
          zIndex={layers.length - index}
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

  const Component = layer.component;

  return (
    <Animated.View style={[styles.layer, {zIndex}, animatedStyle]}>
      <Component {...(layer.props || {})} />
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
});

export default ParallaxBackground;
