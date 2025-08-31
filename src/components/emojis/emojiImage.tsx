import React from 'react';
import {View, Image, StyleSheet} from 'react-native';

interface EmojiImageProps {
  index: number; // 0-8 for 3x3 grid
  size: number; // desired output size
}

const EmojiImage: React.FC<EmojiImageProps> = ({index, size}) => {
  // Grid configuration
  const COLS = 3;
  const FRAME_SIZE = 90;
  const GRID_OFFSET = 1; // Single pixel offset between frames
  const CROP_INSET = 2; // Small inset to avoid grid lines

  // Calculate position from index
  const col = index % COLS;
  const row = Math.floor(index / COLS);

  // Calculate the frame position with inset to avoid grid lines
  const frameStartX = col * (FRAME_SIZE + GRID_OFFSET) + CROP_INSET;
  const frameStartY = row * (FRAME_SIZE + GRID_OFFSET) + CROP_INSET;

  // Calculate offset position (negative to move the image)
  const offsetX = -frameStartX;
  const offsetY = -frameStartY;

  // Effective frame size after inset
  const effectiveFrameSize = FRAME_SIZE - CROP_INSET * 2;

  // Total grid size: 3 frames * 90px + 2 offsets * 1px = 273px
  const totalGridSize = COLS * FRAME_SIZE + (COLS - 1) * GRID_OFFSET; // 273px
  const scale = size / effectiveFrameSize; // Scale based on effective frame size

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
        },
      ]}>
      <Image
        source={require('~/assets/images/emojis.png')}
        style={[
          styles.gridImage,
          {
            width: totalGridSize * scale,
            height: totalGridSize * scale,
            left: offsetX * scale,
            top: offsetY * scale,
          },
        ]}
        resizeMode="stretch"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  gridImage: {
    position: 'absolute',
  },
});

export default EmojiImage;
