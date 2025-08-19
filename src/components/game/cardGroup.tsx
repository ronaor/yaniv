import React, {useEffect, useMemo} from 'react';
import {Dimensions, StyleSheet, View} from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  interpolate,
  runOnJS,
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
import {calculateRevealCardsPositions} from '~/utils/logic';

const {width: screenWidth, height: screenHeight} = Dimensions.get('screen');

// Center collection point
const COLLECTION_CENTER = {
  x: screenWidth / 2 - 25, // Adjust for card width
  y: screenHeight / 2 - 35, // Adjust for card height
};

// stagger between cards (ms)
const STAGGER = 50;

interface CardsGroupProps {
  shouldCollect: boolean;
  onComplete: () => void;
}

interface AnimatedCardProps {
  card: Card;
  startPosition: Position;
  index: number;
  progress: SharedValue<number>; // shared across all cards
  totalDuration: number; // parent-computed total duration (includes stagger)
}

const AnimatedCard = ({
  card,
  startPosition,
  index,
  progress,
  totalDuration,
}: AnimatedCardProps) => {
  // normalized window for this card within [0..1] global progress
  const startT = (index * STAGGER) / totalDuration;
  const endT = (index * STAGGER + MOVE_DURATION) / totalDuration;

  const animatedStyle = useAnimatedStyle(() => {
    const x = interpolate(
      progress.value,
      [0, startT, endT, 1],
      [
        startPosition.x,
        startPosition.x,
        COLLECTION_CENTER.x,
        COLLECTION_CENTER.x,
      ],
    );
    const y = interpolate(
      progress.value,
      [0, startT, endT, 1],
      [
        startPosition.y,
        startPosition.y,
        COLLECTION_CENTER.y,
        COLLECTION_CENTER.y,
      ],
    );
    const rot = interpolate(
      progress.value,
      [0, startT, endT, 1],
      [startPosition.deg, startPosition.deg, 0, 0],
    );

    return {
      position: 'absolute',
      transform: [{translateX: x}, {translateY: y}, {rotate: `${rot}deg`}],
    };
  });

  // flip finishes halfway through this card's window
  const animatedFrontStyle = useAnimatedStyle(() => {
    const localP = interpolate(progress.value, [startT, endT], [0, 1], 'clamp');
    const flip = interpolate(localP, [0, 0.5, 1], [0, 1, 1]); // 0->1 in first half, then hold
    return {
      transform: [{scaleX: flip > 0.5 ? 0 : (0.5 - flip) * 2}],
    };
  });

  const animatedBackStyle = useAnimatedStyle(() => {
    const localP = interpolate(progress.value, [startT, endT], [0, 1], 'clamp');
    const flip = interpolate(localP, [0, 0.5, 1], [0, 1, 1]);
    return {
      transform: [{scaleX: flip <= 0.5 ? 0 : (flip - 0.5) * 2}],
      position: 'absolute',
    };
  });

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
    const cardsData: Array<{card: Card; position: Position; playerId: string}> =
      [];

    const updatedCardPositions: Record<PlayerId, Position[]> = {};
    players.order.forEach((playerId, index) => {
      updatedCardPositions[playerId] = calculateRevealCardsPositions(
        lastHands[playerId]?.length ?? 0,
        directions[index],
      );
    });

    players.order.forEach(playerId => {
      const playerCards = lastHands[playerId] || [];
      const playerPositions = updatedCardPositions[playerId] || [];
      playerCards.forEach((card, index) => {
        if (playerPositions[index]) {
          cardsData.push({card, position: playerPositions[index], playerId});
        }
      });
    });

    return cardsData;
  }, [shouldCollect, players.order, lastHands]);

  // one shared progress for the whole group
  const progress = useSharedValue(0);

  // totalDuration includes the stagger span so the last card finishes at progress=1
  const totalDuration =
    MOVE_DURATION + Math.max(0, allCardsWithPositions.length - 1) * STAGGER;

  useEffect(() => {
    if (!shouldCollect || allCardsWithPositions.length === 0) {
      return;
    }

    progress.value = 0;
    progress.value = withTiming(
      1,
      {duration: totalDuration, easing: Easing.linear},
      finished => {
        'worklet';
        if (finished) {
          // call back to JS once, right when the whole group is done
          onComplete && runOnJS(onComplete)();
        }
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldCollect, totalDuration, allCardsWithPositions.length]);

  return (
    <View style={styles.container} pointerEvents="none">
      {allCardsWithPositions.map((cardData, index) => (
        <AnimatedCard
          key={`${cardData.playerId}-${getCardKey(cardData.card)}-${index}`}
          card={cardData.card}
          startPosition={cardData.position}
          index={index}
          progress={progress}
          totalDuration={totalDuration}
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
