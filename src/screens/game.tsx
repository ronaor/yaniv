import React, {useCallback, useEffect, useState} from 'react';
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
import {getHandValue, useGameStore} from '~/store/gameStore';
import {useRoomStore} from '~/store/roomStore';
import {useUser} from '~/store/userStore';
import {colors, textStyles} from '~/theme';
import {getCardValue} from '~/types/cards';
import {getCardDisplayValue, getSuitSymbol} from '~/utils/visuals';

import {SafeAreaView} from 'react-native-safe-area-context';
import backgroundImg from '../assets/images/yaniv_background.png'; // adjust path as needed
import {isCanPickupCard, isValidYanivSet} from '~/utils/gameRules';

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
    completeTurn,
    callYaniv,
    clearError,
    getRemainingTime,
    lastPlayedCards,
    pickupOptions,
    roundResults,
    playersScores,
    playerId,
  } = useGameStore();

  const {name: nickName} = useUser();

  const [timeRemaining, setTimeRemaining] = useState(0);

  const canCallYaniv = () => {
    return publicState && getHandValue(playerHand) <= 7;
  };

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

  const handleDrawFromDeck = () => {
    const selected = selectedCards.map(i => playerHand[i]);
    if (!isValidYanivSet(selected, true)) {
      return false;
    }
    completeTurn(
      'deck',
      selectedCards.map(i => playerHand[i]),
    );
  };

  const handlePickupCard = (pickupIndex: number) => {
    const selected = selectedCards.map(i => playerHand[i]);
    if (
      !isCanPickupCard(pickupOptions.length, pickupIndex) ||
      !isValidYanivSet(selected, true)
    ) {
      return false;
    }

    completeTurn(
      'pickup',
      selectedCards.map(i => playerHand[i]),
      pickupIndex,
    );
  };

  const getSuitColor = (suit: string): string => {
    return suit === 'hearts' || suit === 'diamonds' ? '#FF0000' : '#000000';
  };

  const toggleCardSelection = (index: number) => {
    setSelectedCards(prev => {
      const isSelected = prev.includes(index);
      if (isSelected) {
        return prev.filter(i => i !== index);
      }

      const newSelection = [...prev, index];
      const selected = newSelection.map(i => playerHand[i]);

      if (isValidYanivSet(selected)) {
        return newSelection;
      } else {
        return prev; // לא מוסיף אם לא חוקי
      }
    });
  };

  if (!isGameActive || !publicState) {
    return (
      <View style={styles.body}>
        <Text style={textStyles.title}>טוען משחק...</Text>
      </View>
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
                הקלפים שלך: {playersScores[playerId]} נקודות
              </Text>
            </View>

            {/* Game Area */}
            <View style={styles.gameArea}>
              {/* Deck and Discard Pile */}
              <View style={styles.centerArea}>
                <TouchableOpacity
                  style={[styles.deck, isMyTurn && styles.deckHighlighted]}
                  onPress={handleDrawFromDeck}
                  disabled={!isMyTurn || selectedCards.length === 0}>
                  <Text style={styles.deckText}>{'קופה'}</Text>
                </TouchableOpacity>

                <View style={styles.discardPile}>
                  <Text style={styles.discardTitle}>קלפים:</Text>
                  <View style={styles.discardCards}>
                    {lastPlayedCards.map((card, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.discardCard,
                          isMyTurn &&
                            pickupOptions.includes(card) &&
                            isCanPickupCard(pickupOptions.length, index) &&
                            styles.pickupableCard,
                        ]}
                        onPress={() =>
                          handlePickupCard(lastPlayedCards.indexOf(card))
                        }
                        disabled={selectedCards.length === 0 || !isMyTurn}>
                        <Text
                          style={[
                            styles.cardText,
                            {color: getSuitColor(card.suit)},
                          ]}>
                          {getCardDisplayValue(card)}
                        </Text>
                        <Text style={styles.suitText}>
                          {getSuitSymbol(card.suit)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Draw Instructions */}
              {isMyTurn && (
                <View style={styles.drawInstructions}>
                  <Text style={styles.drawInstructionsText}>
                    בחר קלף לשליפה - מהערימה או מהקלפים שנזרקו
                  </Text>
                </View>
              )}
            </View>

            {/* Player's Hand */}
            <View style={styles.handSection}>
              <Text style={styles.handTitle}>
                <Text style={styles.handTitle}>
                  {getHandValue(playerHand)} נקודות
                </Text>
              </Text>
              <FlatList
                data={playerHand}
                horizontal
                keyExtractor={(item, index) =>
                  `${item.suit}-${item.value}-${index}`
                }
                renderItem={({item, index}) => (
                  <TouchableOpacity
                    style={[
                      styles.card,
                      item.isJoker && styles.jokerCard,
                      selectedCards.includes(index) && styles.selectedCard,
                    ]}
                    onPress={() => toggleCardSelection(index)}
                    disabled={!isMyTurn}>
                    <Text
                      style={[
                        styles.cardText,
                        {
                          color: item.isJoker
                            ? '#8B4513'
                            : getSuitColor(item.suit),
                        },
                      ]}>
                      {getCardDisplayValue(item)}
                    </Text>
                    <Text style={styles.suitText}>
                      {item.isJoker ? '🃏' : getSuitSymbol(item.suit)}
                    </Text>
                    <Text style={styles.cardValue}>{getCardValue(item)}</Text>
                  </TouchableOpacity>
                )}
                showsHorizontalScrollIndicator={false}
                style={styles.handList}
              />
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
                    ]}>
                    {item.nickName} - {playersScores[item.id]}
                    {item.nickName === nickName ? ' (אתה)' : ''}
                    {publicState.currentPlayer !== undefined &&
                    players[publicState.currentPlayer]?.id === item.id
                      ? ' 🎯'
                      : ''}
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
  },
  centerArea: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 12,
  },
  deck: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    width: 60,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckHighlighted: {
    backgroundColor: colors.accent,
    borderWidth: 3,
    borderColor: colors.primary,
  },
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
  discardCards: {
    flexDirection: 'row',
    gap: 8,
  },
  discardCard: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    width: 55,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupableCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    transform: [{translateY: -8}],
    borderWidth: 3,
  },
  handSection: {
    // backgroundColor: colors.card,
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
  jokerCard: {
    backgroundColor: '#FFF8DC',
    borderColor: '#8B4513',
  },
  selectedCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    transform: [{translateY: -8}],
  },
  cardText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  suitText: {
    fontSize: 18,
    marginTop: 2,
  },
  cardValue: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
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
  playBtn: {
    backgroundColor: colors.primary,
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
  clearBtn: {
    alignSelf: 'center',
    backgroundColor: colors.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  clearBtnText: {
    color: 'white',
    fontWeight: 'bold',
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
  pickupCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    transform: [{translateY: -8}],
    borderWidth: 3,
  },
});

export default GameScreen;
