import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {CardComponent} from './cardVisual';
import {Pressable, StyleSheet} from 'react-native';
import React, {useEffect} from 'react';
import {Card, Position} from '~/types/cards';

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
  const targetX = index * 54;
  const translateY = useSharedValue<number>(0);
  const translateX = useSharedValue<number>(targetX);
  const cardDeg = useSharedValue<number>(0);
  const opacity = useSharedValue<number>(1);

  useEffect(() => {
    if (isThrown) {
      const targetRotation = Math.random() * 20;
      translateX.value = withTiming(throwTarget.x);
      translateY.value = withTiming(throwTarget.y);
      cardDeg.value = withTiming(targetRotation);
      opacity.value = withTiming(0.75);
    }
  }, [
    translateX,
    translateY,
    cardDeg,
    throwTarget.x,
    throwTarget.y,
    isThrown,
    card,
    opacity,
  ]);

  const animatedPointerStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
  }));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateY: translateY.value},
      {rotate: `${cardDeg.value}deg`},
    ],
    opacity: opacity.value,
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
  fromTarget?: Position & {deg: number};
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
  const targetX = index * 54;
  const translateY = useSharedValue<number>(fromTarget?.y ?? 0);
  const translateX = useSharedValue<number>(fromTarget?.x ?? targetX);
  const cardDeg = useSharedValue<number>(fromTarget?.deg ?? 0);

  console.log('fromTarget', fromTarget);
  useEffect(() => {
    translateX.value = withTiming(targetX);
    translateY.value = withTiming(0);
    cardDeg.value = withTiming(0);
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
