import {Pressable, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';

import {normalize} from '~/utils/ui';

interface CreateButtonProps {
  text: string;
  onPress: () => void;
  disabled?: boolean;
}

const CreateButton = ({text, onPress, disabled = false}: CreateButtonProps) => {
  const gradientColors = disabled
    ? ['#BBBBBB', '#999999']
    : ['#A0D72C', '#2C8408'];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({pressed}) => [
        styles.container,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <LinearGradient style={styles.gradient} colors={gradientColors}>
        <View style={[styles.content, disabled && styles.contentDisabled]}>
          <Text style={styles.text}>{text}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2C8408',
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#622800',
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
    paddingVertical: 10,
    paddingHorizontal: 15,
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
    fontSize: normalize(20),
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default CreateButton;
