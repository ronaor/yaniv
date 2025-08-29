import React, {useCallback, useEffect, useState} from 'react';
import {Dimensions, StyleSheet, TouchableOpacity, View} from 'react-native';
import DeckCardPointers from '~/components/cards/deckCardPoint';
import CardBack from '~/components/cards/cardBack';
import {CARD_HEIGHT, CARD_WIDTH} from '~/utils/constants';

import {Card, DirectionName, Position} from '~/types/cards';
import {PlayerId} from '~/store/yanivGameStore';
import CardsSpread from './cardsSpread';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {SPREAD_CARDS_SOUND} from '~/sounds';
import useSound from '~/hooks/useSound';

const {width: screenWidth, height: screenHeight} = Dimensions.get('screen');

const CardBackRotated = ({deg}: {deg: number}) => {
  const rotation = useSharedValue<number>(0);
  const rotationStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    transform: [{rotate: `${rotation.value}deg`}],
  }));

  useEffect(() => {
    rotation.value = withTiming(deg, {duration: 300});
  }, [deg, rotation]);

  return (
    <Animated.View style={rotationStyle}>
      <CardBack />
    </Animated.View>
  );
};

interface GameBoardProps {
  pickup: {
    pickupPile: Card[];
    lastPickedCard?: Card;
    tookFrom?: Position[];
    wasPlayer: boolean;
  };
  disabled?: boolean;
  round: number;
  gameId: string;
  activeDirections: Record<PlayerId, DirectionName>;
  onReady?: (round: number) => void;
  handlePickupCard: (number: number) => void;
  handleDrawFromDeck: () => void;
}

function GameBoard({
  pickup,
  round,
  gameId,
  disabled = false,
  activeDirections,
  onReady,
  handlePickupCard,
  handleDrawFromDeck,
}: GameBoardProps) {
  const {pickupPile, lastPickedCard, tookFrom} = pickup;

  const [lastGameId, setLastGameId] = useState<string>(gameId);

  const [pickupReady, setPickupReady] = useState<boolean>(false);
  const [deckReady, setDeckReady] = useState<boolean>(false);

  const {playSound} = useSound(SPREAD_CARDS_SOUND);

  useEffect(() => {
    setPickupReady(false);
    setDeckReady(false);
    setLastGameId(gameId);
  }, [round, gameId]);

  const $onFinish = useCallback(() => {
    setDeckReady(true);
  }, []);

  const onFinishShuffled = useCallback(() => {
    onReady?.(round);
    playSound();
  }, [onReady, playSound, round]);

  const onFinishSpread = useCallback(() => {
    setPickupReady(true);
  }, []);

  return (
    <View style={styles.gameArea}>
      <TouchableOpacity
        style={styles.deck}
        onPress={handleDrawFromDeck}
        disabled={disabled || !deckReady}>
        {deckReady && (
          <>
            <CardBackRotated deg={10} />
            <CardBackRotated deg={5} />
            <CardBackRotated deg={0} />
            <CardBackRotated deg={-5} />
          </>
        )}
      </TouchableOpacity>

      <View style={styles.pickup}>
        {pickupReady && (
          <DeckCardPointers
            cards={pickupPile}
            pickedCard={lastPickedCard}
            onPickUp={handlePickupCard}
            fromTargets={tookFrom ?? [{x: 0, y: -1 * CARD_HEIGHT, deg: 0}]}
            round={round}
            disabled={disabled}
            wasPlayer={pickup.wasPlayer}
          />
        )}
      </View>
      <CardsSpread
        activeDirections={activeDirections}
        key={`${gameId}-${round}`}
        onEnd={$onFinish}
        onShuffled={onFinishShuffled}
        onSpread={onFinishSpread}
        shouldGroupCards={lastGameId === gameId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  gameArea: {
    position: 'absolute',
  },
  deck: {
    height: CARD_HEIGHT,
    width: CARD_WIDTH,
    alignItems: 'center',
    top: screenHeight / 2 - 2 * CARD_HEIGHT,
    left: screenWidth / 2 - CARD_WIDTH * 0.5,
  },
  pickup: {
    height: CARD_HEIGHT,
    width: CARD_WIDTH,
    top: screenHeight / 2 - 1.5 * CARD_HEIGHT,
    left: screenWidth / 2 - CARD_WIDTH * 0.5,
  },
});

export default GameBoard;
