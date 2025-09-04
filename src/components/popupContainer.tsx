import type {FC} from 'react';
import React, {useState} from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {SCREEN_HEIGHT, SCREEN_WIDTH} from '~/utils/constants';

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

    return (
      <Modal transparent visible={isModalOpen || isModalActive}>
        <KeyboardAvoidingView
          style={styles.body}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
        </KeyboardAvoidingView>
      </Modal>
    );
  };
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    position: 'absolute',
    height: SCREEN_HEIGHT,
    backgroundColor: 'black',
    width: '100%',
  },
  pressable: {flex: 1},
});

export default withModalPopUpContainer;
