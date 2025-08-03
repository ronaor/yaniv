import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Dimensions, StyleSheet, View} from 'react-native';
import CardBack from '~/components/cards/cardBack';
import {CARD_HEIGHT, CARD_WIDTH} from '~/utils/constants';
import {DirectionName, Location, Position} from '~/types/cards';

import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {noop} from 'lodash';

const {width: screenWidth, height: screenHeight} = Dimensions.get('screen');

// All cards share the same center, radius, and positioning logic
const CIRCLE_CENTER = {x: screenWidth / 2, y: screenHeight / 2};
const CIRCLE_RADIUS = CARD_HEIGHT;

// Function to get position from angle
const getCardLocationFromAngle = (angle: number): Location => {
  'worklet';
  const adjustedAngle = angle - Math.PI / 2;
  const x =
    CIRCLE_CENTER.x + Math.cos(adjustedAngle) * CIRCLE_RADIUS - CARD_WIDTH / 2;
  const y =
    CIRCLE_CENTER.y + Math.sin(adjustedAngle) * CIRCLE_RADIUS - CARD_HEIGHT / 2;

  return {x, y};
};

// Generate static card positions
const generateCircularCardLocations = (numOfPlayers: number): Location[] => {
  'worklet';
  const totalCards = numOfPlayers * 5;
  const angleStep = (2 * Math.PI) / totalCards;

  return Array.from({length: totalCards}, (_, index) => {
    const angle = index * angleStep;
    return getCardLocationFromAngle(angle);
  });
};

interface RevealableCardProps {
  location: Location;
  specialCardAngle: SharedValue<number>;
  cardAngle: number;
}

const RevealableCard = ({
  location,
  specialCardAngle,
  cardAngle,
}: RevealableCardProps) => {
  const cardStyle = useAnimatedStyle(() => {
    const isVisible = specialCardAngle.value >= cardAngle;
    const deg = ((cardAngle - Math.PI / 2) * 180) / Math.PI + 90;

    return {
      position: 'absolute',
      opacity: isVisible ? 1 : 0,
      transform: [
        {translateX: location.x},
        {translateY: location.y},
        {rotate: `${deg}deg`},
      ],
    };
  });

  return (
    <Animated.View style={cardStyle}>
      <CardBack />
    </Animated.View>
  );
};

interface CardsSpreadProps {
  activeDirections: Record<string, DirectionName>;
  onPlayerCardsCalculated?: (playerCards: Record<string, Position[]>) => void;
}

const CARDS_PER_PLAYER = 5;

const CardsSpread = ({
  activeDirections,
  onPlayerCardsCalculated,
}: CardsSpreadProps) => {
  const playerIds = Object.keys(activeDirections);
  const numOfPlayers = playerIds.length;
  const totalCards = numOfPlayers * CARDS_PER_PLAYER;
  const angleStep = (2 * Math.PI) / totalCards;
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const hasStarted = useRef(false);
  const specialCardAngle = useSharedValue<number>(0);
  const specialCardYOffset = useSharedValue<number>(0);

  const cards: Location[] = useMemo(
    () => generateCircularCardLocations(numOfPlayers),
    [numOfPlayers],
  );

  useEffect(() => {
    setShouldAnimate(true);
    setIsFinished(false);
    hasStarted.current = false;
  }, []);

  // Calculate player cards for callback
  useEffect(() => {
    if (
      shouldAnimate &&
      !isFinished &&
      !hasStarted.current &&
      playerIds.length > 0
    ) {
      const playerCards: Record<string, Position[]> = {};
      hasStarted.current = true;
      specialCardAngle.value = 0;
      specialCardYOffset.value = 0;
      playerIds.forEach((playerId, playerIndex) => {
        const startCard = playerIndex * CARDS_PER_PLAYER;
        const positions = Array.from({length: CARDS_PER_PLAYER}, (_, i) => {
          const cardIndex = startCard + i;
          const cardAngle = cardIndex * angleStep;
          return {
            x: cards[cardIndex].x,
            y: cards[cardIndex].y,
            deg: ((cardAngle - Math.PI / 2) * 180) / Math.PI + 90,
          };
        });

        playerCards[playerId] = positions;
      });
      specialCardAngle.value = withTiming(
        2 * Math.PI,
        {duration: 1000},
        finished => {
          'worklet';

          if (finished) {
            runOnJS(onPlayerCardsCalculated ?? noop)(playerCards);
            runOnJS(setShouldAnimate)(false);

            specialCardYOffset.value = withTiming(-0.5 * CARD_HEIGHT);
          }
        },
      );
      setTimeout(() => {
        setIsFinished(true);
      }, 3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    angleStep,
    cards,
    playerIds,

    specialCardAngle,
    onPlayerCardsCalculated,
    specialCardYOffset,
    isFinished,
  ]);

  const specialCardStyle = useAnimatedStyle(() => {
    const position = getCardLocationFromAngle(specialCardAngle.value);
    const deg = ((specialCardAngle.value - Math.PI / 2) * 180) / Math.PI + 90;

    return {
      position: 'absolute',
      transform: [
        {translateX: position.x},
        {translateY: position.y + specialCardYOffset.value},
        {rotate: `${deg}deg`},
      ],
    };
  });

  if (isFinished) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Progressive reveal cards */}
      {shouldAnimate &&
        cards.map((cardPos, index) => (
          <RevealableCard
            key={index}
            location={cardPos}
            specialCardAngle={specialCardAngle}
            cardAngle={index * angleStep}
          />
        ))}

      {/* Orbiting special card */}
      <Animated.View style={specialCardStyle}>
        <CardBack />
      </Animated.View>
    </View>
  );
};

export default CardsSpread;
