import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {CardComponent} from './cardVisual';
import {Pressable, StyleSheet} from 'react-native';
import React, {useEffect} from 'react';
import {Card, Position} from '~/types/cards';
import {CARD_WIDTH, MOVE_DURATION} from '~/utils/constants';

interface DiscardPointerProps {
  index: number;
  isThrown: boolean;
  card: Card;
  throwTarget: Position;
}

export const DiscardPointer = ({
  isThrown,
  index,
  card,
  throwTarget,
}: DiscardPointerProps) => {
  const targetX = index * CARD_WIDTH;
  const translateY = useSharedValue<number>(0);
  const translateX = useSharedValue<number>(targetX);
  const cardDeg = useSharedValue<number>(0);

  useEffect(() => {
    if (isThrown) {
      translateX.value = withTiming(throwTarget.x, {duration: MOVE_DURATION});
      translateY.value = withTiming(throwTarget.y, {duration: MOVE_DURATION});
      cardDeg.value = withTiming(throwTarget.deg, {duration: MOVE_DURATION});
    }
  }, [
    translateX,
    translateY,
    cardDeg,
    throwTarget.x,
    throwTarget.y,
    throwTarget.deg,
    isThrown,
    card,
  ]);

  const animatedPointerStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
  }));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateY: translateY.value},
      {rotate: `${cardDeg.value}deg`},
    ],
  }));

  if (!isThrown) {
    return <></>;
  }

  return (
    <Animated.View style={[styles.pointers, animatedPointerStyle]}>
      <Animated.View style={animatedStyle}>
        <CardComponent card={card} />
      </Animated.View>
    </Animated.View>
  );
};

interface PickupPointerProps {
  index: number;
  card: Card;
  fromTarget?: Position;
  onPress: () => void;
  disabled: boolean;
}

export const PickupPointer = ({
  index,
  card,
  fromTarget,
  onPress,
  disabled,
}: PickupPointerProps) => {
  const targetX = index * CARD_WIDTH;
  const translateY = useSharedValue<number>(fromTarget?.y ?? 0);
  const translateX = useSharedValue<number>(fromTarget?.x ?? targetX);
  const cardDeg = useSharedValue<number>(fromTarget?.deg ?? 0);

  useEffect(() => {
    translateX.value = withTiming(targetX, {duration: MOVE_DURATION});
    translateY.value = withTiming(0, {duration: MOVE_DURATION});
    cardDeg.value = withTiming(0, {duration: MOVE_DURATION});
  }, [translateX, translateY, cardDeg, card, targetX]);

  const animatedPointerStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
  }));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateY: translateY.value},
      {rotate: `${cardDeg.value}deg`},
    ],
  }));

  return (
    <Animated.View style={[styles.pointers, animatedPointerStyle]}>
      <Animated.View style={animatedStyle}>
        <Pressable disabled={disabled} onPress={onPress}>
          <CardComponent card={card} />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  pointers: {
    position: 'absolute',
  },
});
