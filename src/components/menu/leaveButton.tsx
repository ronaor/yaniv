import {Pressable, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import {OutlinedText} from '../cartoonText';

interface SimpleButtonProps {
  text: string;
  onPress: () => void;
  disabled?: boolean;
}

const SimpleButton = ({text, onPress, disabled = false}: SimpleButtonProps) => {
  const gradientColors = disabled
    ? ['#BBBBBB', '#999999']
    : ['#FF9C1E', '#A21D03'];

  const internalGradientColors = disabled
    ? ['#CCCCCC', '#CCCCCC']
    : ['#E64E08', '#D02A07'];

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
        <LinearGradient
          colors={internalGradientColors}
          style={[styles.content, disabled && styles.contentDisabled]}>
          <Text style={styles.text}>{text}</Text>
          <View style={styles.textSection}>
            <OutlinedText
              text={text}
              fontSize={20}
              width={400}
              height={70}
              fillColor={disabled ? '#F0F0F0' : '#FEF3C7'}
              strokeColor={disabled ? '#888888' : '#442517'}
              strokeWidth={3}
              fontWeight={750}
            />
          </View>
        </LinearGradient>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#9C1C04',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#1A1208',
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
    borderRadius: 18,
    paddingVertical: 3,
    paddingHorizontal: 2,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#BC5810',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  contentDisabled: {
    backgroundColor: '#CCCCCC',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'transparent',
    textAlign: 'center',
  },
  textDisabled: {
    color: '#F0F0F0',
  },
  pressed: {
    paddingBottom: 0,
    marginTop: 3,
  },
  textSection: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{translateY: -2}, {scaleX: 0.96}],
  },
});

export default SimpleButton;
