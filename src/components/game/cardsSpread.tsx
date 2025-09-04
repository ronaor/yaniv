import React, {useCallback, useMemo, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import CardBack from '~/components/cards/cardBack';

import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import CardShuffle from './cardsShuffle';
import CardsGroup from './cardGroup';
import {useYanivGameStore} from '~/store/yanivGameStore';
import {CARD_HEIGHT, CIRCLE_CENTER, SMALL_DELAY} from '~/utils/constants';
import {noop} from 'lodash';

const NUM_LOOPS = 2;

interface CardsSpreadProps {
  onShuffled?: () => void;
  onSpread?: () => void;
  onEnd?: () => void;
  shouldGroupCards: boolean;
  visible?: boolean;
}

const CardsSpread = ({
  onShuffled,
  onSpread,
  onEnd,
  shouldGroupCards,
  visible = false,
}: CardsSpreadProps) => {
  const [isFinished, setIsFinished] = useState(false);
  const [finishShuffle, setFinishShuffle] = useState(false);
  const [startShuffle, setStartShuffle] = useState(!shouldGroupCards);

  const specialCardYOffset = useSharedValue<number>(0);

  const {game, players, board} = useYanivGameStore();
  const playersActive = useMemo(() => {
    return players.order.filter(
      pId => game.playersStats[pId].playerStatus === 'active',
    );
  }, [game.playersStats, players.order]);

  const cardGroupingDone = useCallback(() => {
    setStartShuffle(true);
  }, []);

  const onFinishShuffle = useCallback(() => {
    setFinishShuffle(true);
    onShuffled?.();
    setTimeout(() => {
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
  }, [onShuffled, playersActive.length, onSpread, specialCardYOffset, onEnd]);

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

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Orbiting special card */}
      {visible && !isFinished && startShuffle && (
        <Animated.View style={specialCardStyle}>
          {finishShuffle ? (
            <CardBack />
          ) : (
            <CardShuffle
              startAnimation={true}
              startShuffle={!shouldGroupCards}
              loops={NUM_LOOPS}
              onFinish={onFinishShuffle}
            />
          )}
        </Animated.View>
      )}
      {!isFinished && shouldGroupCards && !startShuffle && (
        <CardsGroup
          shouldCollect={true}
          onComplete={cardGroupingDone}
          pickupPile={board.prevRoundPile}
        />
      )}
    </View>
  );
};

export default CardsSpread;
