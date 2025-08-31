import React, {useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {Image} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {noop} from 'lodash';
import BasePressable from '../basePressable';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import EmojiImage from '../emojis/emojiImage';
import {FlatList} from 'react-native-gesture-handler';

const emojisPath = require('~/assets/images/button_emojis2.png');
const emojisPathDisabled = require('~/assets/images/button_emojis2_d.png');

interface EmojiPickerOverlayProps {
  disabled?: boolean;
  onEmojiSelect?: (index: number) => void;
}

const EMOJI_DATA = Array.from({length: 9}, (_, i) => i);

function EmojiPickerOverlay({
  disabled = false,
  onEmojiSelect = noop,
}: EmojiPickerOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const expandAnimation = useSharedValue(0);
  const opacityAnimation = useSharedValue(0);

  const buttonStyle = disabled
    ? {
        image: emojisPathDisabled,
        gradientColors: ['#acacacff', '#545454ff'],
        backgroundStyle: {backgroundColor: '#838383ff'},
        borderColor: {borderColor: '#2e2e2eff'},
      }
    : {
        image: emojisPath,
        gradientColors: ['#ffd798ff', '#bd5b00ff'],
        backgroundStyle: {backgroundColor: '#E9872A'},
        borderColor: {borderColor: '#732C03'},
      };

  const handleToggle = () => {
    if (disabled) {
      return;
    }

    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    if (newExpanded) {
      expandAnimation.value = withSpring(1, {damping: 15, stiffness: 150});
      opacityAnimation.value = withTiming(1, {duration: 200});
    } else {
      expandAnimation.value = withSpring(0, {damping: 15, stiffness: 150});
      opacityAnimation.value = withTiming(0, {duration: 150});
    }
  };

  const handleEmojiPress = (index: number) => {
    onEmojiSelect(index);
    handleToggle(); // Close after selection
  };

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    width: 260,
    transform: [{scale: expandAnimation.value}],
    opacity: opacityAnimation.value,
  }));

  const renderEmoji = ({item}: {item: number}) => (
    <BasePressable
      onPress={() => handleEmojiPress(item)}
      style={styles.emojiItem}>
      <EmojiImage index={item} size={40} />
    </BasePressable>
  );

  return (
    <View style={styles.container}>
      {/* Expanded overlay */}
      <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
        <FlatList
          data={EMOJI_DATA}
          renderItem={renderEmoji}
          horizontal
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={EMOJI_DATA.length - 1}
          contentContainerStyle={styles.flatListContent}
          style={styles.overlayContent}
          keyExtractor={item => item.toString()}
        />
      </Animated.View>

      {/* Main button */}
      <BasePressable onPress={handleToggle} style={styles.mainButton}>
        <LinearGradient
          style={[styles.buttonWrapper, buttonStyle.borderColor]}
          colors={buttonStyle.gradientColors}>
          <Image
            source={buttonStyle.image}
            style={[styles.image, buttonStyle.backgroundStyle]}
            resizeMode="stretch"
          />
        </LinearGradient>
      </BasePressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    borderRadius: 25,
    zIndex: 300,
    top: -50,
    right: 0,
    overflow: 'hidden',
  },
  overlayGradient: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 25,
    padding: 2,
  },
  overlayContent: {
    backgroundColor: '#fdf7e2cc',
    borderRadius: 30,
    padding: 2,
  },
  flatListContent: {
    alignItems: 'center',
    borderRadius: 30,
    overflow: 'hidden',
  },
  emojiItem: {},
  mainButton: {
    zIndex: 2,
  },
  buttonWrapper: {
    borderWidth: 2,
    padding: 2,
    borderRadius: 25,
    borderColor: '#994a00',
  },
  image: {
    width: 30,
    height: 30,
    borderRadius: 20,
  },
});

export default EmojiPickerOverlay;
