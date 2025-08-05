import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Dimensions, StyleSheet, View} from 'react-native';
import CardBack from '~/components/cards/cardBack';
import {Card, DirectionName} from '~/types/cards';

import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import CardShuffle from './cardsShuffle';
import CardsGroup from './cardGroup';
import {PlayerId, useYanivGameStore} from '~/store/yanivGameStore';
import {CARD_HEIGHT, CIRCLE_CENTER, SMALL_DELAY} from '~/utils/constants';
import {noop} from 'lodash';

const {width: screenWidth, height: screenHeight} = Dimensions.get('screen');

interface CardsSpreadProps {
  activeDirections: Record<string, DirectionName>;
  onShuffled?: () => void;
  onSpread?: () => void;
  onEnd?: () => void;
  shouldGroupCards: boolean;
  lastHands: Record<PlayerId, Card[]>;
}

const CardsSpread = ({
  onShuffled,
  onSpread,
  onEnd,
  shouldGroupCards,
  lastHands,
}: CardsSpreadProps) => {
  const [isFinished, setIsFinished] = useState(false);
  const [finishShuffle, setFinishShuffle] = useState(false);
  const [startShuffle, setStartShuffle] = useState(!shouldGroupCards);

  const specialCardYOffset = useSharedValue<number>(0);
  const overlayOpacity = useSharedValue<number>(0);

  const {game, players} = useYanivGameStore();
  const playersActive = useMemo(() => {
    return players.order.filter(
      pId => game.playersStats[pId].playerStatus === 'active',
    );
  }, [game.playersStats, players.order]);

  const cardGroupingDone = useCallback(() => {
    setStartShuffle(true);
  }, []);

  useEffect(() => {
    overlayOpacity.value = withTiming(1);
  }, [overlayOpacity]);

  const onFinishShuffle = useCallback(() => {
    setFinishShuffle(true);
    onShuffled?.();
    setTimeout(() => {
      overlayOpacity.value = withTiming(0);
      onSpread?.();
      specialCardYOffset.value = withTiming(
        -0.5 * CARD_HEIGHT,
        {
          duration: 300,
        },
        finish => {
          runOnJS(onEnd ?? noop)();
          runOnJS(setIsFinished)(!!finish);
        },
      );
    }, playersActive.length * 5 * SMALL_DELAY);
  }, [
    onShuffled,
    playersActive.length,
    overlayOpacity,
    onSpread,
    specialCardYOffset,
    onEnd,
  ]);

  const specialCardStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      transform: [
        {translateX: CIRCLE_CENTER.x},
        {
          translateY: CIRCLE_CENTER.y + specialCardYOffset.value,
        },
      ],
      zIndex: 100,
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

      {/* Orbiting special card */}
      {!isFinished && startShuffle && (
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
      {!isFinished && shouldGroupCards && !startShuffle && (
        <CardsGroup
          shouldCollect={shouldGroupCards}
          onComplete={cardGroupingDone}
          lastHands={lastHands}
        />
      )}
    </View>
  );
};

export default CardsSpread;
