import React, {useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {colors} from '~/theme';
import CheckBox from './checkBox';
import CircleCheckBox from './circleCheckBox';
import MenuButton from '~/components/menu/menuButton';
import {useRoomStore} from '~/store/roomStore';
import {RoomConfig} from '~/types/player';
import {isEmpty} from 'lodash';

type StartGameDialogProps = {
  isQuickGameLobby?: boolean;
  onCreateRoom: (data: RoomConfig) => void;
};

export default function StartGameDialog({
  isQuickGameLobby,
  onCreateRoom,
}: StartGameDialogProps) {
  const [slapDown, setSlapDown] = useState(true);
  const [timePerPlayer, setTimePerPlayer] = useState(15);
  const [canCallYaniv, setCanCallYaniv] = useState(7);
  const [maxMatchPoints, setMatchMaxPoints] = useState(100);
  const {roomId, nickName, votes, setQuickGameConfig} = useRoomStore();

  const {
    slapDownVotes,
    timePerPlayerVotes,
    canCallYanivVotes,
    maxMatchPointsVotes,
  } = React.useMemo(() => {
    const othersVotes = isEmpty(votes)
      ? []
      : Object.entries(votes)
          .filter(([nick]) => nick !== nickName)
          .map(([, config]) => config);

    return {
      slapDownVotes: othersVotes.map(v => v.slapDown),
      timePerPlayerVotes: othersVotes.map(v => v.timePerPlayer.toString()),
      canCallYanivVotes: othersVotes.map(v => v.canCallYaniv.toString()),
      maxMatchPointsVotes: othersVotes.map(v => v.maxMatchPoints.toString()),
    };
  }, [votes, nickName]);

  useEffect(() => {
    if (
      isQuickGameLobby &&
      roomId &&
      timePerPlayer &&
      canCallYaniv &&
      maxMatchPoints
    ) {
      let config = {slapDown, timePerPlayer, canCallYaniv, maxMatchPoints};
      setQuickGameConfig(roomId, nickName, config);
    }
  }, [
    setQuickGameConfig,
    roomId,
    slapDown,
    timePerPlayer,
    canCallYaniv,
    maxMatchPoints,
    isQuickGameLobby,
    nickName,
  ]);

  const handleCreateRoom = () => {
    onCreateRoom({
      slapDown,
      timePerPlayer,
      canCallYaniv,
      maxMatchPoints,
    });
  };

  return (
    <>
      <View style={styles.dialogBody}>
        <CheckBox
          title="הדבקות"
          onChangeSelection={setSlapDown}
          value={slapDown}
          otherVotes={slapDownVotes}
        />
        <CircleCheckBox
          title="משך תור :"
          choices={['5', '10', '15']}
          value={timePerPlayer}
          onChangeSelection={setTimePerPlayer}
          otherVotes={timePerPlayerVotes}
        />
        <CircleCheckBox
          title="אפשר להגיד יניב ב :"
          choices={['3', '5', '7']}
          value={canCallYaniv}
          onChangeSelection={setCanCallYaniv}
          otherVotes={canCallYanivVotes}
        />
        <CircleCheckBox
          title="מקסימום נקודות למשחק :"
          choices={['100', '200']}
          value={maxMatchPoints}
          onChangeSelection={setMatchMaxPoints}
          otherVotes={maxMatchPointsVotes}
        />
        {!isQuickGameLobby && (
          <MenuButton onPress={handleCreateRoom} text="צור חדר" />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  dialogBody: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    margin: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ...add any other styles you had here
});
