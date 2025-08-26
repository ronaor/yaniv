import React from 'react';
import {View, Image, StyleSheet} from 'react-native';

interface AvatarImageProps {
  index: number; // 0-48 for 7x7 grid
  size: number; // desired output size
}

const AvatarImage: React.FC<AvatarImageProps> = ({index, size}) => {
  // Grid configuration
  const COLS = 7;
  const FRAME_SIZE = 125;
  const GRID_OFFSET = 1;
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

  // Total grid size
  const totalGridSize = COLS * FRAME_SIZE + (COLS - 1) * GRID_OFFSET; // 881px
  const scale = size / effectiveFrameSize; // Scale based on effective frame size

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size,
        },
      ]}>
      <Image
        source={require('~/assets/images/avatars_2.png')}
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
    borderRadius: 4, // Small border radius for the cropped avatar
  },
  gridImage: {
    position: 'absolute',
  },
});

export default AvatarImage;
