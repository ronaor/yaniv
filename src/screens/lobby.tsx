import Clipboard from '@react-native-clipboard/clipboard';
import React, {useCallback, useEffect} from 'react';
import {
  Alert,
  ImageBackground,
  StyleSheet,
  View,
  ScrollView,
  Dimensions,
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

const {width: screenWidth, height: screenHeight} = Dimensions.get('screen');

interface RoomOptionRowProps {
  text: string;
}
function RoomOptionRow({text}: RoomOptionRowProps) {
  return (
    <View style={styles.optionRow}>
      <Text style={styles.rowText}>{text}</Text>
    </View>
  );
}

function LobbyScreen({navigation}: LobbyProps) {
  const {
    roomId,
    players,
    gameState,
    nickName,
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
            leaveRoom(nickName);
            navigation.reset({index: 0, routes: [{name: 'Home'}]});
          },
        },
      ]);
    } else {
      leaveRoom(nickName);
      navigation.reset({index: 0, routes: [{name: 'Home'}]});
    }
  }, [players.length, leaveRoom, nickName, navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require('~/assets/images/background.png')}
        style={styles.screen}>
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
              width={screenWidth}
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
                <RoomOptionRow text={`Enable Slap-Down: ${config.slapDown}`} />
                <RoomOptionRow text={`Call Yaniv at: ${config.canCallYaniv}`} />
                <RoomOptionRow text={`Max Score: ${config.maxMatchPoints}`} />
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
              colors={['#61C300', '#2A7100']}
              mainColor={'#45A300'}
            />
          )}
        </View>
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
    alignItems: 'flex-start',
    zIndex: 10,
    justifyContent: 'space-between',
    width: screenWidth,
    paddingHorizontal: 10,
    paddingVertical: 10,
    position: 'absolute',
  },
  playersContainer: {
    top: 30,
    width: screenWidth * 0.75,
  },
  betweenText: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    transform: [{translateY: 16}],
  },
  options: {
    width: screenWidth * 0.8,
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
