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

interface PickupPointerProps {
  index: number;
  card: Card;
  fromTarget?: Position;
  onPress: () => void;
  disabled: boolean;
  isHidden?: boolean;
}

const PickupPointer = ({
  index,
  card,
  fromTarget,
  onPress,
  disabled,
  isHidden = false,
}: PickupPointerProps) => {
  const targetX = index * CARD_WIDTH;
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

  const animatedPointerStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
  }));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateY: translateY.value},
      {rotate: `${cardDeg.value}deg`},
      {scale: scale.value},
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

export default PickupPointer;
