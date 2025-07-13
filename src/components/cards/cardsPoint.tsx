import React, {useEffect, useRef} from 'react';
import {ActionSource, Card, Position} from '~/types/cards';
import {CardComponent} from './cardVisual';
import {Dimensions, Pressable, StyleSheet, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {getCardKey} from '~/utils/gameRules';

const {width, height} = Dimensions.get('screen');

interface CardPointsListProps {
  cards: Card[];
  onCardSelect: (index: number) => void;
  slapCardIndex?: number;
  selectedCardsIndexes: number[];
  onCardSlapped: () => void;
  pick?: {
    source: ActionSource;
    position: Position;
  };
}

const CardPointsList = ({
  cards,
  onCardSelect,
  slapCardIndex = -1,
  selectedCardsIndexes,
  onCardSlapped,
  pick,
}: CardPointsListProps) => {
  return (
    <View style={styles.body} pointerEvents="box-none">
      {cards.map((card, index) => (
        <CardPointer
          key={getCardKey(card)}
          cardsLen={cards.length}
          index={index}
          onCardSelect={() => onCardSelect(index)}
          card={card}
          isSelected={selectedCardsIndexes.includes(index)}
          isSlap={index === slapCardIndex}
          onCardSlapped={onCardSlapped}
          pick={pick}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  body: {
    height: height,
    width: width,
    position: 'absolute',
  },
  pointers: {
    position: 'absolute',
  },
});

interface CardPointerProps {
  cardsLen: number;
  index: number;
  onCardSelect: () => void;
  card: Card;
  isSelected: boolean;
  isSlap: boolean;
  onCardSlapped: () => void;
  pick?: {
    source: ActionSource;
    position: Position;
  };
}

const CardPointer = ({
  index,
  cardsLen,
  onCardSelect,
  card,
  isSelected,
  isSlap,
  onCardSlapped,
  pick,
}: CardPointerProps) => {
  const prevStateSelection = useRef<boolean>(false);

  const cardKey = `${card.suit}-${card.value}`;
  const centerIndex = (cardsLen - 1) / 2;
  const shift = index - centerIndex;
  const cardTrY = height + Math.pow(shift, 2) * 2 - 150;

  const targetX = width / 2 - (cardsLen / 2) * 54 + index * 54;

  const translateY = useSharedValue<number>(pick?.position?.y ?? cardTrY);
  const translateX = useSharedValue<number>(pick?.position?.x ?? targetX);
  const cardDeg = useSharedValue<number>(shift * 3);

  useEffect(() => {
    if (prevStateSelection.current !== isSelected) {
      translateY.value = withTiming(isSelected ? cardTrY - 20 : cardTrY); //no using withSpring temporary until will fix this
      prevStateSelection.current = isSelected;
    }
  }, [cardTrY, isSelected, translateY]);

  // Animate to target position
  useEffect(() => {
    const targetRotation = shift * 3;
    translateX.value = withTiming(targetX);
    translateY.value = withTiming(cardTrY);
    cardDeg.value = withTiming(targetRotation);
  }, [cardsLen, shift, cardTrY, translateX, translateY, cardDeg, targetX]);

  const animatedPointerStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
  }));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateY: translateY.value},
      {rotate: `${cardDeg.value}deg`},
    ],
    zIndex: index,
  }));

  return (
    <Animated.View
      key={cardKey}
      style={[styles.pointers, animatedPointerStyle]}>
      <Animated.View style={animatedStyle}>
        <Pressable onPress={isSlap ? onCardSlapped : onCardSelect}>
          <CardComponent card={card} />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

export default CardPointsList;
