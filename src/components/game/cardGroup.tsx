import React, {useEffect, useMemo} from 'react';
import {Dimensions, StyleSheet, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {Card, Position} from '~/types/cards';
import {CardComponent} from '~/components/cards/cardVisual';
import CardBack from '~/components/cards//cardBack';
import {PlayerId, useYanivGameStore} from '~/store/yanivGameStore';
import {getCardKey} from '~/utils/gameRules';
import {directions, MOVE_DURATION} from '~/utils/constants';
import {calculateCardsPositions} from '~/utils/logic';

const {width: screenWidth, height: screenHeight} = Dimensions.get('screen');

// Center collection point
const COLLECTION_CENTER = {
  x: screenWidth / 2 - 25, // Adjust for card width
  y: screenHeight / 2 - 35, // Adjust for card height
};

interface CardsGroupProps {
  shouldCollect: boolean;
  onComplete: () => void;
}

interface AnimatedCardProps {
  card: Card;
  startPosition: Position;
}

const AnimatedCard = ({card, startPosition}: AnimatedCardProps) => {
  const translateX = useSharedValue(startPosition.x);
  const translateY = useSharedValue(startPosition.y);
  const rotation = useSharedValue(startPosition.deg);
  const flipRotation = useSharedValue(0); // Start showing front

  useEffect(() => {
    flipRotation.value = withTiming(1, {duration: MOVE_DURATION / 2});

    // Move to center
    translateX.value = withTiming(COLLECTION_CENTER.x, {
      duration: MOVE_DURATION,
    });
    translateY.value = withTiming(COLLECTION_CENTER.y, {
      duration: MOVE_DURATION,
    });
    rotation.value = withTiming(0, {
      duration: MOVE_DURATION,
    });
  }, [translateX, translateY, rotation, flipRotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    transform: [
      {translateX: translateX.value},
      {translateY: translateY.value},
      {rotate: `${rotation.value}deg`},
    ],
  }));

  const animatedFrontStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scaleX: flipRotation.value > 0.5 ? 0 : (0.5 - flipRotation.value) * 2,
      },
    ],
  }));

  const animatedBackStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scaleX: flipRotation.value <= 0.5 ? 0 : (flipRotation.value - 0.5) * 2,
      },
    ],
    position: 'absolute',
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Animated.View style={animatedFrontStyle}>
        <CardComponent card={card} />
      </Animated.View>
      <Animated.View style={animatedBackStyle}>
        <CardBack />
      </Animated.View>
    </Animated.View>
  );
};

const CardsGroup = ({shouldCollect, onComplete}: CardsGroupProps) => {
  const {players} = useYanivGameStore();

  const lastHands = useMemo(() => players.handsPrev ?? {}, [players]);

  // Collect all cards and their positions
  const allCardsWithPositions = useMemo(() => {
    if (!shouldCollect) {
      return [];
    }

    const cardsData: Array<{
      card: Card;
      position: Position;
      playerId: string;
    }> = [];

    const updatedCardPositions: Record<PlayerId, Position[]> = {};
    players.order.forEach((playerId, index) => {
      updatedCardPositions[playerId] = calculateCardsPositions(
        lastHands[playerId]?.length ?? 0,
        directions[index],
      );
    });

    players.order.forEach(playerId => {
      const playerCards = lastHands[playerId] || [];
      const playerPositions = updatedCardPositions[playerId] || [];

      playerCards.forEach((card, index) => {
        if (playerPositions[index]) {
          cardsData.push({
            card,
            position: playerPositions[index],
            playerId,
          });
        }
      });
    });

    return cardsData;
  }, [shouldCollect, players.order, lastHands]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, allCardsWithPositions.length * 50 + MOVE_DURATION);

    return () => clearTimeout(timer);
  }, [allCardsWithPositions.length, onComplete]);

  return (
    <View style={styles.container} pointerEvents="none">
      {allCardsWithPositions.map((cardData, index) => (
        <AnimatedCard
          key={`${cardData.playerId}-${getCardKey(cardData.card)}-${index}`}
          card={cardData.card}
          startPosition={cardData.position}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: screenWidth,
    height: screenHeight,
    zIndex: 1000,
  },
});
export default CardsGroup;
