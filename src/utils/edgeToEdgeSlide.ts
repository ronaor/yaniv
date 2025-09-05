// utils/edgeToEdgeSlide.ts
import {Dimensions, Animated} from 'react-native';
import type {StackCardInterpolationProps} from '@react-navigation/stack';

export const Fade = ({current}: StackCardInterpolationProps) => ({
  cardStyle: {
    opacity: current.progress,
    backgroundColor: 'transparent',
  },
});

export const edgeToEdgeSlide = ({
  current,
  next,
  layouts,
  inverted, // Animated node: +1 for 'horizontal', -1 for 'horizontal-inverted'
}: StackCardInterpolationProps) => {
  const W =
    (layouts?.screen?.width as number | undefined) ??
    Dimensions.get('window').width ??
    1;

  // Focused card (incoming on push, outgoing on pop)
  const focusedTranslateX = Animated.multiply(
    current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [W, 0],
    }),
    inverted,
  );

  // Previous card (underneath)
  const prevTranslateX = next
    ? Animated.multiply(
        next.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -W],
        }),
        inverted,
      )
    : (0 as any); // ok for Animated types

  const translateX = next ? prevTranslateX : focusedTranslateX;

  return {
    cardStyle: {
      transform: [{translateX}],
      backgroundColor: 'transparent',
    },
    overlayStyle: {opacity: 0},
    shadowStyle: {opacity: 0},
  };
};
