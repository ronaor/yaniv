import React from 'react';
import {View, StyleSheet} from 'react-native';
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated';
import {OutlinedText} from '../cartoonText';
import CardShuffle from './cardsShuffle';

const LoadingOverlay = () => {
  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      pointerEvents={'none'}
      style={styles.overlay}>
      <View style={styles.content}>
        <View style={styles.cards}>
          <CardShuffle startAnimation loops={-1} />
        </View>

        <View style={styles.loadingText}>
          <OutlinedText
            text="Loading.."
            fontSize={30}
            width={300}
            height={32}
            fillColor={'#ffffffff'}
            strokeColor={'#231c18ff'}
            strokeWidth={7}
            fontFamily="LuckiestGuy-Regular"
          />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#4d442fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  content: {
    alignItems: 'center',
  },
  loadingText: {
    top: 100,
  },
  cards: {
    right: 30,
    bottom: 50,
  },
});

export default LoadingOverlay;
