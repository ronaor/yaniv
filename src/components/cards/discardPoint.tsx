import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {CardComponent} from './cardVisual';
import React, {useEffect} from 'react';
import {Card, Position} from '~/types/cards';
import {CARD_WIDTH, MOVE_DURATION} from '~/utils/constants';
import {StyleSheet} from 'react-native';

interface DiscardedPointerProps {
  card: Card;
  throwTarget: Position;
  opacity: {from: number; to: number};
}

export const DiscardedPointer = ({
  card,
  throwTarget,
  opacity,
}: DiscardedPointerProps) => {
  const pointerStyle = {
    transform: [{translateX: throwTarget.x}],
  };

  const cardOpacity = useSharedValue<number>(opacity.from);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateY: throwTarget.y}, {rotate: `${throwTarget.deg}deg`}],
    opacity: cardOpacity.value,
  }));

  useEffect(() => {
    cardOpacity.value = withTiming(opacity.to, {duration: MOVE_DURATION});
  }, [cardOpacity, opacity.to]);

  return (
    <Animated.View style={[styles.pointers, pointerStyle]}>
      <Animated.View style={animatedStyle}>
        <CardComponent card={card} />
      </Animated.View>
    </Animated.View>
  );
};

interface DiscardPointerProps {
  index: number;
  card: Card;
  throwTarget: Position;
  opacity: number;
}

export const DiscardPointer = ({
  index,
  card,
  throwTarget,
  opacity,
}: DiscardPointerProps) => {
  const targetX = index * CARD_WIDTH;
  const translateY = useSharedValue<number>(0);
  const translateX = useSharedValue<number>(targetX);
  const cardDeg = useSharedValue<number>(0);
  const cardOpacity = useSharedValue<number>(1);

  useEffect(() => {
    translateX.value = withTiming(throwTarget.x, {duration: MOVE_DURATION});
    translateY.value = withTiming(throwTarget.y, {duration: MOVE_DURATION});
    cardDeg.value = withTiming(throwTarget.deg, {duration: MOVE_DURATION});
    cardOpacity.value = withTiming(opacity, {duration: MOVE_DURATION});
  }, [
    translateX,
    translateY,
    cardDeg,
    throwTarget.x,
    throwTarget.y,
    throwTarget.deg,

    card,
    opacity,
    cardOpacity,
  ]);

  const animatedPointerStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
  }));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateY: translateY.value},
      {rotate: `${cardDeg.value}deg`},
    ],
    opacity: cardOpacity.value,
  }));

  return (
    <Animated.View style={[styles.pointers, animatedPointerStyle]}>
      <Animated.View style={animatedStyle}>
        <CardComponent card={card} />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  pointers: {
    position: 'absolute',
  },
});
