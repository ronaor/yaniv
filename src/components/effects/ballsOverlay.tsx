import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import {StyleSheet, View} from 'react-native';
import BallEvent, {ThrowBallEvent} from './ballEvent';
import useSoundPool from '~/hooks/useSoundPool';
import {HIT_BALL_SOUND_POOL} from '~/sounds';

export interface BallsOverlayRef {
  throwBalls: (events: ThrowBallEvent[]) => void;
}
interface BallsOverlayProps {
  round: number;
}

const zIndexStyle = {zIndex: 999};
const BallsOverlay = forwardRef<BallsOverlayRef, BallsOverlayProps>(
  (props, ref) => {
    const {round} = props;

    const [ballEvents, setBallEvents] = useState<ThrowBallEvent[]>([]);

    const {playSound} = useSoundPool(HIT_BALL_SOUND_POOL);

    useEffect(() => {
      setBallEvents([]);
    }, [round]);

    useImperativeHandle(ref, () => ({
      throwBalls: (events: ThrowBallEvent[]) => {
        setBallEvents(events);
      },
    }));

    return (
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, zIndexStyle]}>
        {ballEvents.map((event, index) => (
          <BallEvent
            key={`${event.from}-${event.to}`}
            event={event}
            delayIndex={index}
            playSound={playSound}
          />
        ))}
      </View>
    );
  },
);

export default BallsOverlay;
