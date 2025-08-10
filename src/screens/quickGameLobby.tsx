import React, {useCallback, useEffect, useState} from 'react';
import {
  Alert,
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView} from 'react-native-safe-area-context';
import {OutlinedText} from '~/components/cartoonText';
import CheckMark from '~/components/menu/checkMark2';

import DeclineMark from '~/components/menu/declineMark';
import LeaveButton from '~/components/menu/leaveButton';
import LogContainer from '~/components/menu/logContainer';
import SelectionBar from '~/components/menu/mainSelectionBar';
import MenuToggle from '~/components/menu/mainToggleSwitch';
import {useRoomStore} from '~/store/roomStore';
import {colors} from '~/theme';
import {QuickGameLobbyProps} from '~/types/navigation';

const {width: screenWidth} = Dimensions.get('screen');

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
    .toString()
    .padStart(2, '0')}`;
};

function QuickGameLobby({navigation}: QuickGameLobbyProps) {
  const {players, gameState, nickName, canStartTimer, leaveRoom} =
    useRoomStore();

  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timeActive, setTimeActive] = useState(false);

  useEffect(() => {
    // if (gameState === 'started') {
    //   navigation.replace('Game');
    // }
  }, [navigation, gameState]);

  useEffect(() => {
    // On unmount, always leave the room
    return () => {
      if (gameState === 'waiting') {
        leaveRoom(nickName);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaveRoom]);

  useEffect(() => {
    if (players.length < 2) {
      setTimeRemaining(0);
      setTimeActive(false);
      return;
    }

    setTimeActive(true);
    let targetSeconds = 0;
    if (players.length === 2) {
      targetSeconds = 15;
    } else if (players.length === 3) {
      targetSeconds = 10;
    } else if (players.length >= 4) {
      targetSeconds = 7;
    }

    const startTime = Date.now();
    const endTime = startTime + targetSeconds * 1000;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        // Let the backend handle game start
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [players.length, canStartTimer]);

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

  const [slapDown, setSlapDown] = useState(true);
  const [callYanivAt, setCallYanivAt] = useState(0);
  const [maxScoreLimit, setMaxScoreLimit] = useState(0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require('~/assets/images/background.png')}
        style={styles.screen}>
        <View style={styles.header}>
          <LeaveButton text={'Leave'} onPress={handleLeave} />
        </View>

        <View
          style={{
            width: '100%',
            paddingHorizontal: 50,
          }}>
          <View
            style={{
              backgroundColor: '#502404',
              padding: 3,
              borderRadius: 28,
              shadowColor: '#000',
              shadowOffset: {width: 0, height: 2},
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}>
            <LinearGradient
              style={{
                backgroundColor: '#843402',
                borderStartStartRadius: 25,
                borderStartEndRadius: 25,
                paddingHorizontal: 3,
                paddingTop: 3,
              }}
              colors={['#DE8216', '#702900']}>
              <View
                style={{
                  backgroundColor: '#A9500F',
                  borderStartStartRadius: 25,
                  borderStartEndRadius: 25,
                  padding: 5,
                }}>
                <Text
                  style={{
                    color: '#F9F09D',
                    fontSize: 27,
                    textAlign: 'center',
                    fontWeight: '700',
                    paddingBottom: 3,
                  }}>
                  {'Players'}
                </Text>
              </View>
            </LinearGradient>
            {players.map((player, index) => (
              <View
                key={player.id}
                style={{
                  backgroundColor: index % 2 === 1 ? '#903300' : '#702900',
                  borderEndStartRadius: index === players.length - 1 ? 25 : 0,
                  borderEndEndRadius: index === players.length - 1 ? 25 : 0,
                  paddingHorizontal: 3,
                  paddingBottom: index === players.length - 1 ? 3 : 0,
                }}>
                <View
                  style={{
                    backgroundColor: index % 2 === 1 ? '#AA4E08' : '#7C3709',
                    borderEndStartRadius: index === players.length - 1 ? 25 : 0,
                    borderEndEndRadius: index === players.length - 1 ? 25 : 0,
                    padding: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 15,
                  }}>
                  <View
                    style={{
                      aspectRatio: 1,
                      width: 25,
                      backgroundColor: '#F7AD02',
                      borderRadius: 25,
                      borderColor: '#3B1603',
                      borderWidth: 2,
                    }}
                  />
                  <Text
                    style={{
                      color: '#F9F09D',
                      fontSize: 20,
                      textAlign: 'left',
                      fontWeight: '700',
                    }}>
                    {player.nickName}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
        <View style={{flex: 1}}>
          <OutlinedText
            text={
              gameState === 'started'
                ? 'The Game Begin!'
                : `Waiting for players... (${players.length}/4)`
            }
            fontSize={18}
            width={screenWidth}
            height={60}
            fillColor={'#FFFFFF'}
            strokeColor={'#644008'}
            fontWeight={'700'}
            strokeWidth={3}
          />
        </View>

        <View
          style={{
            paddingTop: 10,
            paddingBottom: 80,
            width: '100%',
            paddingHorizontal: 30,
            gap: 25,
          }}>
          <LogContainer
            text="Enable Slap-Down"
            votes={
              <View
                style={{
                  flexDirection: 'row',
                  alignSelf: 'flex-end',
                  gap: 3,
                  position: 'absolute',
                  bottom: -19,
                }}>
                <CheckMark value={2} self={true} />
                <DeclineMark value={0} />
              </View>
            }>
            <MenuToggle isOn={slapDown} setIsOn={setSlapDown} />
          </LogContainer>
          <LogContainer
            text="Call Yaniv at"
            votes={
              <View
                style={{
                  flexDirection: 'row',
                  alignSelf: 'flex-end',
                  gap: 3,
                  paddingEnd: 14,
                  position: 'absolute',
                  bottom: -19,
                }}>
                <CheckMark value={1} self={true} />
                <CheckMark value={0} />
                <CheckMark value={1} self={false} />
              </View>
            }>
            <SelectionBar
              selectionIndex={callYanivAt}
              setSelection={setCallYanivAt}
              elements={['3', '5', '7']}
            />
          </LogContainer>
          <LogContainer
            text="Max Score"
            votes={
              <View
                style={{
                  flexDirection: 'row',
                  alignSelf: 'flex-end',
                  gap: 3,
                  paddingEnd: 40,
                  position: 'absolute',
                  bottom: -19,
                }}>
                <CheckMark value={2} />
                <CheckMark value={0} />
              </View>
            }>
            <SelectionBar
              selectionIndex={maxScoreLimit}
              setSelection={setMaxScoreLimit}
              elements={['100', '200']}
            />
          </LogContainer>
        </View>

        <View
          style={{
            padding: 10,
            paddingHorizontal: 14,
            backgroundColor: '#3618189b',
            borderRadius: 25,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            position: 'absolute',
            bottom: 15,
            opacity: timeActive ? 1 : 0.5,
          }}>
          <Text style={{color: 'white', fontWeight: '800', fontSize: 18}}>
            {'Game start in: '}
          </Text>
          <View
            style={{
              padding: 10,
              borderRadius: 20,
              backgroundColor: '#3b0c0c9f',
            }}>
            <Text
              style={{
                color: '#FFFFFF',
                fontWeight: '800',
                fontSize: 18,
              }}>{`${formatTime(timeRemaining)}`}</Text>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1},
  screen: {
    flex: 1,
    padding: 20,
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 100,
  },
  playerListContainer: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  player: {
    fontSize: 18,
    color: colors.text,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    textAlign: 'center',
  },
  loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
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
  flatList: {width: '100%'},
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
    justifyContent: 'space-between',
    width: screenWidth,
    paddingHorizontal: 10,
    paddingVertical: 10,
    position: 'absolute',
  },
  gradient: {
    backgroundColor: '#843402',
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#5D2607',
    paddingHorizontal: 3,
    paddingVertical: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default QuickGameLobby;
