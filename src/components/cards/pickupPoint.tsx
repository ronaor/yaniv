import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {CardComponent} from './cardVisual';
import {Pressable} from 'react-native';
import React, {useEffect} from 'react';
import {Card, Position} from '~/types/cards';
import {CARD_WIDTH, MOVE_DURATION} from '~/utils/constants';

interface PickupPointerProps {
  index: number;
  card: Card;
  fromTarget?: Position;
  onPress: () => void;
  disabled: boolean;
  isHidden?: boolean;
  totalCards: number;
}

const PickupPointer = ({
  index,
  card,
  fromTarget,
  onPress,
  disabled,
  isHidden = false,
  totalCards,
}: PickupPointerProps) => {
  const totalWidth = (totalCards - 1) * CARD_WIDTH;
  const startX = -totalWidth / 2;
  const targetX = startX + index * CARD_WIDTH;

  const translateY = useSharedValue<number>(fromTarget?.y ?? 0);
  const translateX = useSharedValue<number>(fromTarget?.x ?? targetX);
  const cardDeg = useSharedValue<number>(fromTarget?.deg ?? 0);
  const scale = useSharedValue(isHidden ? 1 : 1.25);

  useEffect(() => {
    translateX.value = withTiming(targetX, {duration: MOVE_DURATION});
    translateY.value = withTiming(0, {duration: MOVE_DURATION});
    cardDeg.value = withTiming(0, {duration: MOVE_DURATION});
    scale.value = withTiming(1, {duration: MOVE_DURATION});
  }, [translateX, translateY, cardDeg, card, targetX, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    transform: [
      {translateX: translateX.value},
      {translateY: translateY.value},
      {rotate: `${cardDeg.value}deg`},
      {scale: scale.value},
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable disabled={disabled} onPress={onPress}>
        <CardComponent card={card} />
      </Pressable>
    </Animated.View>
  );
};

export default PickupPointer;
