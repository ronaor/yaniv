import {Pressable, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';

import {normalize} from '~/utils/ui';
import useSound from '~/hooks/useSound';
import {CLICK_SOUND} from '~/sounds';

interface SimpleButtonProps {
  text: string;
  onPress: () => void;
  disabled?: boolean;
  colors: [string, string, string];
  borderColor?: string;
  size?: 'small' | 'medium';
}

const SimpleButton = ({
  colors,
  borderColor = '#622800',
  text,
  onPress,
  disabled = false,
  size = 'medium',
}: SimpleButtonProps) => {
  const gradientColors = disabled
    ? ['#cececeff', '#acacacff']
    : [colors[0], colors[2]];

  const textStyle = {
    fontSize: size === 'medium' ? normalize(20) : normalize(15),
    color: disabled ? '#7c7c7cff' : '#FFFFFF',
  };
  const contentStyle =
    size === 'medium'
      ? {
          paddingVertical: 10,
          paddingHorizontal: 15,
        }
      : {
          paddingVertical: 5,
          paddingHorizontal: 10,
        };

  const {playSound} = useSound(CLICK_SOUND);

  return (
    <Pressable
      onPress={onPress}
      onPressOut={playSound}
      disabled={disabled}
      style={({pressed}) => [
        styles.container,
        {borderColor: borderColor},
        disabled
          ? styles.disabled
          : {backgroundColor: colors[colors.length - 1]},
        pressed && !disabled && styles.pressed,
      ]}>
      <LinearGradient style={styles.gradient} colors={gradientColors}>
        <View
          style={[
            styles.content,
            contentStyle,
            disabled ? styles.contentDisabled : {backgroundColor: colors[1]},
          ]}>
          <Text style={[styles.text, textStyle]}>{text}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 27,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    paddingBottom: 3,
  },
  disabled: {
    backgroundColor: '#999999',
    borderColor: '#666666',
  },
  gradient: {
    borderRadius: 25,
    paddingVertical: 3,
    paddingHorizontal: 2,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3BA209',
    borderRadius: 25,
  },
  contentDisabled: {
    backgroundColor: '#b8b8b8ff',
  },
  pressed: {
    paddingBottom: 0,
    marginTop: 3,
  },
  text: {
    fontWeight: '700',
  },
});

export default SimpleButton;
