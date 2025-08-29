import PoolBackground from './pool';
import IslandBackground from './island';
import BeachBackground from './beach';
import React, {useMemo} from 'react';
import CruiseShipDeckBackground from './cruiseShipDeck';
import BridgeBackground from './bridge';
import TempleTableBackground from './templeTable';

const backgrounds = [
  BeachBackground,
  IslandBackground,
  PoolBackground,
  BridgeBackground,
  CruiseShipDeckBackground,
  TempleTableBackground,
];
const POTENTIAL_BGS = 50;
const FIVE_MINUTES = 5 * 60 * 1000;

function RandomBackground() {
  const SelectedBackground = useMemo(() => {
    // Create pool of 50 by cycling through the backgrounds.length background COMPONENTS
    const pool = Array(POTENTIAL_BGS)
      .fill(undefined) // Must fill the array
      .map((_, i) => backgrounds[i % backgrounds.length]);

    const gameStartTime = new Date();
    const startTimeMs = gameStartTime.getTime();

    // Calculate deterministic index
    const index = Math.floor(startTimeMs / FIVE_MINUTES) % POTENTIAL_BGS;

    // Return the COMPONENT CONSTRUCTOR
    return pool[index];
  }, []);

  return <SelectedBackground />;
}

export default RandomBackground;
