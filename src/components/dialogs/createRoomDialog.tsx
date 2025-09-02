import React, {ReactNode, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import AlternatingRowsList from '~/components/menu/alternatingRowsList';
import MenuToggle from '~/components/menu/mainToggleSwitch';
import {RoomConfig} from '~/types/player';
import {GAME_CONFIG, SCREEN_WIDTH} from '~/utils/constants';
import {normalize} from '~/utils/ui';
import SelectionBar from '../menu/mainSelectionBar';
import SimpleButton from '../menu/simpleButton';
import XButton from '../menu/xButton';

type CreateRoomDialogProps = {
  isPlayWithComputer?: boolean;
  onCreateRoom: (data: RoomConfig) => void;
  onClose: () => void;
};

interface RowItemProps {
  text?: string;
  children?: ReactNode;
  isFirst?: boolean;
  isLast?: boolean;
  index?: number;
}

function RowItem({text, children}: RowItemProps) {
  return (
    <View style={styles.itemInner}>
      {text ? <Text style={styles.title}>{text}</Text> : null}
      {children}
    </View>
  );
}

type DifficultyKey = keyof typeof GAME_CONFIG.DEFAULT_VALUES; // 'Easy' | 'Medium' | 'Hard'

type RoomSettings = {
  difficulty: number;
  numberOfPlayers: number;
  slapDown: boolean;
  callYanivAt: number;
  maxScoreLimit: number;
};

const fromDifficultyKey = (key: DifficultyKey): RoomSettings => {
  const d = GAME_CONFIG.DEFAULT_VALUES[key];
  return {
    difficulty: d.difficulty,
    numberOfPlayers: d.numberOfPlayers,
    slapDown: d.slapDown,
    callYanivAt: d.callYanivIndex,
    maxScoreLimit: d.maxScoreIndex,
  };
};

export default function CreateRoomDialog({
  isPlayWithComputer,
  onCreateRoom,
  onClose,
}: CreateRoomDialogProps) {
  // סטייט יחיד שמחזיק את כל ההגדרות
  const [config, setConfig] = useState<RoomSettings>(() =>
    fromDifficultyKey('Medium'),
  );

  const handleCreateRoom = () => {
    onCreateRoom({
      slapDown: config.slapDown,
      canCallYaniv: +GAME_CONFIG.CALL_YANIV_OPTIONS[config.callYanivAt],
      maxMatchPoints: +GAME_CONFIG.MAX_SCORE_OPTIONS[config.maxScoreLimit],
      ...(isPlayWithComputer && {
        difficulty: GAME_CONFIG.DIFFICULTY[config.difficulty] as DifficultyKey,
        numberOfPlayers: +GAME_CONFIG.NUMBER_OF_PLAYERS[config.numberOfPlayers],
      }),
    });
  };

  const onSetGameDifficulty = (index: number) => {
    const key = GAME_CONFIG.DIFFICULTY[index] as DifficultyKey;
    setConfig(fromDifficultyKey(key));
  };

  return (
    <View style={styles.dialogBody}>
      <View style={styles.body}>
        <View style={styles.xButton}>
          <XButton onPress={onClose} />
        </View>

        <AlternatingRowsList colorOdd={['#692a00', '#873D00', '#7d3301']}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{'CREATE ROOM'}</Text>
          </View>

          {isPlayWithComputer && (
            <RowItem text={'Difficulty'}>
              <SelectionBar
                selectionIndex={config.difficulty}
                setSelection={onSetGameDifficulty}
                elements={GAME_CONFIG.DIFFICULTY}
                fontSize={15}
              />
            </RowItem>
          )}

          {isPlayWithComputer && (
            <RowItem text={'Players'}>
              <SelectionBar
                selectionIndex={config.numberOfPlayers}
                setSelection={idx =>
                  setConfig(s => ({...s, numberOfPlayers: idx}))
                }
                elements={GAME_CONFIG.NUMBER_OF_PLAYERS}
              />
            </RowItem>
          )}

          <RowItem text={'Enable Slap-Down'}>
            <MenuToggle
              isOn={config.slapDown}
              setIsOn={v => setConfig(s => ({...s, slapDown: v}))}
            />
          </RowItem>

          <RowItem text={'Call Yaniv at'}>
            <SelectionBar
              selectionIndex={config.callYanivAt}
              setSelection={idx => setConfig(s => ({...s, callYanivAt: idx}))}
              elements={GAME_CONFIG.CALL_YANIV_OPTIONS}
            />
          </RowItem>

          <RowItem text={'Max Score'}>
            <SelectionBar
              selectionIndex={config.maxScoreLimit}
              setSelection={idx => setConfig(s => ({...s, maxScoreLimit: idx}))}
              elements={GAME_CONFIG.MAX_SCORE_OPTIONS}
            />
          </RowItem>

          <RowItem>
            <View style={styles.buttonAdjuster}>
              <SimpleButton
                text="CREATE"
                onPress={handleCreateRoom}
                colors={['#A0D72C', '#3BA209', '#2C8408']}
              />
            </View>
          </RowItem>
        </AlternatingRowsList>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dialogBody: {
    margin: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    maxWidth: SCREEN_WIDTH - 42,
  },
  gradientHeader: {
    backgroundColor: '#843402',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 3,
    paddingTop: 3,
  },
  headerContent: {
    backgroundColor: '#A9500F',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffffff',
    padding: 10,
  },
  itemInner: {
    paddingHorizontal: 15,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
  },
  title: {
    color: '#F9F09D',
    fontSize: normalize(18),
    textAlign: 'left',
    fontWeight: '700',
  },
  buttonAdjuster: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  xButton: {position: 'absolute', zIndex: 10, right: -20, top: -20},
});
