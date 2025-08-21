import {Pressable, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';

import {normalize} from '~/utils/ui';

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
    ? ['#BBBBBB', '#999999']
    : [colors[0], colors[2]];

  const textStyle = {
    fontSize: size === 'medium' ? normalize(20) : normalize(15),
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

  return (
    <Pressable
      onPress={onPress}
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
    backgroundColor: '#CCCCCC',
  },
  textDisabled: {
    color: '#F0F0F0',
  },
  pressed: {
    paddingBottom: 0,
    marginTop: 3,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default SimpleButton;
