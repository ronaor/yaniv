import React from 'react';
import Svg, {FontWeight, Text} from 'react-native-svg';

type TextAnchor = 'start' | 'middle' | 'end';
type AlignmentBaseline = 'top' | 'central' | 'bottom';

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
  textAnchor?: TextAnchor;
  alignmentBaseline?: AlignmentBaseline;
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
  textAnchor = 'middle',
  alignmentBaseline = 'central',
}: OutlinedTextProps) => {
  // Calculate x position based on anchor
  const getX = () => {
    switch (textAnchor) {
      case 'start':
        return 3;
      case 'end':
        return width;
      case 'middle':
      default:
        return width / 2;
    }
  };

  // Calculate y position based on baseline
  const getY = () => {
    switch (alignmentBaseline) {
      case 'top':
        return fontSize;
      case 'bottom':
        return height;
      case 'central':
      default:
        return height / 2 + 2.5;
    }
  };

  const textProps = {
    fontSize,
    fontWeight,
    x: getX(),
    y: getY(),
    textAnchor,
    alignmentBaseline,
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
