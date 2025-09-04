import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import DeckCardPointers from '~/components/cards/deckCardPoint';
import CardBack from '~/components/cards/cardBack';
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
} from '~/utils/constants';

import {Card, Position} from '~/types/cards';
import {LayerHistory} from '~/store/yanivGameStore';
import CardsSpread from './cardsSpread';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {SPREAD_CARDS_SOUND} from '~/sounds';
import useSound from '~/hooks/useSound';

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
    layerHistory: LayerHistory;
  };
  disabled?: boolean;
  round: number;
  gameId: string;
  prevRoundPositions: {
    card: Card;
    position: Position;
    playerId: string | undefined;
  }[];
  onReady?: (round: number) => void;
  handlePickupCard: (number: number) => void;
  handleDrawFromDeck: () => void;
}

function GameBoard({
  pickup,
  round,
  gameId,
  disabled = false,
  prevRoundPositions,
  onReady,
  handlePickupCard,
  handleDrawFromDeck,
}: GameBoardProps) {
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
            cards={pickup.pickupPile}
            // pickedCard={lastPickedCard}
            onPickUp={handlePickupCard}
            fromTargets={
              pickup.tookFrom ?? [{x: 0, y: -1 * CARD_HEIGHT, deg: 0}]
            }
            // round={round}
            disabled={disabled}
            wasPlayer={pickup.wasPlayer}
            layerHistory={pickup.layerHistory}
          />
        )}
      </View>
      <CardsSpread
        key={`${gameId}-${round}`}
        onEnd={$onFinish}
        onShuffled={onFinishShuffled}
        onSpread={onFinishSpread}
        shouldGroupCards={lastGameId === gameId}
        visible={!deckReady}
        prevRoundPositions={prevRoundPositions}
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
    top: SCREEN_HEIGHT / 2 - 2 * CARD_HEIGHT,
    left: SCREEN_WIDTH / 2 - CARD_WIDTH * 0.5,
  },
  pickup: {
    height: CARD_HEIGHT,
    width: CARD_WIDTH,
    top: SCREEN_HEIGHT / 2 - 1.5 * CARD_HEIGHT,
    left: SCREEN_WIDTH / 2 - CARD_WIDTH * 0.5,
  },
});

export default GameBoard;
