import React from 'react';
import Svg, {Image} from 'react-native-svg';

interface AvatarImageProps {
  index: number; // 0-48 for 7x7 grid
  size: number; // desired output size
}

const href = require('~/assets/images/avatars.png');

const AvatarImage: React.FC<AvatarImageProps> = ({index, size}) => {
  // Grid configuration
  const COLS = 7;
  const ROWS = 7;
  const FRAME_SIZE = 125;
  const GRID_OFFSET = 1;

  // Calculate position from index
  const col = index % COLS;
  const row = Math.floor(index / ROWS);

  // Calculate crop position (accounting for 1px grid lines)
  const x = col * (FRAME_SIZE + GRID_OFFSET);
  const y = row * (FRAME_SIZE + GRID_OFFSET);

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`${x} ${y} ${FRAME_SIZE} ${FRAME_SIZE}`}>
      <Image
        width="882" // 7 * 125 + 6 * 1 = 881, but using 882 for the full grid width
        height="882" // 7 * 125 + 6 * 1 = 881, but using 882 for the full grid height
        href={href} // adjust path as needed
        preserveAspectRatio="xMidYMid meet"
      />
    </Svg>
  );
};

export default AvatarImage;
