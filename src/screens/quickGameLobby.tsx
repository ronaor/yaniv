import {isUndefined} from 'lodash';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Alert,
  Dimensions,
  ImageBackground,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {OutlinedText} from '~/components/cartoonText';

import LeaveButton from '~/components/menu/leaveButton';
import LogContainer from '~/components/menu/logContainer';
import SelectionBar from '~/components/menu/mainSelectionBar';
import MenuToggle from '~/components/menu/mainToggleSwitch';
import PlayersList from '~/components/menu/playersList';
import RoomTimer from '~/components/menu/roomTimer';
import {useRoomStore} from '~/store/roomStore';
import {QuickGameLobbyProps} from '~/types/navigation';
import {GAME_CONFIG} from '~/utils/constants';
import {normalize} from '~/utils/ui';

const {width: screenWidth, height: screenHeight} = Dimensions.get('screen');

function QuickGameLobby({navigation}: QuickGameLobbyProps) {
  const {players, gameState, user, leaveRoom} = useRoomStore();

  useEffect(() => {
    if (gameState === 'started') {
      navigation.replace('Game');
    }
  }, [navigation, gameState]);

  const handleLeave = useCallback(() => {
    if (players.length > 1) {
      Alert.alert('Leave Room', 'Are you sure you want to leave?', [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            leaveRoom(user);
            navigation.goBack();
          },
        },
      ]);
    } else {
      leaveRoom(user);
      navigation.goBack();
    }
  }, [players.length, leaveRoom, user, navigation]);

  const [slapDown, setSlapDown] = useState(
    GAME_CONFIG.DEFAULT_VALUES.Hard.slapDown,
  );
  const [callYanivAt, setCallYanivAt] = useState(
    GAME_CONFIG.DEFAULT_VALUES.Hard.callYanivIndex,
  );
  const [maxScoreLimit, setMaxScoreLimit] = useState(
    GAME_CONFIG.DEFAULT_VALUES.Hard.maxScoreIndex,
  );

  const {votes, setQuickGameConfig} = useRoomStore();

  const choices = useMemo(() => {
    const initialValues = {
      slapDown: [],
      canCallYaniv: [],
      maxMatchPoints: [],
    };

    if (isUndefined(votes)) {
      return initialValues;
    }

    return Object.entries(votes).reduce<{
      slapDown: {id: string; choice: boolean}[];
      canCallYaniv: {id: string; choice: number}[];
      maxMatchPoints: {id: string; choice: number}[];
    }>((res, [id, value]) => {
      res.slapDown.push({id, choice: value.slapDown});
      res.canCallYaniv.push({id, choice: value.canCallYaniv});
      res.maxMatchPoints.push({id, choice: value.maxMatchPoints});
      return res;
    }, initialValues);
  }, [votes]);

  useEffect(() => {
    let config = {
      slapDown,
      canCallYaniv: +GAME_CONFIG.CALL_YANIV_OPTIONS[callYanivAt],
      maxMatchPoints: +GAME_CONFIG.MAX_SCORE_OPTIONS[maxScoreLimit],
    };
    setQuickGameConfig(config);
  }, [setQuickGameConfig, slapDown, callYanivAt, maxScoreLimit]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require('~/assets/images/background.png')}
        style={styles.screen}>
        <View style={styles.header}>
          <LeaveButton text={'Leave'} onPress={handleLeave} />
        </View>

        <ScrollView
          horizontal={false}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.playersContainer}>
            <PlayersList players={players} />
          </View>

          <View style={styles.betweenText}>
            <OutlinedText
              text={
                gameState === 'started'
                  ? 'The Game Begin!'
                  : `Waiting for players... (${players.length}/4)`
              }
              fontSize={normalize(17)}
              width={screenWidth}
              height={normalize(60)}
              fillColor={'#FFFFFF'}
              strokeColor={'#644008'}
              fontWeight={'700'}
              strokeWidth={3}
            />
          </View>

          <View style={styles.options}>
            <LogContainer
              choices={[true, false]}
              activeChoices={choices.slapDown}
              text="Enable Slap-Down">
              <MenuToggle isOn={slapDown} setIsOn={setSlapDown} />
            </LogContainer>
            <LogContainer
              choices={GAME_CONFIG.CALL_YANIV_OPTIONS}
              activeChoices={choices.canCallYaniv}
              text="Call Yaniv at">
              <SelectionBar
                selectionIndex={callYanivAt}
                setSelection={setCallYanivAt}
                elements={GAME_CONFIG.CALL_YANIV_OPTIONS}
              />
            </LogContainer>
            <LogContainer
              choices={GAME_CONFIG.MAX_SCORE_OPTIONS}
              activeChoices={choices.maxMatchPoints}
              text="Max Score">
              <SelectionBar
                selectionIndex={maxScoreLimit}
                setSelection={setMaxScoreLimit}
                elements={GAME_CONFIG.MAX_SCORE_OPTIONS}
              />
            </LogContainer>
          </View>
        </ScrollView>

        <RoomTimer />
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screen: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
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
  playersContainer: {
    width: screenWidth * 0.75,
  },
  betweenText: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  options: {
    width: screenWidth * 0.9,
    paddingTop: 10,
    paddingBottom: screenHeight * 0.08,
    gap: 10,
  },
  scrollViewContent: {
    paddingTop: screenHeight * 0.12,
    padding: 20,
    alignItems: 'center',
  },
  scrollView: {width: '100%'},
});

export default QuickGameLobby;
