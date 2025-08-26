import React from 'react';
import {View, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';
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
  BACKGROUND: '#ffeeb7ff',
  BORDER: '#7c401aff',
  SELECTED_BORDER: '#65D000',
  SELECTED_BACKGROUND: '#65D00040',
} as const;

const AvatarPicker: React.FC<AvatarPickerProps> = ({
  selectedIndex,
  onSelectAvatar,
}) => {
  const renderAvatarRow = (startIndex: number) => {
    const rowAvatars = [];
    for (let i = 0; i < AVATAR_CONFIG.PER_ROW; i++) {
      const index = startIndex + i;
      if (index >= AVATAR_CONFIG.TOTAL_COUNT) {
        break;
      }

      const isSelected = index === selectedIndex;

      rowAvatars.push(
        <TouchableOpacity
          key={index}
          style={[styles.avatarButton, isSelected && styles.selectedAvatar]}
          onPress={() => onSelectAvatar(index)}>
          <AvatarImage index={index} size={AVATAR_CONFIG.SIZE} />
        </TouchableOpacity>,
      );
    }
    return rowAvatars;
  };

  const totalRows = Math.ceil(
    AVATAR_CONFIG.TOTAL_COUNT / AVATAR_CONFIG.PER_ROW,
  );
  const selectedRow = Math.floor(selectedIndex / AVATAR_CONFIG.PER_ROW);
  const rowHeight = AVATAR_CONFIG.SIZE + CONTAINER_CONFIG.SCROLL_PADDING;
  const initialScrollY = Math.max(
    0,
    selectedRow * rowHeight - CONTAINER_CONFIG.MAX_HEIGHT / 3,
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        contentOffset={{x: 0, y: initialScrollY}}>
        {Array.from({length: totalRows}, (_, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {renderAvatarRow(rowIndex * AVATAR_CONFIG.PER_ROW)}
          </View>
        ))}
      </ScrollView>
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
