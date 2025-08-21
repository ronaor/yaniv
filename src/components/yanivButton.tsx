import {Pressable, StyleSheet, View} from 'react-native';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import {OutlinedText} from './cartoonText';
import YanivMegaphone from './yanivMegaphone';

interface MenuButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

const YanivButton = ({onPress, disabled = false}: MenuButtonProps) => {
  const gradientColors = disabled
    ? ['#BBBBBB', '#999999']
    : ['#F5B71A', '#F77F03'];

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
          <YanivMegaphone
            width={36}
            height={36}
            scale={1.3}
            disabled={disabled}
          />

          <View style={styles.textSection}>
            <OutlinedText
              text="YANIV!"
              fontSize={30}
              width={100}
              height={32}
              fillColor={disabled ? '#F0F0F0' : '#FEF3C7'}
              strokeColor={disabled ? '#888888' : '#A9490A'}
              strokeWidth={5}
              fontFamily="LuckiestGuy-Regular"
            />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#DE5C00',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#A9490A',
    paddingBottom: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    transform: [{rotate: '5deg'}, {translateY: -10}, {scale: 0.9}],
  },
  disabled: {
    backgroundColor: '#999999',
    borderColor: '#666666',
  },
  gradient: {
    borderRadius: 16,
    padding: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FD9610',
    borderRadius: 13,
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 8,
  },
  contentDisabled: {
    backgroundColor: '#CCCCCC',
  },
  textSection: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{scaleX: 0.8}],
    marginHorizontal: -15,
  },
  pressed: {
    paddingBottom: 0,
    marginTop: 5,
  },
});

export default YanivButton;
