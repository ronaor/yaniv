import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Alert,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {useRoomStore} from '~/store/roomStore';
import {useUser} from '~/store/userStore';
import {colors} from '~/theme';

import {SafeAreaView} from 'react-native-safe-area-context';
import {getHandValue, isCanPickupCard, isValidCardSet} from '~/utils/gameRules';

import CardBack from '~/components/cards/cardBack';
import CardPointsList from '~/components/cards/cardsPoint';
import {DirectionName} from '~/types/cards';
import DeckCardPointers from '~/components/cards/deckCardPoint';
import {CARD_HEIGHT, CARD_WIDTH} from '~/utils/constants';
import {PlayerId, useYanivGameStore} from '~/store/yanivGameStore';
import HiddenCardPointsList from '~/components/cards/hiddenCards';
import {isNil} from 'lodash';
import WaveAnimationBackground from './waveScreen';
import YanivButton from '~/components/yanivButton';
import UserAvatar from '~/components/user/userAvatar';
import LightAround from '~/components/user/lightAround';
import {OutlinedText} from '~/components/cartoonText';

const {width: screenWidth, height: screenHeight} = Dimensions.get('screen');

const CardBackRotated = ({rotation}: {rotation: number}) => {
  const rotationStyle: ViewStyle = {
    position: 'absolute',
    transform: [{rotate: `${rotation}deg`}],
  };
  return (
    <View style={rotationStyle}>
      <CardBack />
    </View>
  );
};

