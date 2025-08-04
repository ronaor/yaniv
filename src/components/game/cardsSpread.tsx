import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
import CardShuffle from './cardsShuffle';

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
  onFinish?: () => void;
}

const CARDS_PER_PLAYER = 5;

const CardsSpread = ({
  activeDirections,
  onPlayerCardsCalculated,
  onFinish,
}: CardsSpreadProps) => {
  const playerIds = Object.keys(activeDirections);
  const numOfPlayers = playerIds.length;
  const totalCards = numOfPlayers * CARDS_PER_PLAYER;
  const angleStep = (2 * Math.PI) / totalCards;

  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [finishShuffle, setFinishShuffle] = useState(false);
  const hasStarted = useRef(false);

  const specialCardAngle = useSharedValue<number>(0);
  const specialCardYOffset = useSharedValue<number>(0);
  const overlayOpacity = useSharedValue<number>(0);

  const cards: Location[] = useMemo(
    () => generateCircularCardLocations(numOfPlayers),
    [numOfPlayers],
  );

  useEffect(() => {
    overlayOpacity.value = withTiming(1);
  }, [overlayOpacity]);

  const onFinishShuffle = useCallback(() => {
    if (hasStarted.current) return; // Double guard
    hasStarted.current = true;

    setShouldAnimate(true);
    setFinishShuffle(true);
    setIsFinished(false);

    // Do all the work immediately in callback
    const playerCards: Record<string, Position[]> = {};
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
          overlayOpacity.value = withTiming(0);
          specialCardYOffset.value = withTiming(-0.5 * CARD_HEIGHT, {
            duration: 300,
          });
        }
      },
    );

    setTimeout(() => {
      setIsFinished(true);
      onFinish?.();
    }, 1550);
  }, [
    playerIds,
    cards,
    angleStep,
    specialCardAngle,
    overlayOpacity,
    specialCardYOffset,
    onPlayerCardsCalculated,
    onFinish,
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

  const overlayStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    opacity: overlayOpacity.value,
    backgroundColor: '#00000050',
    width: screenWidth,
    height: screenHeight,
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={overlayStyle} />
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
      {!isFinished && (
        <Animated.View style={specialCardStyle}>
          {finishShuffle ? (
            <CardBack />
          ) : (
            <CardShuffle
              startAnimation={true}
              loops={2}
              onFinish={onFinishShuffle}
            />
          )}
        </Animated.View>
      )}
    </View>
  );
};

export default CardsSpread;
