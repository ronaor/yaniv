import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import {CardComponent} from './cardVisual';
import React, {useEffect, useRef} from 'react';
import {Card, Position} from '~/types/cards';
import {CARD_WIDTH, MOVE_DURATION, SMALL_DELAY} from '~/utils/constants';
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
  totalCards: number;
}

export const DiscardPointer = ({
  index,
  card,
  throwTarget,
  opacity,
  totalCards,
}: DiscardPointerProps) => {
  const totalWidth = (totalCards - 1) * CARD_WIDTH;
  const startX = -totalWidth / 2;
  const targetX = startX + index * CARD_WIDTH;

  const lastCard = useRef<Card | undefined>(undefined);
  const progress = useSharedValue<number>(0);
  const destPos = useSharedValue<Position>(throwTarget);

  const animatedStyle = useAnimatedStyle(() => {
    const currentX = interpolate(
      progress.value,
      [0, 1],
      [targetX, destPos.value.x],
    );
    const currentY = interpolate(progress.value, [0, 1], [0, destPos.value.y]);
    const currentDeg = interpolate(
      progress.value,
      [0, 1],
      [0, destPos.value.deg],
    );

    const cardOpacity = interpolate(progress.value, [0, 1], [1, opacity]);

    return {
      position: 'absolute',
      transform: [
        {translateX: currentX},
        {translateY: currentY},
        {rotate: `${currentDeg}deg`},
      ],
      zIndex: index,
      opacity: cardOpacity,
    };
  });

  useEffect(() => {
    if (lastCard.current === card) {
      return;
    }
    lastCard.current = card;
    progress.value = 0;
    destPos.value = throwTarget;
    progress.value = withDelay(
      SMALL_DELAY,
      withTiming(1, {duration: MOVE_DURATION}),
    );
  }, [card, destPos, progress, throwTarget]);

  return (
    <Animated.View style={animatedStyle}>
      <CardComponent card={card} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  pointers: {
    position: 'absolute',
  },
});
