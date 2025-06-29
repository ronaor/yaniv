import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

type CircleCheckBoxProps = {
  title: string;
  choices: string[];
  value: string;
  onChangeSelection: (selected: string) => void;
};

const getCircleSize = (length: number) => {
  const maxSize = 48;
  const minSize = 28;
  const maxChoices = 5;
  const step = (maxSize - minSize) / (maxChoices - 1);
  const size = maxSize - (length - 1) * step;
  return Math.max(minSize, size);
};

const CircleCheckBox: React.FC<CircleCheckBoxProps> = ({
  title,
  choices,
  value,
  onChangeSelection,
}) => {
  const circleSize = getCircleSize(choices.length);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.choicesContainer}>
        {choices.map(choice => {
          const selected = value === choice;
          return (
            <TouchableOpacity
              key={choice}
              style={[
                styles.circle,
                {
                  width: circleSize,
                  height: circleSize,
                  backgroundColor: selected ? '#4CAF50' : '#fff',
                  borderColor: selected ? '#388E3C' : '#bbb',
                },
              ]}
              onPress={() => onChangeSelection(choice)}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.choiceText,
                  {
                    color: selected ? '#fff' : '#333',
                    fontSize: circleSize * 0.4,
                  },
                ]}>
                {choice}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#222',
  },
  choicesContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 2,
    marginHorizontal: 4,
  },
  choiceText: {
    fontWeight: '500',
  },
});

export default CircleCheckBox;
