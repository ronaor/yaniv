import Clipboard from '@react-native-clipboard/clipboard';
import React, {useCallback, useEffect} from 'react';
import {
  Alert,
  StyleSheet,
  View,
  ScrollView,
  Text,
  Pressable,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import PlayersList from '~/components/menu/playersList';
import {useRoomStore} from '~/store/roomStore';

import {LobbyProps} from '~/types/navigation';

import {OutlinedText} from '~/components/cartoonText';

import LeaveButton from '~/components/menu/leaveButton';

import {normalize} from '~/utils/ui';
import AlternatingRowsList from '~/components/menu/alternatingRowsList';
import SimpleButton from '~/components/menu/simpleButton';
import Svg, {Image} from 'react-native-svg';
import {SCREEN_HEIGHT, SCREEN_WIDTH} from '~/utils/constants';
import SafeAreaTopBar from '~/components/safeAreaTopBar';

interface RoomOptionRowProps {
  text: string;
  src: string;
}

function RoomOptionRow({text, src}: RoomOptionRowProps) {
  return (
    <View style={styles.optionRow}>
      <Svg width={32} height={32} viewBox="0 0 100 100">
        <Image width="100" height="100" href={src} />
      </Svg>
      <Text style={styles.rowText}>{text}</Text>
    </View>
  );
}

function LobbyScreen({navigation}: LobbyProps) {
  const {
    roomId,
    players,
    gameState,
    user,
    isAdminOfPrivateRoom,
    leaveRoom,
    startPrivateGame,
    registerCallback,
    config,
  } = useRoomStore();

  useEffect(() => {
    registerCallback('kickout', () => {
      navigation.goBack();
    });
  }, [navigation, registerCallback]);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <LeaveButton text={'Leave'} onPress={handleLeave} />
          <AlternatingRowsList cornerRadius={15}>
            <Text style={styles.roomCodeTitle}>{'Room Code'}</Text>
            <Pressable
              onPress={() => {
                if (roomId) {
                  Clipboard.setString(roomId);
                  Alert.alert('קוד החדר הועתק ללוח!');
                }
              }}>
              <Text style={styles.roomCode}>{roomId}</Text>
            </Pressable>
          </AlternatingRowsList>
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
              width={SCREEN_WIDTH}
              height={normalize(60)}
              fillColor={'#FFFFFF'}
              strokeColor={'#644008'}
              fontWeight={'700'}
              strokeWidth={3}
            />
          </View>

          {config ? (
            <View style={styles.options}>
              <AlternatingRowsList>
                <RoomOptionRow
                  src={require('~/assets/images/icon_slapDown.png')}
                  text={`Enable Slap-Down: ${config.slapDown}`}
                />
                <RoomOptionRow
                  src={require('~/assets/images/icon_megaphone.png')}
                  text={`Call Yaniv at: ${config.canCallYaniv}`}
                />
                <RoomOptionRow
                  src={require('~/assets/images/icon_skull.png')}
                  text={`Max Score: ${config.maxMatchPoints}`}
                />
              </AlternatingRowsList>
            </View>
          ) : null}
        </ScrollView>
        <View style={styles.footer}>
          {isAdminOfPrivateRoom && (
            <SimpleButton
              onPress={() => roomId && startPrivateGame(roomId)}
              text="Start Game"
              disabled={players.length === 1}
              colors={['#61C300', '#45A300', '#2A7100']}
              borderColor={'#1A1208'}
            />
          )}
        </View>
      </View>
      <SafeAreaTopBar />
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
    alignItems: 'flex-start',
    zIndex: 10,
    justifyContent: 'space-between',
    width: SCREEN_WIDTH,
    paddingHorizontal: 10,
    paddingVertical: 10,
    position: 'absolute',
  },
  playersContainer: {
    top: 30,
    width: SCREEN_WIDTH * 0.75,
  },
  betweenText: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    transform: [{translateY: 16}],
  },
  options: {
    width: SCREEN_WIDTH * 0.8,
    paddingTop: 10,
    paddingBottom: SCREEN_HEIGHT * 0.08,
    gap: 10,
  },
  scrollViewContent: {
    paddingTop: SCREEN_HEIGHT * 0.12,
    padding: 20,
    alignItems: 'center',
  },
  scrollView: {width: '100%'},
  roomCodeTitle: {
    paddingVertical: 5,
    paddingHorizontal: 20,
    fontSize: 20,
    fontWeight: '700',
    color: '#FFE992',
  },
  roomCode: {
    padding: 5,
    fontSize: 30,
    fontWeight: '700',
    color: '#FFE992',
    textAlign: 'center',
  },
  footer: {padding: 20},
  rowText: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFE992',
  },
  optionRow: {padding: 5, flexDirection: 'row'},
});

export default LobbyScreen;
