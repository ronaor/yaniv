import React from 'react';
import Svg, {FontWeight, Text} from 'react-native-svg';

interface OutlinedTextProps {
  text: string;
  fontSize: number;
  width: number;
  height: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth?: number;
  fontFamily?: string;
  fontWeight?: FontWeight;
}

export const OutlinedText = ({
  text,
  fontSize,
  width,
  height,
  fillColor,
  strokeColor,
  strokeWidth = 3,
  fontFamily,
  fontWeight,
}: OutlinedTextProps) => {
  const centerX = width / 2;
  const centerY = height / 2;

  const textProps = {
    fontSize,
    fontWeight,
    x: centerX,
    y: centerY + 2.5,
    textAnchor: 'middle' as const,
    alignmentBaseline: 'central' as const,
    fontFamily,
  };

  return (
    <Svg height={height} width={width}>
      {/* Stroke layer */}
      <Text
        {...textProps}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round">
        {text}
      </Text>

      {/* Fill layer */}
      <Text {...textProps} fill={fillColor}>
        {text}
      </Text>
    </Svg>
  );
};
