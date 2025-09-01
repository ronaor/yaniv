import {Easing, withTiming, useSharedValue} from 'react-native-reanimated';
import {useEffect} from 'react';
import {DirectionName} from '~/types/cards';
import {Dimensions} from 'react-native';

const {width: screenWidth, height: screenHeight} = Dimensions.get('screen');

/** Kill (throw-out) constants */
const KILL_DURATION = 4000;
const KILL_DIST_BASE = Math.max(screenWidth, screenHeight) * 0.45; // base throw distance
const KILL_LATERAL_WOBBLE = 30; // px random side wobble
const KILL_SPIN = 1000; // deg

export function useKillAnimation(kill: boolean, direction: DirectionName) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const rot = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const map: Record<DirectionName, {x: number; y: number}> = {
      up: {x: -1, y: -1},
      down: {x: -1, y: 2},
      left: {x: -1, y: 0},
      right: {x: 1, y: 0},
    };
    const d = map[direction] ?? {x: 0, y: -1};

    if (kill) {
      const dist = KILL_DIST_BASE * (0.85 + Math.random() * 0.5);
      const wobbleX = (Math.random() - 0.5) * KILL_LATERAL_WOBBLE;
      const wobbleY = (Math.random() - 0.5) * KILL_LATERAL_WOBBLE;
      const spinSign =
        direction === 'left'
          ? -1
          : direction === 'right'
          ? 1
          : Math.random() < 0.5
          ? -1
          : 1;

      tx.value = withTiming(d.x * dist + wobbleX, {
        duration: KILL_DURATION,
        easing: Easing.out(Easing.quad),
      });
      ty.value = withTiming(d.y * dist + wobbleY, {
        duration: KILL_DURATION,
        easing: Easing.out(Easing.quad),
      });
      rot.value = withTiming(KILL_SPIN * spinSign, {
        duration: KILL_DURATION,
        easing: Easing.out(Easing.quad),
      });
      scale.value = withTiming(0.9, {duration: KILL_DURATION});
      opacity.value = withTiming(0.6, {duration: KILL_DURATION});
    } else {
      const reset = {duration: 250};
      tx.value = withTiming(0, reset);
      ty.value = withTiming(0, reset);
      rot.value = withTiming(0, reset);
      scale.value = withTiming(1, reset);
      opacity.value = withTiming(1, reset);
    }
  }, [kill, direction, opacity, rot, scale, tx, ty]);

  return {tx, ty, rot, scale, opacity};
}
