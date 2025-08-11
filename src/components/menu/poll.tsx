import React, {useEffect, useMemo, useState} from 'react';
import {StyleSheet, Text, View, LayoutChangeEvent} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {useRoomStore} from '~/store/roomStore';

interface PollProps {
  choices: {
    name: string;
    choice: any;
  }[];
}

interface VoteData {
  choice: string;
  numVotes: number;
  percentage: number;
  users: string[];
  isUserChoice: boolean;
}

interface AnimatedVoteBarProps {
  vote: VoteData;
  containerWidth: number;
}

const AnimatedVoteBar = ({vote, containerWidth}: AnimatedVoteBarProps) => {
  const width = useSharedValue((vote.percentage / 100) * containerWidth);

  useEffect(() => {
    const targetWidth = (vote.percentage / 100) * containerWidth;
    width.value = withTiming(targetWidth, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [vote.percentage, containerWidth, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
  }));

  return (
    <Animated.View
      style={[
        styles.voteBar,
        animatedStyle,
        vote.isUserChoice ? styles.userVoteBar : styles.otherVoteBar,
      ]}>
      <View style={styles.voteContent}>
        <Text style={styles.choiceText}>{vote.choice}</Text>
        <Text style={styles.percentageText}>({vote.percentage}%)</Text>
      </View>
    </Animated.View>
  );
};

function Poll({choices}: PollProps) {
  const {nickName} = useRoomStore();
  const [containerWidth, setContainerWidth] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const votes = useMemo((): VoteData[] => {
    if (choices.length === 0) {
      return [];
    }

    const groupedChoices = choices.reduce<Record<string, string[]>>(
      (acc, playerChoice) => {
        const choiceKey = String(playerChoice.choice);
        acc[choiceKey] = acc[choiceKey] || [];
        acc[choiceKey].push(playerChoice.name);
        return acc;
      },
      {},
    );

    const totalVotes = choices.length;

    return Object.entries(groupedChoices).map(([choice, users]) => ({
      choice,
      numVotes: users.length,
      percentage: Math.round((users.length / totalVotes) * 100),
      users,
      isUserChoice: users.includes(nickName),
    }));
  }, [choices, nickName]);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {containerWidth > 0 &&
        votes.map(vote => (
          <AnimatedVoteBar
            key={vote.choice}
            vote={vote}
            containerWidth={containerWidth}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#582100',
  },
  voteBar: {
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userVoteBar: {
    backgroundColor: '#45AC27',
  },
  otherVoteBar: {
    backgroundColor: '#ffaa01',
  },
  voteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  choiceText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
});

export default Poll;
