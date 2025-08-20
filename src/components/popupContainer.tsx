import type {FC} from 'react';
import React, {useEffect, useState} from 'react';
import {
  BackHandler,
  Dimensions,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
const {width: wWidth, height: wHeight} = Dimensions.get('screen');

export interface PopUpContainerProps {
  isModalOpen: boolean;
  onBackgroundPress: () => void;
}

export function withModalPopUpContainer<T extends PopUpContainerProps>(
  Component: FC<T>,
): (props: T) => JSX.Element {
  return function PopupWrapper(props: T): JSX.Element {
    const progress = useSharedValue(0);
    const [isModalActive, setModalActive] = useState<boolean>(false);
    const {isModalOpen, onBackgroundPress} = props;

    useEffect(() => {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (isModalOpen) {
            onBackgroundPress();
            return true;
          }
          return false;
        },
      );

      return () => backHandler.remove();
    }, [isModalOpen, onBackgroundPress]);

    useAnimatedReaction(
      () => (isModalOpen ? 1 : 0),
      dest =>
        (progress.value = withSpring(
          dest,
          {damping: 20, stiffness: 320},
          isFinish => {
            if (isFinish ?? false) {
              runOnJS(setModalActive)(dest === 1);
            }
          },
        )),
    );
    const bgAnimStyle = useAnimatedStyle(() => ({
      opacity: progress.value * 0.5,
    }));
    const contentAnimStyle = useAnimatedStyle(() => ({
      transform: [{scale: progress.value}],
      opacity: progress.value,
    }));

    if (!(isModalOpen || isModalActive)) {
      return <></>;
    }

    return (
      <View
        style={[
          styles.body,
          {
            width: wWidth,
            height: wHeight,
          },
        ]}>
        <Animated.View style={[bgAnimStyle, styles.bg]}>
          <Pressable
            accessible={false}
            disabled={!isModalActive}
            onPress={onBackgroundPress}
            style={styles.pressable}
          />
        </Animated.View>
        <Animated.View style={contentAnimStyle}>
          <Component {...props} />
        </Animated.View>
      </View>
    );
  };
}

const styles = StyleSheet.create({
  body: {
    position: 'absolute',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    position: 'absolute',
    height: wHeight,
    backgroundColor: 'black',
    width: '100%',
  },
  pressable: {flex: 1},
});
export default withModalPopUpContainer;
