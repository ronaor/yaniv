import React, {useRef} from 'react';
import {View, StyleSheet, TouchableOpacity, FlatList} from 'react-native';
import AvatarImage from './avatarImage';

interface AvatarPickerProps {
  selectedIndex: number;
  onSelectAvatar: (index: number) => void;
}

// Constants for avatar grid configuration
const AVATAR_CONFIG = {
  SIZE: 64,
  TOTAL_COUNT: 49, // 7x7 grid
  PER_ROW: 3,
  BORDER_WIDTH: 3,
  BORDER_RADIUS: 36,
  PADDING: 1,
} as const;

const CONTAINER_CONFIG = {
  MIN_HEIGHT: 200,
  MAX_HEIGHT: 280,
  BORDER_RADIUS: 20,
  BORDER_WIDTH: 2,
  SCROLL_PADDING: 8,
} as const;

const COLORS = {
  BACKGROUND: '#FDE5B8',
  BORDER: '#7c401aff',
  SELECTED_BORDER: '#65D000',
  SELECTED_BACKGROUND: '#65D00040',
} as const;

const data = Array.from({length: AVATAR_CONFIG.TOTAL_COUNT}, (_, i) => i);

const AvatarPicker: React.FC<AvatarPickerProps> = ({
  selectedIndex,
  onSelectAvatar,
}) => {
  const flatListRef = useRef<FlatList>(null);

  // Calculate item layout for scrollToIndex
  const getItemLayout = (_: any, index: number) => {
    const itemHeight =
      AVATAR_CONFIG.SIZE +
      AVATAR_CONFIG.PADDING * 2 +
      AVATAR_CONFIG.BORDER_WIDTH * 2;
    return {
      length: itemHeight,
      offset: itemHeight * index,
      index,
    };
  };

  // Handle scroll failures
  const onScrollToIndexFailed = (info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => {
    // Fallback: scroll to offset based on average item length
    const offset = info.averageItemLength * info.index;
    flatListRef.current?.scrollToOffset({offset, animated: false});

    // Retry after a short delay
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({index: info.index, animated: false});
    }, 100);
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        style={styles.scrollContainer}
        data={data}
        numColumns={AVATAR_CONFIG.PER_ROW}
        getItemLayout={getItemLayout}
        onScrollToIndexFailed={onScrollToIndexFailed}
        renderItem={({item: index}) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.avatarButton,
              index === selectedIndex && styles.selectedAvatar,
            ]}
            onPress={() => onSelectAvatar(index)}>
            <AvatarImage index={index} size={AVATAR_CONFIG.SIZE} />
          </TouchableOpacity>
        )}
        onContentSizeChange={() => {
          if (flatListRef.current && selectedIndex >= 0) {
            const rowIndex = Math.floor(selectedIndex / AVATAR_CONFIG.PER_ROW);
            flatListRef.current.scrollToIndex({
              index: rowIndex,
              animated: false,
            });
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: CONTAINER_CONFIG.MIN_HEIGHT,
    maxHeight: CONTAINER_CONFIG.MAX_HEIGHT,
    borderRadius: CONTAINER_CONFIG.BORDER_RADIUS,
    backgroundColor: COLORS.BACKGROUND,
    borderWidth: CONTAINER_CONFIG.BORDER_WIDTH,
    borderColor: COLORS.BORDER,
    overflow: 'hidden',
  },
  scrollContainer: {
    flex: 1,
  },
  gridContainer: {},
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  avatarButton: {
    borderRadius: AVATAR_CONFIG.BORDER_RADIUS,
    padding: AVATAR_CONFIG.PADDING,
    borderWidth: AVATAR_CONFIG.BORDER_WIDTH,
    borderColor: 'transparent',
    aspectRatio: 1,
  },
  selectedAvatar: {
    borderColor: COLORS.SELECTED_BORDER,
    backgroundColor: COLORS.SELECTED_BACKGROUND,
  },
});

export default AvatarPicker;
