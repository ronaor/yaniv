import type {ReactNode} from 'react';
import {forwardRef, useCallback, useImperativeHandle, useState} from 'react';
import {Modal, Pressable, StyleSheet, View} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  LinearTransition,
  runOnJS,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import React from 'react';
import {SCREEN_HEIGHT, SCREEN_WIDTH} from '~/utils/constants';
import {noop} from 'lodash';

const MIN_TRANSLATE_Y = SCREEN_HEIGHT / 4;
const styles = StyleSheet.create({
  bottomSheetContainer: {
    width: SCREEN_WIDTH,
    borderBottomStartRadius: 25,
    borderBottomEndRadius: 25,
    backgroundColor: '#FFFFFFF',
  },
  line: {
    width: 80,
    height: 2,
    marginVertical: 15,
    backgroundColor: 'grey',
    alignSelf: 'center',
    borderRadius: 2,
  },
  childrenWrapper: {overflow: 'hidden'},
});

export type SlideDownProps = {
  children?: ReactNode;
  onClose?: () => void;
};

export type SlideDownRef = {
  open: () => void;
  close: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SlideDown = forwardRef<SlideDownRef, SlideDownProps>(
  ({children, onClose}, ref) => {
    const translateY = useSharedValue(0);
    const [childHeight, setChildHeight] = useState<number>(0);
    const [openClicked, setOpenClicked] = useState(false);
    const insets = useSafeAreaInsets();

    const close = useCallback(() => {
      translateY.value = withTiming(-childHeight, undefined, () => {
        runOnJS(onClose ?? noop)();
      });
    }, [childHeight, onClose, translateY]);

    const open = useCallback(() => {
      setOpenClicked(true);
    }, []);

    useImperativeHandle(ref, () => ({open, close}), [open, close]);

    const gesture = Gesture.Pan()
      .onUpdate(event => {
        translateY.value = Math.min(event.translationY, 0);
      })
      .onEnd(event => {
        if (event.absoluteY < MIN_TRANSLATE_Y) {
          translateY.value = withTiming(-childHeight, undefined, () => {
            runOnJS(setOpenClicked)(false);
          });
        } else {
          translateY.value = withTiming(0);
        }
      });

    const rBottomSheetStyle = useAnimatedStyle(() => {
      return {
        transform: [
          {
            translateY: translateY.value,
          },
        ],
      };
    });

    const backgroundAnimStyle = useAnimatedStyle(() => {
      const input = [-SCREEN_HEIGHT, 0];
      const output = [0, 0.8];
      const opacity = interpolate(
        translateY.value,
        input,
        output,
        Extrapolation.CLAMP,
      );
      return {
        position: 'absolute', //StyleSheet.absoluteFillObject
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        opacity: opacity,
        height: SCREEN_HEIGHT,
        backgroundColor: '#5d5d67ff',
      };
    });

    const gestureStyle = {
      flex: 1,
      top: insets.top,
      bottom: insets.bottom,
      left: insets.left,
      right: insets.right,
    };
    return (
      <>
        <Modal
          visible={openClicked}
          transparent
          statusBarTranslucent
          onShow={() => {
            translateY.value = withTiming(0);
          }}
          onRequestClose={close}
          style={{
            height: SCREEN_HEIGHT,
            width: SCREEN_WIDTH,
          }}>
          <GestureHandlerRootView style={gestureStyle}>
            <AnimatedPressable onPress={close} style={backgroundAnimStyle} />
            <Animated.View
              layout={LinearTransition}
              entering={SlideInUp}
              onLayout={e => {
                setChildHeight(e.nativeEvent.layout.height + insets.top);
              }}
              style={[styles.bottomSheetContainer, rBottomSheetStyle]}>
              <Animated.View
                layout={LinearTransition}
                entering={SlideInUp}
                style={styles.childrenWrapper}>
                {children}
              </Animated.View>
              <Animated.View layout={LinearTransition}>
                <GestureDetector gesture={gesture}>
                  <View style={styles.line} />
                </GestureDetector>
              </Animated.View>
            </Animated.View>
          </GestureHandlerRootView>
        </Modal>
      </>
    );
  },
);

export default SlideDown;
