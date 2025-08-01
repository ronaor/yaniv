import {Pressable, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import {OutlinedText} from '../cartoonText';

interface MenuButtonProps {
  text: string;
  onPress: () => void;
  disabled?: boolean;
}

const MenuButton = ({text, onPress, disabled = false}: MenuButtonProps) => {
  const gradientColors = disabled
    ? ['#BBBBBB', '#999999']
    : ['#FDA81F', '#C25D17'];

  const internalGradientColors = disabled
    ? ['#CCCCCC', '#CCCCCC']
    : ['#C6600E', '#A6460C'];

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
              fontSize={28}
              width={400}
              height={70}
              fillColor={disabled ? '#F0F0F0' : '#FEF3C7'}
              strokeColor={disabled ? '#888888' : '#7B2F04'}
              strokeWidth={5}
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
    backgroundColor: '#843402',
    borderRadius: 34,
    borderWidth: 3,
    borderColor: '#5D2607',
    paddingBottom: 5,
    paddingHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabled: {
    backgroundColor: '#999999',
    borderColor: '#666666',
  },
  gradient: {
    borderRadius: 30,
    paddingVertical: 3,
    paddingHorizontal: 2,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#BC5810',
    borderRadius: 27,
    paddingVertical: 10,
    paddingHorizontal: 15,
    minHeight: 53,
  },
  contentDisabled: {
    backgroundColor: '#CCCCCC',
  },
  text: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'transparent',
    textAlign: 'center',
  },
  textDisabled: {
    color: '#F0F0F0',
  },
  pressed: {
    paddingBottom: 0,
    marginTop: 5,
  },
  textSection: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{translateY: -2}, {scaleX: 0.96}],
  },
});

export default MenuButton;
