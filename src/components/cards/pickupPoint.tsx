import React, {useEffect, useMemo} from 'react';
import {Pressable} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {CardComponent} from './cardVisual';
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
  const targetPos = useMemo<Position>(() => {
    const totalWidth = (totalCards - 1) * CARD_WIDTH;
    const startX = -totalWidth / 2;
    return {x: startX + index * CARD_WIDTH, y: 0, deg: 0};
  }, [index, totalCards]);

  const currentPos = useSharedValue<Position>(fromTarget ?? targetPos);
  const destPos = useSharedValue<Position>(targetPos);
  const progress = useSharedValue<number>(fromTarget ? 0 : 1);

  const scale = useSharedValue(isHidden ? 1 : 1.25);

  useEffect(() => {
    destPos.value = targetPos;
    progress.value = withTiming(1, {duration: MOVE_DURATION}, finished => {
      'worklet';
      if (finished) {
        currentPos.value = destPos.value;
        progress.value = 0;
      }
    });
    scale.value = withTiming(1, {duration: MOVE_DURATION});
  }, [targetPos, currentPos, destPos, progress, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    const x = interpolate(
      progress.value,
      [0, 1],
      [currentPos.value.x, destPos.value.x],
    );
    const y = interpolate(
      progress.value,
      [0, 1],
      [currentPos.value.y, destPos.value.y],
    );
    const deg = interpolate(
      progress.value,
      [0, 1],
      [currentPos.value.deg, destPos.value.deg],
    );

    return {
      position: 'absolute',
      transform: [
        {translateX: x},
        {translateY: y},
        {rotate: `${deg}deg`},
        {scale: scale.value},
      ],
      opacity: index !== 0 && index !== totalCards - 1 ? 0.8 : 1,
    };
  });

  return (
    <Animated.View style={animatedStyle} pointerEvents="box-none">
      <Pressable disabled={disabled} onPress={onPress}>
        <CardComponent card={card} />
      </Pressable>
    </Animated.View>
  );
};

export default PickupPointer;