function GameScreen({navigation}: any) {
  const {players, leaveRoom} = useRoomStore();
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const {
    thisPlayer,
    emit,
    mainState,
    error,
    pickupCards,
    playersStats,
    round,
    clearGame,
    clearError,
    playersHands,
    resetSlapDown,
    config,
  } = useYanivGameStore();

  const {roundResults, turnStartTime} = mainState;

  const {myTurn, slapDownAvailable, handCards: playerHand} = thisPlayer;

  const {name: nickName} = useUser();

  const playersName = useMemo(() => {
    return players.reduce<Record<PlayerId, string>>((res, user) => {
      res[user.id] = user.nickName;
      return res;
    }, {});
  }, [players]);

  const [timeRemaining, setTimeRemaining] = useState(0);

  const handValue = useMemo(() => getHandValue(playerHand), [playerHand]);

  useEffect(() => {
    return clearGame;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer for remaining time
  useEffect(() => {
    if (!myTurn) {
      setSelectedCards([]);
      return;
    }
    if (mainState.state !== 'begin' && mainState.state !== 'playing') {
      return;
    }

    const interval = setInterval(() => {
      const elapsed =
        (Date.now() -
          new Date(turnStartTime ?? config.timePerPlayer).getTime()) /
        1000;
      const remaining = config.timePerPlayer - Math.floor(Math.abs(elapsed));

      setTimeRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    setTimeRemaining(config.timePerPlayer);
    return () => clearInterval(interval);
  }, [myTurn, turnStartTime, config, mainState.state]);

  // Handle leave game
  const handleLeave = useCallback(() => {
    Alert.alert('יציאה מהמשחק', 'האם אתה בטוח שברצונך לעזוב?', [
      {text: 'ביטול', style: 'cancel'},
      {
        text: 'צא',
        style: 'destructive',
        onPress: () => {
          leaveRoom(nickName);
          navigation.reset({index: 0, routes: [{name: 'Home'}]});
        },
      },
    ]);
  }, [navigation, leaveRoom, nickName]);

  // Handle game errors
  useEffect(() => {
    if (error) {
      Alert.alert('שגיאת משחק', error, [{text: 'סגור', onPress: clearError}]);
    }
  }, [error, clearError]);

  useEffect(() => {
    if (!slapDownAvailable) {
      return;
    }
    const timer = setTimeout(resetSlapDown, 3000);
    return () => clearTimeout(timer);
  }, [resetSlapDown, slapDownAvailable]);

  const handleDrawFromDeck = () => {
    const selected = selectedCards.map(i => playerHand[i]);
    if (!isValidCardSet(selected, true)) {
      return false;
    }
    emit.completeTurn(
      {choice: 'deck'},
      selectedCards.map(i => playerHand[i]),
    );
  };

  const handlePickupCard = (pickupIndex: number) => {
    const selected = selectedCards.map(i => playerHand[i]);
    if (
      !isCanPickupCard(pickupCards.length, pickupIndex) ||
      !isValidCardSet(selected, true)
    ) {
      return false;
    }

    emit.completeTurn(
      {choice: 'pickup', pickupIndex},
      selectedCards.map(i => playerHand[i]),
    );
  };

  const toggleCardSelection = (index: number) => {
    setSelectedCards(prev => {
      const isSelected = prev.includes(index);
      if (isSelected) {
        return prev.filter(i => i !== index);
      }
      return [...prev, index];
    });
  };

  const lastPickedCard = mainState.prevTurn?.draw?.card;
  const slapCardIndex = useMemo(
    () =>
      slapDownAvailable && lastPickedCard
        ? playerHand.findIndex(
            card =>
              lastPickedCard?.suit === card.suit &&
              lastPickedCard?.value === card.value,
          )
        : -1,
    [lastPickedCard, playerHand, slapDownAvailable],
  );

  const onSlapCard = useCallback(() => {
    const cardToSlap = playerHand[slapCardIndex];
    if (cardToSlap) {
      emit.slapDown(cardToSlap);
    }
  }, [playerHand, slapCardIndex, emit]);

  const directions: DirectionName[] = ['up', 'right', 'down', 'left'];

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <WaveAnimationBackground />
      <SafeAreaView style={styles.surface}>
        <View style={styles.body}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
              <Text style={styles.leaveBtnText}>⟵ עזוב</Text>
            </TouchableOpacity>
            {myTurn && (
              <View style={styles.timerContainer}>
                <Text style={[styles.timer]}>{timeRemaining}s</Text>
              </View>
            )}
          </View>

          {/* Yaniv/Asaf Overlay */}
          <View style={styles.overlay}>
            {roundResults?.yanivCaller && (
              <View>
                <Text style={styles.yanivText}>{'יניב!'}</Text>
              </View>
            )}
            {roundResults?.assafCaller && (
              <View>
                <Text style={styles.yanivText}>{'אסף!'}</Text>
              </View>
            )}
          </View>
        </View>
        {config.players.map((playerId, i) => (
          <LightAround
            key={`light-${playerId}`}
            direction={directions[i]}
            isActive={mainState.playerTurn === playerId}
          />
        ))}
        <View style={styles.actionButtons}>
          <UserAvatar
            name={playersName[thisPlayer.playerId]}
            score={playersStats[thisPlayer.playerId]?.score ?? 0}
            isActive={myTurn}
            timePerPlayer={config.timePerPlayer}
          />
          <OutlinedText
            text={`${handValue}  Points`}
            fontSize={20}
            width={125}
            height={100}
            fillColor={'#FFD61B'}
            strokeColor={'#6A3900'}
            strokeWidth={5}
            fontWeight={'900'}
          />
          {/* <Text style={styles.handTitle}>{handValue} Points</Text> */}
          <YanivButton
            onPress={emit.callYaniv}
            disabled={handValue > config.canCallYaniv || !myTurn}
          />
        </View>
        {/* Game Area */}
        <View style={styles.gameArea}>
          <TouchableOpacity
            style={styles.deck}
            onPress={handleDrawFromDeck}
            disabled={!myTurn || selectedCards.length === 0}>
            <>
              <CardBackRotated rotation={10} />
              <CardBackRotated rotation={3} />
            </>
          </TouchableOpacity>
          <View style={styles.pickup}>
            <DeckCardPointers
              cards={pickupCards}
              pickedCard={lastPickedCard}
              onPickUp={handlePickupCard}
              fromTargets={mainState.prevTurn?.discard.cardsPositions ?? []}
              round={round}
              disabled={!myTurn}
            />
          </View>
        </View>
        {config.players.map((playerId, i) => {
          if (thisPlayer.playerId === playerId) {
            return (
              <CardPointsList
                key={playerId}
                cards={playerHand}
                onCardSelect={toggleCardSelection}
                slapCardIndex={slapCardIndex}
                selectedCardsIndexes={selectedCards}
                onCardSlapped={onSlapCard}
                fromPosition={
                  playerId === mainState.prevTurn?.playerId
                    ? mainState.prevTurn?.draw?.cardPosition
                    : undefined
                }
                action={mainState.prevTurn?.action}
                direction={directions[i]}
              />
            );
          } else {
            return (
              <View key={playerId} style={styles.absolute}>
                <HiddenCardPointsList
                  cards={playersHands[playerId] ?? []}
                  direction={directions[i]}
                  fromPosition={
                    playerId === mainState.prevTurn?.playerId
                      ? mainState.prevTurn?.draw?.cardPosition
                      : undefined
                  }
                  action={mainState.prevTurn?.action}
                  reveal={!isNil(mainState.roundResults)}
                />
                <View style={recordStyle[directions[i]]}>
                  <UserAvatar
                    name={playersName[playerId]}
                    score={playersStats[playerId]?.score ?? 0}
                    isActive={mainState.playerTurn === playerId}
                    timePerPlayer={config.timePerPlayer}
                  />
                </View>
              </View>
            );
          }
        })}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  surface: {flex: 1},
  body: {
    flex: 1,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leaveBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  leaveBtnText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  timerContainer: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timer: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  gameArea: {
    position: 'absolute',
  },
  centerArea: {
    flexDirection: 'column',
    marginBottom: 12,
    gap: CARD_WIDTH / 2,
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
  handTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#612602',
    textAlign: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    width: 60,
    height: 80,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 100,
    paddingHorizontal: 8,
  },
  overlay: {
    position: 'absolute',
    top: 130,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  yanivText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: 10,
  },
  absolute: {position: 'absolute', width: screenWidth},
});

const recordStyle: Record<DirectionName, ViewStyle> = {
  up: {position: 'absolute', top: 0, left: 10},
  down: {position: 'absolute', top: 80, left: 30},
  left: {
    position: 'absolute',
    left: 10,
    top: screenHeight / 2 - 140,
  },
  right: {
    position: 'absolute',
    right: 10,
    top: screenHeight / 2 - 140,
  },
};

export default GameScreen;
