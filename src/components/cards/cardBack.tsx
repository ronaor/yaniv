import React from 'react';
import {
  Canvas,
  Path,
  RoundedRect,
  Mask,
  Group,
} from '@shopify/react-native-skia';

interface CardBackProps {
  width?: number;
  height?: number;
}

const CardBack: React.FC<CardBackProps> = ({width = 50, height = 70}) => {
  // Create the wave path data for each vertical line
  const createWavePath = (x: number) => {
    return `M${x} 66C${x} 66 ${x + 4.76} 59.28 ${x} 50.75C${
      x - 4.76
    } 42.22 ${x} 35.5 ${x} 35.5C${x} 35.5 ${x + 5.62} 28.26 ${x} 20.25C${
      x - 5.62
    } 12.24 ${x} 5 ${x} 5`;
  };

  return (
    <Canvas style={{width, height}}>
      {/* Outer card background */}
      <RoundedRect
        x={0}
        y={0}
        width={width}
        height={height}
        r={8}
        color="#FFF8E6"
      />

      {/* Inner card with border */}
      <RoundedRect
        x={4.5}
        y={4.5}
        width={width - 9}
        height={height - 9}
        r={4.5}
        color="#038DBB"
        style="stroke"
        strokeWidth={1}
      />

      <RoundedRect
        x={5}
        y={5}
        width={width - 10}
        height={height - 10}
        r={5}
        color="#038DBB"
      />

      {/* Mask for the wave patterns */}
      <Mask
        mask={
          <RoundedRect
            x={5}
            y={5}
            width={width - 10}
            height={height - 10}
            r={5}
            color="white"
          />
        }>
        <Group>
          {/* Wave patterns - 5 vertical lines */}
          {[40.5, 32.5, 24.5, 16.5, 8.5].map((x, index) => (
            <Path
              key={index}
              path={createWavePath(x)}
              style="stroke"
              strokeWidth={3}
              color="#05A8D1"
              strokeCap="round"
            />
          ))}
        </Group>
      </Mask>
    </Canvas>
  );
};

export default CardBack;
