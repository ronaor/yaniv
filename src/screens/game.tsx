import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  FlatList,
  ImageBackground,
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
import backgroundImg from '~/assets/images/yaniv_background.png';
import {getHandValue, isCanPickupCard, isValidCardSet} from '~/utils/gameRules';

import CardBack from '~/components/cards/cardBack';
import CardPointsList from '~/components/cards/cardsPoint';
import {DirectionName, Location} from '~/types/cards';
import DeckCardPointers from '~/components/cards/deckCardPoint';
import {CARD_WIDTH} from '~/utils/constants';
import {useYanivGameStore} from '~/store/yanivGameStore';
import HiddenCardPointsList from '~/components/cards/hiddenCards';
import {isNil} from 'lodash';

function GameScreen({navigation}: any) {
  const {roomId, players, leaveRoom} = useRoomStore();
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const {
    thisPlayer,
    emit,
    mainState,
    error,
    pickupCards,
    playersStats,
    round,
    config,
    setUI,
    clearGame,
    clearError,
    playersHands,
    resetSlapDown,
  } = useYanivGameStore();

  const {roundResults, turnStartTime} = mainState;

  const {myTurn, slapDownAvailable, handCards: playerHand} = thisPlayer;

  const {name: nickName} = useUser();

  const [timeRemaining, setTimeRemaining] = useState(0);

  const canCallYaniv = () => {
    return getHandValue(playerHand) <= 7;
  };

  useEffect(() => {
    return clearGame;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [uiData, setUiData] = useState<{
    deckLocation?: Location;
    pickupLocation?: Location;
  }>({});

  useEffect(() => {
    if (!mainState.ui && uiData.deckLocation && uiData.pickupLocation) {
      setUI(
        {
          deckLocation: uiData.deckLocation,
          pickupLocation: uiData.pickupLocation,
        },
        players.map(p => p.id),
      );
    }
  }, [setUI, players, uiData, mainState.ui]);

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
    pickupRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setUiData(prev => ({
        ...prev,
        pickupLocation: {x: pageX + width / 2, y: pageY + height / 2, deg: 0},
      }));
    });
  };
  const deckRef = useRef<TouchableOpacity>(null);
  const measureDeckPos = () => {
    deckRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setUiData(prev => ({
        ...prev,
        deckLocation: {x: pageX, y: pageY + height / 2, deg: 0},
      }));
    });
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
  const orderedPlayers = [
    thisPlayer.playerId,
    ...players
      .map(p => p.id)
      .filter(playerId => playerId !== thisPlayer.playerId),
  ];

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <ImageBackground
        source={backgroundImg}
        style={styles.backgroundImage}
        resizeMode="cover">
        <SafeAreaView style={{flex: 1}}>
          <View style={styles.body}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
                <Text style={styles.leaveBtnText}>⟵ עזוב</Text>
              </TouchableOpacity>
              <Text style={styles.roomTitle}>חדר: {roomId}</Text>
              {myTurn && (
                <View style={styles.timerContainer}>
                  <Text style={[styles.timer]}>{timeRemaining}s</Text>
                </View>
              )}
            </View>

            {/* Game Status */}
            <View style={styles.gameStatus}>
              <Text style={styles.turnInfo}>
                {myTurn ? 'בחר קלף לשליפה' : 'ממתין לשחקן אחר...'}
              </Text>
              <Text style={styles.handValue}>
                הקלפים שלך: {playersStats[thisPlayer.playerId]?.score ?? 0}{' '}
                נקודות
              </Text>
            </View>

            {/* Game Area */}
            <View style={styles.gameArea}>
              {/* Deck and Discard Pile */}
              <View style={styles.centerArea}>
                <View style={styles.discardPile}>
                  <Text style={styles.discardTitle}>קופה:</Text>
                  <TouchableOpacity
                    ref={deckRef}
                    onLayout={measureDeckPos}
                    style={styles.deck}
                    onPress={handleDrawFromDeck}
                    disabled={!myTurn || selectedCards.length === 0}>
                    <CardBack />
                  </TouchableOpacity>
                </View>

                <View style={styles.discardPile}>
                  <Text style={styles.discardTitle}>קלפים:</Text>
                  <View
                    style={styles.discardCards}
                    ref={pickupRef}
                    onLayout={measurePickupPos}>
                    <DeckCardPointers
                      cards={pickupCards}
                      onPickUp={handlePickupCard}
                      pickedCard={lastPickedCard}
                      fromTargets={
                        mainState.prevTurn?.discard.cardsPositions ?? []
                      }
                      round={round}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Player's Hand */}
            <View style={styles.handSection}>
              <Text style={styles.handTitle}>
                <Text style={styles.handTitle}>
                  {getHandValue(playerHand)} נקודות
                </Text>
              </Text>
            </View>

            {/* Game Actions */}
            {myTurn && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    styles.yanivBtn,
                    !canCallYaniv() && styles.disabledBtn,
                  ]}
                  onPress={emit.callYaniv}
                  disabled={!canCallYaniv()}>
                  <Text style={styles.actionBtnText}>יניב!</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Players List */}
            <View style={styles.playersSection}>
              <Text style={styles.playersTitle}>שחקנים:</Text>
              <FlatList
                data={players}
                keyExtractor={item => item.id}
                renderItem={({item}) => (
                  <Text
                    style={[
                      styles.player,
                      mainState.playerTurn === item.id && styles.currentPlayer,
                      playersStats[item.id]?.lost && {opacity: 0.5},
                    ]}>
                    {`${item.nickName} - `}
                    {playersStats[item.id]?.score ?? 0}
                    {item.nickName === nickName ? ' (אתה)' : ''}
                  </Text>
                )}
                style={styles.playerList}
              />
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

          {orderedPlayers.map((playerId, i) => {
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
                <HiddenCardPointsList
                  key={playerId}
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
              );
            }
          })}
        </SafeAreaView>
      </ImageBackground>
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
    // backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    minHeight: 120,
    alignItems: 'center',
  },
  centerArea: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    alignItems: 'center',
  },
  discardTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  discardCards: {},
  discardCard: {
    alignItems: 'center',
    justifyContent: 'center',
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
    justifyContent: 'space-around',
    marginBottom: 12,
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
