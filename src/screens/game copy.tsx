import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useGameStore} from '~/store/gameStore';
import {useRoomStore} from '~/store/roomStore';
import {useUser} from '~/store/userStore';
import {colors, textStyles} from '~/theme';

import {SafeAreaView} from 'react-native-safe-area-context';
import backgroundImg from '~/assets/images/yaniv_background.png';
import {
  getCardKey,
  getHandValue,
  isCanPickupCard,
  isValidCardSet,
} from '~/utils/gameRules';

import CardBack from '~/components/cards/cardBack';
import CardPointsList from '~/components/cards/cardsPoint';
import {ActionSource, Card, Position} from '~/types/cards';
import DeckCardPointers from '~/components/cards/deckCardPoint';
import {CARD_WIDTH} from '~/utils/constants';

const {height: screenHeight, width: screenWidth} = Dimensions.get('screen');

function GameScreen({navigation}: any) {
  const {roomId, players, leaveRoom} = useRoomStore();
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const {
    publicState,
    playerHand,
    isGameActive,
    isMyTurn,
    error,
    finalScores,
    pickupCards,
    roundResults,
    playerId,
    slapDownAvailable,
    lastPickedCard,
    source,
    selectedCardsPositions,
    currentPlayerTurn,
    amountBefore,
    round,
    completeTurn,
    callYaniv,
    clearError,
    getRemainingTime,
    resetSlapDown,
    slapDown,
    clearGame,
  } = useGameStore();

  const {name: nickName} = useUser();

  const [timeRemaining, setTimeRemaining] = useState(0);

  const canCallYaniv = () => {
    return publicState && getHandValue(playerHand) <= 7;
  };

  useEffect(() => {
    return clearGame;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer for remaining time
  useEffect(() => {
    if (!isMyTurn) {
      setSelectedCards([]);
      return;
    }

    const interval = setInterval(() => {
      const remaining = getRemainingTime();
      setTimeRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isMyTurn, getRemainingTime, publicState?.turnStartTime]);

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

  // Handle game end
  useEffect(() => {
    if (publicState?.gameEnded && finalScores) {
      const winnerName =
        players.find(p => p.id === publicState.winner)?.nickName || 'לא ידוע';
      Alert.alert('המשחק הסתיים!', `הזוכה: ${winnerName}`, [
        {
          text: 'חזור לבית',
          onPress: () => navigation.reset({index: 0, routes: [{name: 'Home'}]}),
        },
      ]);
    }
  }, [
    publicState?.gameEnded,
    finalScores,
    players,
    navigation,
    publicState?.winner,
  ]);

  const pickupRef = useRef<View>(null);
  const pickupPos = useRef<Position>({x: 0, y: 0});
  const measurePickupPos = () => {
    pickupRef.current?.measure((x, y, width, height, pageX, pageY) => {
      pickupPos.current = {x: pageX + width / 2, y: pageY + height / 2};
    });
  };

  const deckPos = useRef<Position>({x: 0, y: 0});
  const deckRef = useRef<TouchableOpacity>(null);
  const measureDeckPos = () => {
    deckRef.current?.measure((x, y, width, height, pageX, pageY) => {
      deckPos.current = {x: pageX, y: pageY + height / 2};
    });
  };

  const previousPickupCards = useRef<Card[]>(pickupCards);

  const previousPlayer = useRef<string>(undefined);

  const drawCardAction = useMemo<
    | {
        source: ActionSource;
        position: Position;
      }
    | undefined
  >(() => {
    let result;
    switch (source) {
      case 'deck': {
        result = {source, position: deckPos.current};
        break;
      }
      case 'pickup': {
        const pCard = lastPickedCard!!;
        const i = previousPickupCards?.current.findIndex(
          card => getCardKey(card) === getCardKey(pCard),
        );
        result = {
          source,
          position: {
            x: pickupPos.current.x + i * CARD_WIDTH,
            y: pickupPos.current.y,
          },
        };
        break;
      }
      case 'slap': {
        break;
      }
    }
    previousPickupCards.current = pickupCards;
    return result;
  }, [lastPickedCard, pickupCards, source]);

  useEffect(() => {
    previousPlayer.current = undefined;
  }, [roundResults]);

  const activeTargets = useMemo(() => {
    if (!previousPlayer.current) {
      previousPlayer.current = currentPlayerTurn;
      return undefined;
    }

    let res;

    const cardsLen = amountBefore;

    const centerIndex = (cardsLen - 1) / 2;

    res = selectedCardsPositions.map(index => {
      const shift = index - centerIndex;
      const cardTrY =
        screenHeight + Math.pow(shift, 2) * 2 - 150 - deckPos.current.y;

      const targetX =
        screenWidth / 2 -
        (cardsLen / 2) * CARD_WIDTH +
        index * CARD_WIDTH -
        deckPos.current.x * 2;
      return {x: targetX, y: cardTrY, deg: shift * 3};
    });

    previousPlayer.current = currentPlayerTurn;

    return res;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCardsPositions, amountBefore, currentPlayerTurn, roundResults]);

  const handleDrawFromDeck = () => {
    const selected = selectedCards.map(i => playerHand[i]);
    if (!isValidCardSet(selected, true)) {
      return false;
    }
    completeTurn(
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

    completeTurn(
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
      slapDown(cardToSlap);
    }
  }, [playerHand, slapCardIndex, slapDown]);

  if (!isGameActive || !publicState) {
    return (
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.body}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
              <Text style={styles.leaveBtnText}>⟵ עזוב</Text>
            </TouchableOpacity>
            <Text style={styles.roomTitle}>חדר: {roomId}</Text>
            {isMyTurn && (
              <View style={styles.timerContainer}>
                <Text style={[styles.timer]}>{timeRemaining}s</Text>
              </View>
            )}
          </View>
          <Text style={textStyles.title}>טוען משחק...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
              {isMyTurn && (
                <View style={styles.timerContainer}>
                  <Text style={[styles.timer]}>{timeRemaining}s</Text>
                </View>
              )}
            </View>

            {/* Game Status */}
            <View style={styles.gameStatus}>
              <Text style={styles.turnInfo}>
                {isMyTurn ? 'בחר קלף לשליפה' : 'ממתין לשחקן אחר...'}
              </Text>
              <Text style={styles.handValue}>
                הקלפים שלך: {publicState.playersStats[playerId].score} נקודות
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
                    disabled={!isMyTurn || selectedCards.length === 0}>
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
                      fromTargets={activeTargets}
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
            {isMyTurn && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    styles.yanivBtn,
                    !canCallYaniv() && styles.disabledBtn,
                  ]}
                  onPress={callYaniv}
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
                      publicState.currentPlayer !== undefined &&
                        players[publicState.currentPlayer]?.id === item.id &&
                        styles.currentPlayer,
                      publicState.playersStats[item.id]?.lost && {opacity: 0.5},
                    ]}>
                    {`${item.nickName} - `}
                    {publicState.playersStats[item.id]?.score ?? 0}
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
          <CardPointsList
            cards={playerHand}
            onCardSelect={toggleCardSelection}
            slapCardIndex={slapCardIndex}
            selectedCardsIndexes={selectedCards}
            onCardSlapped={onSlapCard}
            pick={drawCardAction}
          />
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
