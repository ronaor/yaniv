import React, {useEffect, useMemo, useState} from 'react';
import {StyleSheet, Text, View, LayoutChangeEvent} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {useRoomStore} from '~/store/roomStore';
import {normalize} from '~/utils/ui';

interface PollProps {
  activeChoices: {
    id: string;
    choice: any;
  }[];
  choices: any[];
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
        vote.percentage === 0
          ? styles.inactiveVoteBar
          : vote.isUserChoice
          ? styles.userVoteBar
          : styles.otherVoteBar,
      ]}>
      <View style={styles.voteContent}>
        <Text style={styles.choiceText}>{vote.choice}</Text>
        <Text style={styles.percentageText}>({vote.percentage}%)</Text>
      </View>
    </Animated.View>
  );
};

interface PollProps {
  activeChoices: {
    id: string;
    choice: any;
  }[];
  choices: any[];
}

function Poll({activeChoices, choices}: PollProps) {
  const {user} = useRoomStore();
  const [containerWidth, setContainerWidth] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const votes = useMemo((): VoteData[] => {
    if (activeChoices.length === 0) {
      return [];
    }

    // Group actual votes by choice
    const groupedChoices = activeChoices.reduce<Record<string, string[]>>(
      (acc, playerChoice) => {
        const choiceKey = String(playerChoice.choice);
        acc[choiceKey] = acc[choiceKey] || [];
        acc[choiceKey].push(playerChoice.id);
        return acc;
      },
      {},
    );

    const totalVotes = activeChoices.length;

    // Map ALL possible choices to VoteData (including those with 0 votes)
    return choices.map(choice => {
      const choiceKey = String(choice);
      const users = groupedChoices[choiceKey] || [];

      return {
        choice: choiceKey,
        numVotes: users.length,
        percentage:
          totalVotes > 0 ? Math.round((users.length / totalVotes) * 100) : 0,
        users,
        isUserChoice: users.includes(user.id),
      };
    });
  }, [activeChoices, choices, user.id]);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {containerWidth > 0 &&
        votes.map(vote => (
          <AnimatedVoteBar
            key={vote.choice} // Now stable - never changes
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
  inactiveVoteBar: {
    backgroundColor: '#a2a2a2ff',
  },
  voteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  choiceText: {
    fontSize: normalize(15),
    fontWeight: '700',
    color: 'white',
  },
  percentageText: {
    fontSize: normalize(12),
    fontWeight: '900',
    color: '#FFFFFFD0',
    transform: [{scaleX: 0.9}],
  },
});

export default Poll;
