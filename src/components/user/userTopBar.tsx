import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, Switch, Text, View} from 'react-native';
import {openEditProfileDialogEdit} from '../dialogs/editProfileDialog';
import {useSocket} from '~/store/socketStore';
import {useUser} from '~/store/userStore';
import {colors} from '~/theme';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, {Path} from 'react-native-svg';
import AvatarImage from './avatarImage';
import BasePressable from '../basePressable';
import {useSoundStore} from '~/hooks/useSound';
import {useSongPlayerStore} from '~/store/songPlayerStore';
import {SCREEN_HEIGHT, SCREEN_WIDTH} from '~/utils/constants';

const SettingsIcon = () => (
  <Svg width={30} height={30} viewBox="0 0 24 24" fill="white">
    <Path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
  </Svg>
);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function UserTopBar() {
  const {isConnected, isConnecting} = useSocket();
  const {user} = useUser();

  const scale = useSharedValue<number>(0);
  const [slideDownVisible, setSlideDownVisible] = useState<boolean>(false);

  const {isSoundEnabled, setIsSoundEnabled} = useSoundStore();
  const {isMusicEnabled, setIsMusicEnabled} = useSongPlayerStore();
  const topBarColor = useSharedValue('#FF0000');

  useEffect(() => {
    if (user.id !== '') {
      scale.value = withTiming(1);
    }
  }, [scale, user.id]);

  useEffect(() => {
    topBarColor.value = withTiming(
      slideDownVisible ? '#00000094' : '#000000a6',
    );
  }, [slideDownVisible, topBarColor]);

  const animatedStyle = useAnimatedStyle(() => {
    const scaleValue = scale.value;
    const translateY = -40 * (1 - scaleValue);

    return {
      backgroundColor: topBarColor.value,
      transform: [{translateY: translateY}, {scaleY: scaleValue}],
    };
  });

  const backgroundStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
  }));

  return (
    <>
      {slideDownVisible && (
        <AnimatedPressable
          entering={FadeIn}
          exiting={FadeOut}
          style={backgroundStyle}
          onTouchStart={() => setSlideDownVisible(false)}>
          <View style={styles.background} />
        </AnimatedPressable>
      )}
      <Animated.View
        layout={LinearTransition}
        style={[styles.top, animatedStyle]}>
        <View style={styles.header}>
          <BasePressable
            style={styles.userRow}
            onPress={() => openEditProfileDialogEdit(user)}>
            <View style={styles.user}>
              <View style={styles.avatarContainer}>
                <AvatarImage index={user.avatarIndex} size={40} />
              </View>
              <Text numberOfLines={1} style={styles.name}>
                {user.nickName}
              </Text>
            </View>
          </BasePressable>

          <View style={styles.rightSide}>
            <View style={styles.connectionStatus}>
              <View
                style={[
                  styles.connectionDot,
                  {
                    backgroundColor: isConnected
                      ? colors.success
                      : isConnecting
                      ? colors.warning
                      : colors.error,
                  },
                ]}
              />
              <Text style={styles.connectionText}>
                {isConnected
                  ? 'Connected'
                  : isConnecting
                  ? 'Connecting...'
                  : 'Disconnected'}
              </Text>
            </View>
            <BasePressable onPress={() => setSlideDownVisible(prev => !prev)}>
              <SettingsIcon />
            </BasePressable>
          </View>
        </View>
        {slideDownVisible && (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={styles.slideDown}>
            <View style={styles.row}>
              <Text style={styles.text}>{'Music'}</Text>
              <Switch
                value={isMusicEnabled}
                onValueChange={value => setIsMusicEnabled(value)}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.text}> {'Sound Effects'}</Text>
              <Switch
                value={isSoundEnabled}
                onValueChange={value => setIsSoundEnabled(value)}
              />
            </View>
          </Animated.View>
        )}
      </Animated.View>
    </>
  );
}

export default UserTopBar;

const styles = StyleSheet.create({
  top: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    width: '100%',
    backgroundColor: '#000000a6',
    borderBottomRightRadius: 25,
    position: 'absolute',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  userRow: {flex: 1},
  avatarContainer: {
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#13AEAF',
  },
  name: {flex: 1, fontSize: 18, color: '#FDF9D1', fontWeight: '700'},
  user: {flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1},
  connectionDot: {
    width: 10,
    aspectRatio: 1,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 16,
    color: '#8FCDCA',
    fontWeight: '600',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  rightSide: {
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  slideDown: {paddingVertical: 20},
  row: {
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    marginVertical: 15,
    height: 1,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff69',
    width: '100%',
  },
  text: {fontSize: 18, fontWeight: '700', color: '#FDF9D1'},
  background: {flex: 1, backgroundColor: '#00000028'},
});
