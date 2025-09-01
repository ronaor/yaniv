import React, {useState, useEffect} from 'react';
import {View, StyleSheet, Image, Dimensions} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {noop} from 'lodash';
import BasePressable from '../basePressable';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import EmojiImage from '../emojis/emojiImage';
import {FlatList} from 'react-native-gesture-handler';

const emojisPath = require('~/assets/images/button_emojis2.png');
const emojisPathDisabled = require('~/assets/images/button_emojis2_d.png');

const {width: screenWidth} = Dimensions.get('screen');

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

  // NEW: cooldown state (locks the button for ~3s)
  const [cooldown, setCooldown] = useState(false);
  const cooldownProgress = useSharedValue(0); // 1 -> 0 over 3s
  const COOLDOWN_MS = 3000;

  // list ref from previous answer is optional; leaving component focused on cooldown
  const expandAnimation = useSharedValue(0);
  const opacityAnimation = useSharedValue(0);

  const isDisabled = disabled || cooldown;

  const buttonStyle = isDisabled
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

  const startCooldown = () => {
    setCooldown(true);
    cooldownProgress.value = 1;
    cooldownProgress.value = withTiming(
      0,
      {duration: COOLDOWN_MS},
      finished => {
        if (finished) {
          runOnJS(setCooldown)(false);
        }
      },
    );
  };

  const handleToggle = () => {
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
    handleToggle();
    startCooldown();
  };

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    width: screenWidth - 30,
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

  // Cleanup: if component unmounts mid-cooldown, just let it end gracefully
  useEffect(() => {
    return () => {
      // nothing special needed; withTiming will stop with the view
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Expanded overlay */}
      <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
        <FlatList
          data={EMOJI_DATA}
          renderItem={renderEmoji}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          style={styles.overlayContent}
          keyExtractor={item => item.toString()}
        />
      </Animated.View>

      {/* Main button */}
      <BasePressable
        onPress={handleToggle}
        style={styles.mainButton}
        disabled={isDisabled}>
        <LinearGradient
          style={[styles.buttonWrapper, buttonStyle.borderColor]}
          colors={buttonStyle.gradientColors}>
          <View style={styles.buttonInner}>
            <Image
              source={buttonStyle.image}
              style={[styles.image, buttonStyle.backgroundStyle]}
              resizeMode="stretch"
            />
          </View>
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
  buttonInner: {
    position: 'relative',
  },
  image: {
    width: 30,
    height: 30,
    borderRadius: 20,
  },
  // Cooldown progress bar (shrinks from full width to 0 in 3s)
});

export default EmojiPickerOverlay;
