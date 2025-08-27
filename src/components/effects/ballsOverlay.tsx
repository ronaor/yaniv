import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import {StyleSheet, View} from 'react-native';
import BallEvent, {ThrowBallEvent} from './ballEvent';

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
          />
        ))}
      </View>
    );
  },
);

export default BallsOverlay;
