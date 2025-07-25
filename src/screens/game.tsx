import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
import {CARD_WIDTH} from '~/utils/constants';
import {PlayerId, useYanivGameStore} from '~/store/yanivGameStore';
import HiddenCardPointsList from '~/components/cards/hiddenCards';
import {isNil} from 'lodash';
import WaveAnimationBackground from './waveScreen';
import YanivButton from '~/components/yanivButton';
import UserAvatar from '~/components/user/userAvatar';
import LightAround from '~/components/user/lightAround';

const {width: screenWidth, height: screenHeight} = Dimensions.get('screen');

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
    setUI,
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

  const [uiReady, setUiReady] = useState<{
    deckLocation: boolean;
    pickupLocation: boolean;
  }>({deckLocation: false, pickupLocation: false});

  useEffect(() => {
    if (mainState.ui || !uiReady.deckLocation || !uiReady.pickupLocation) {
      return;
    }

    const timer = setTimeout(() => {
      deckRef.current?.measure((_, __, ___, lH, lPX, lPY) => {
        const deckLocation = {x: lPX, y: lPY + lH / 2, deg: 0};
        pickupRef.current?.measure((____, _____, ______, pH, pPX, pPY) => {
          const pickupLocation = {x: pPX, y: pPY + pH / 2, deg: 0};
          setUI(
            {
              deckLocation,
              pickupLocation,
            },
            players.map(p => p.id),
          );
        });
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [setUI, players, mainState.ui, uiReady]);

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

  const pickupRef = useRef<View>(null);
  const measurePickupPos = () => {
    setUiReady(prev => ({
      ...prev,
      pickupLocation: true,
    }));
  };
  const deckRef = useRef<TouchableOpacity>(null);
  const measureDeckPos = () => {
    setUiReady(prev => ({
      ...prev,
      deckLocation: true,
    }));
  };

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
      <SafeAreaView style={{flex: 1}}>
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

          {/* Game Area */}
          <View style={styles.gameArea}>
            {/* Deck and Discard Pile */}
            <View style={styles.centerArea}>
              <TouchableOpacity
                ref={deckRef}
                onLayout={measureDeckPos}
                style={styles.deck}
                onPress={handleDrawFromDeck}
                disabled={!myTurn || selectedCards.length === 0}>
                <CardBack />
              </TouchableOpacity>

              <View ref={pickupRef} onLayout={measurePickupPos}>
                <DeckCardPointers
                  cards={pickupCards}
                  onPickUp={handlePickupCard}
                  pickedCard={lastPickedCard}
                  fromTargets={mainState.prevTurn?.discard.cardsPositions ?? []}
                  round={round}
                />
              </View>
            </View>
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
          <View style={styles.handSection}>
            <Text style={styles.handTitle}>{handValue} נקודות</Text>
          </View>
          <YanivButton
            onPress={emit.callYaniv}
            disabled={handValue > config.canCallYaniv || !myTurn}
          />
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
              <View
                key={playerId}
                style={{
                  position: 'absolute',
                  width: screenWidth,
                }}>
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
                <View
                  style={[
                    {
                      position: 'absolute',
                    },
                    directions[i] === 'up' ? {top: 0, left: 10} : {},
                    directions[i] === 'down' ? {top: 80, left: 30} : {},
                    directions[i] === 'left'
                      ? {left: 10, top: screenHeight / 2 - 140}
                      : {},
                    directions[i] === 'right'
                      ? {right: 10, top: screenHeight / 2 - 140}
                      : {},
                  ]}>
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
  backgroundImage: {
    flex: 1,
    // width: '100%',
    // height: '100%',
    // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  body: {
    flex: 1,
    // backgroundColor: 'rgba(0, 0, 0, 0.1)', // semi-transparent background
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
  roomTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
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
  timerUrgent: {
    color: '#FF6B6B',
  },
  gameStatus: {
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  turnInfo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  handValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  gameArea: {
    justifyContent: 'center',
    alignItems: 'center',
    height: screenHeight - 200,
    zIndex: 1,
  },
  centerArea: {
    flexDirection: 'column',
    marginBottom: 12,
    gap: CARD_WIDTH,
  },
  deck: {
    backgroundColor: '#dddddd',
    borderRadius: 8,
    height: 80,
    alignItems: 'center',
  },
  deckHighlighted: {},
  deckText: {
    fontSize: 24,
    marginBottom: 4,
    color: 'white',
  },
  deckCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  discardPile: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'column',
    gap: 8,
  },
  pickupableCard: {
    borderColor: '#FFFFFF70',
    borderRadius: 12,
    borderWidth: 3,
  },
  handSection: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  handTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  handList: {
    flexGrow: 0,
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
  selectedCard: {
    transform: [{translateY: -8}],
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 100,
    paddingHorizontal: 8,
  },
  actionBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  yanivBtn: {
    backgroundColor: colors.success,
  },
  disabledBtn: {
    backgroundColor: colors.border,
  },
  actionBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  playersSection: {
    flex: 1,
    // backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
  },
  playersTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  playerList: {
    flex: 1,
  },
  player: {
    fontSize: 14,
    color: colors.text,
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    textAlign: 'center',
  },
  currentPlayer: {
    backgroundColor: colors.accent,
    fontWeight: 'bold',
    borderRadius: 4,
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
  messageContainer: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  yanivText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: 10,
  },
  asafText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: 10,
  },
  roundResults: {
    alignItems: 'center',
    marginTop: 10,
  },
  resultText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 5,
    textAlign: 'center',
  },
  drawInstructions: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  drawInstructionsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  selectionInfo: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 'bold',
    marginTop: 4,
  },
  discardInfo: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  pickupCard: {},
});

export default GameScreen;
