import React, {useEffect} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {openEditProfileDialogEdit} from '../dialogs/editProfileDialog';
import {useSocket} from '~/store/socketStore';
import {useUser} from '~/store/userStore';
import {colors} from '~/theme';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, {Path} from 'react-native-svg';
import AvatarImage from './avatarImage';

const SettingsIcon = () => (
  <Svg width={30} height={30} viewBox="0 0 24 24" fill="white">
    <Path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
  </Svg>
);

function UserTopBar() {
  const {isConnected, isConnecting} = useSocket();
  const {name, avatarIndex} = useUser();

  const scale = useSharedValue<number>(0);

  useEffect(() => {
    scale.value = withTiming(1);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => {
    const scaleValue = scale.value;
    const translateY = -40 * (1 - scaleValue);

    return {
      transform: [{translateY: translateY}, {scaleY: scaleValue}],
    };
  });

  return (
    <Animated.View style={[styles.top, animatedStyle]}>
      <TouchableOpacity
        style={styles.user}
        onPress={() => openEditProfileDialogEdit(name, avatarIndex)}>
        <View style={styles.avatarContainer}>
          <AvatarImage index={avatarIndex} size={40} />
        </View>
        <Text style={styles.name}>{name}</Text>
      </TouchableOpacity>

      <View style={styles.leftSide}>
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
        <SettingsIcon />
      </View>
    </Animated.View>
  );
}

export default UserTopBar;

const styles = StyleSheet.create({
  top: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#00515B',
    borderBottomRightRadius: 25,
    position: 'absolute',
    alignItems: 'center',
  },
  avatarContainer: {
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#13AEAF',
  },
  name: {fontSize: 18, color: '#FDF9D1', fontWeight: '700'},
  user: {flexDirection: 'row', alignItems: 'center', gap: 10},
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
  leftSide: {
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
