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
  // Shadow padding to prevent cropping
  const shadowPadding = 2;
  const canvasWidth = width + shadowPadding * 2;
  const canvasHeight = height + shadowPadding * 2;

  // Offset card position to center it in the larger canvas
  const cardX = shadowPadding;
  const cardY = shadowPadding;

  // Create the wave path data for each vertical line
  const createWavePath = (x: number) => {
    const adjustedX = x + cardX; // Adjust for card offset
    return `M${adjustedX} ${66 + cardY}C${adjustedX} ${66 + cardY} ${
      adjustedX + 4.76
    } ${59.28 + cardY} ${adjustedX} ${50.75 + cardY}C${adjustedX - 4.76} ${
      42.22 + cardY
    } ${adjustedX} ${35.5 + cardY} ${adjustedX} ${35.5 + cardY}C${adjustedX} ${
      35.5 + cardY
    } ${adjustedX + 5.62} ${28.26 + cardY} ${adjustedX} ${20.25 + cardY}C${
      adjustedX - 5.62
    } ${12.24 + cardY} ${adjustedX} ${5 + cardY} ${adjustedX} ${5 + cardY}`;
  };

  return (
    <Canvas
      style={{
        width: canvasWidth,
        height: canvasHeight,
      }}>
      {/* Cartoonish shadow - offset and darker */}
      <RoundedRect
        x={0}
        y={0}
        width={width + cardX * 2}
        height={height + cardY * 2}
        r={8}
        color="#b8a08218"
      />
      {/* Outer card background with shadow */}
      <RoundedRect
        x={cardX}
        y={cardY}
        width={width}
        height={height}
        r={8}
        color="#FFF8E6"
      />

      <RoundedRect
        x={cardX + 5}
        y={cardY + 5}
        width={width - 10}
        height={height - 10}
        r={5}
        color="#26A2C5"
      />

      {/* Mask for the wave patterns */}
      <Mask
        mask={
          <RoundedRect
            x={cardX + 5}
            y={cardY + 5}
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
              strokeWidth={2}
              color="#34accdff"
              strokeCap="round"
            />
          ))}
        </Group>
      </Mask>
    </Canvas>
  );
};

export default CardBack;
